import { getApiOrigin } from '@/api/runtime-origin';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { AppState } from 'react-native';
import { VersionedTransaction } from '@solana/web3.js';
import { getBase64Decoder, getBase64Encoder } from '@solana/kit';
import { useAuth } from '@/auth/session';
import { ApiError, createApiClient } from '@/api/client';
import { swapsApi, type WalletSwap, type SwapQuote } from '@/api/swaps';
import { fromUnits, MAX_PRICE_IMPACT, quoteExpired, SOL_FEE_RESERVE, toUnits, validateSignedSwap, verifyPreparedSwap } from '@/api/solana-swap';
import { swapDecimals, type SwapToken } from '@/constants/solana-network';
import type { useSolanaBalance } from './use-solana-balance';
import { clearPendingSwap, loadPendingSwap, savePendingSwap, type PendingSwap } from '@/components/wallet/swap-storage';
import { startSwapQuotePolling } from '@/components/wallet/swap-quote-polling';

type Phase='editing'|'review'|'preparing'|'signing'|'sending'|'pending'|'confirmed'|'failed';
type State={key:string;phase:Phase;swap:WalletSwap|null;signature:string|null;error:string|null};
const terminal=(s:WalletSwap)=>['CONFIRMED','FAILED','EXPIRED'].includes(s.status);
const message=(e:unknown)=>e instanceof Error?e.message:'Couldn’t complete your swap. Please retry.';
export function useWalletSwap(balances:ReturnType<typeof useSolanaBalance>,active:boolean) {
  const auth=useAuth(),accountId=auth.accountId,wallet=balances.address;
  const identity=`${accountId}:${wallet}`,latest=useRef(identity),signer=useRef(auth.signSolanaTransaction),tokenGetter=useRef(auth.getAccessToken);
  useLayoutEffect(()=>{latest.current=identity;signer.current=auth.signSolanaTransaction;tokenGetter.current=auth.getAccessToken;},[identity,auth.signSolanaTransaction,auth.getAccessToken]);
  useLayoutEffect(()=>()=>{latest.current='';},[]);
  const api=useMemo(()=>swapsApi(createApiClient({origin:getApiOrigin(),getAccessToken:()=>tokenGetter.current(),timeoutMs:45000})),[]);
  const [input,setInput]=useState<SwapToken>('SOL'),[amount,setAmount]=useState(''),[revision,setRevision]=useState(0),[clock,setClock]=useState(Date.now);
  const [quotes,setQuotes]=useState<{key:string;quote:SwapQuote|null;loading:boolean;error:string|null}>({key:'',quote:null,loading:false,error:null});
  const [state,setState]=useState<State>({key:identity,phase:'editing',swap:null,signature:null,error:null});
  const [recovery,setRecovery]=useState({key:'',ready:false,error:null as string|null});
  const [recoveryRevision,setRecoveryRevision]=useState(0);
  const [checkingIdentity,setCheckingIdentity]=useState<string|null>(null);
  const executing=useRef(false),record=useRef<PendingSwap|null>(null);
  const [foreground,setForeground]=useState(AppState.currentState === 'active');
  const [quotePaused,setQuotePaused]=useState(false);
  const quotePausedRef=useRef(false);
  function pauseQuoteUpdates(paused:boolean){quotePausedRef.current=paused;setQuotePaused(paused);}
  useEffect(()=>{const subscription=AppState.addEventListener('change',value=>setForeground(value==='active'));return()=>subscription.remove();},[]);
  const current=state.key===identity?state:{key:identity,phase:'editing' as const,swap:null,signature:null,error:null};
  const phase=current.phase,busy=checkingIdentity===identity||['preparing','signing','sending'].includes(phase),locked=busy||['pending','confirmed'].includes(phase);
  const recovered=recovery.key===identity&&recovery.ready,quoteKey=`${identity}:${input}:${amount}:${revision}`;
  const quote=current.swap?.quote??(quotes.key===quoteKey?quotes.quote:null);
  // Once prepared, blockhash validity replaces quote TTL; the transaction is never rebuilt while signing.
  const expired=current.swap?['EXPIRED','FAILED'].includes(current.swap.status):!!quote&&quoteExpired(quote,clock);
  let validation:string|null=null,units=0n;
  try {
    if(amount)units=toUnits(amount,swapDecimals(input));
    const available=input==='SOL'?balances.amount:balances.usdcAmount;
    if(units>0n&&available!==null) {
      const raw=toUnits(available,swapDecimals(input));
      if(units>raw)validation=`Not enough ${input} in your wallet.`;
      else if(input==='SOL'&&raw-units<SOL_FEE_RESERVE)validation='Keep 0.01 SOL for fees and token account rent.';
    }
  } catch(e){validation=message(e);}
  if(!validation&&amount&&balances.error)validation=balances.error;
  if(!validation&&units>0n&&(balances.amount===null||balances.usdcAmount===null))validation='Waiting for your wallet balances…';
  if(!validation&&quote&&quote.priceImpact>MAX_PRICE_IMPACT)validation='Price impact exceeds 5%. Try a smaller amount.';

  async function showSwap(s:WalletSwap) {
    if(s.wallet!==wallet)throw new Error('The swap belongs to another wallet.');
    if(latest.current!==identity)return;
    if(terminal(s)&&accountId&&wallet){await clearPendingSwap(accountId,wallet);if(latest.current===identity)record.current=null;}
    if(latest.current!==identity)return;
    setInput(s.quote.input);setAmount(fromUnits(s.quote.amount,swapDecimals(s.quote.input)));
    setState({key:identity,phase:s.status==='PREPARED'?'review':s.status==='CONFIRMED'?'confirmed':terminal(s)?'failed':'pending',swap:s,signature:s.signature,
      error:s.status==='FAILED'?'Your swap was not completed. Refresh the quote to try again.':s.status==='EXPIRED'?'The transaction expired. Refresh the quote.':null});
    if(terminal(s))balances.refresh();
  }
  useEffect(()=>{
    if(!accountId||!wallet)return;
    let stopped=false;
    record.current=null;setRecovery({key:identity,ready:false,error:null});
    void(async()=>{
      const saved=await loadPendingSwap(accountId,wallet);
      if(stopped)return;
      record.current=saved;
      let s:WalletSwap|undefined;
      if(saved) {
        try {s=saved.intentId?await api.get(saved.intentId):await api.prepare(saved.quoteId,saved.clientRequestId);}
        catch(e) {
          if(!saved.signedTransaction&&e instanceof ApiError&&['quote_expired','quote_not_found'].includes(e.code)) {
            await clearPendingSwap(accountId,wallet);if(!stopped)record.current=null;
          } else throw e;
        }
        if(s&&s.status==='PREPARED'&&saved.signedTransaction)s=await api.submit(s.id,saved.signedTransaction);
      } else {
        // A reinstall or another device may have submitted a swap with no local record.
        s=(await api.list('SUBMITTED')).find(item=>item.wallet===wallet);
      }
      if(stopped)return;
      if(s)await showSwap(s);
      if(!stopped)setRecovery({key:identity,ready:true,error:null});
    })().catch(e=>{if(!stopped)setRecovery({key:identity,ready:false,error:message(e)});});
    return()=>{stopped=true;};
  // Recovery is tied to account and wallet; ordinary balance refreshes must not replay it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[accountId,wallet,identity,api,recoveryRevision]);
  useEffect(()=>{if(!active||!foreground)return;setClock(Date.now());const timer=setInterval(()=>setClock(Date.now()),1000);return()=>clearInterval(timer);},[active,foreground]);
  useEffect(()=>{
    if(!active||!foreground||quotePaused||!recovered||locked||phase==='review'||!wallet||units<=0n||validation)return;
    return startSwapQuotePolling({
      request:signal=>api.quote(input,units.toString(),wallet,signal),
      onLoading:()=>setQuotes(previous=>({key:quoteKey,quote:previous.key===quoteKey?previous.quote:null,loading:true,error:null})),
      onQuote:q=>{if(latest.current===identity&&!executing.current&&!quotePausedRef.current)setQuotes({key:quoteKey,quote:q,loading:false,error:null});},
      onError:e=>{if(latest.current===identity&&!executing.current&&!quotePausedRef.current)setQuotes(previous=>({key:quoteKey,quote:previous.key===quoteKey?previous.quote:null,loading:false,error:message(e)}));},
    });
  },[active,foreground,quotePaused,recovered,locked,phase,wallet,units,input,quoteKey,api,identity,validation]);
  // Continue status tracking when the sheet is closed; only the backend talks to RPC.
  useEffect(()=>{
    if(!['pending','review'].includes(phase)||!current.swap)return;
    let stopped=false;let timer:ReturnType<typeof setTimeout>;
    const id=current.swap.id;
    const poll=async()=>{
      try {
        let s=await api.get(id);
        const saved=record.current;
        if(!stopped&&s.status==='PREPARED'&&saved?.signedTransaction)s=await api.submit(id,saved.signedTransaction);
        if(!stopped&&!executing.current)await showSwap(s);
      }
      catch(e){if(!stopped)setState(prev=>({...prev,error:message(e)}));}
      finally{if(!stopped)timer=setTimeout(poll,phase==='review'?5000:2500);}
    };
    timer=setTimeout(poll,1500);return()=>{stopped=true;clearTimeout(timer);};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[phase,current.swap?.id,identity,api]);

  function edit(value:string) {
    if(locked||executing.current)return;
    setAmount(value);setState({key:identity,phase:'editing',swap:null,signature:null,error:null});record.current=null;
    if(accountId&&wallet)void clearPendingSwap(accountId,wallet).catch(e=>setRecovery({key:identity,ready:false,error:message(e)}));
  }
  function reverse(){if(locked||executing.current)return;setInput(v=>v==='SOL'?'USDC':'SOL');edit('');}
  function max(){const balance=input==='SOL'?balances.amount:balances.usdcAmount;if(balance===null)return;let n=toUnits(balance,swapDecimals(input));if(input==='SOL')n=n>SOL_FEE_RESERVE?n-SOL_FEE_RESERVE:0n;edit(fromUnits(n,swapDecimals(input)));}
  function refreshQuote(){if(locked||executing.current)return;if(!recovered){setRecoveryRevision(v=>v+1);return;}edit(amount);setRevision(v=>v+1);balances.refresh();}
  async function submit() {
    if(executing.current||busy||!recovered||!accountId||!wallet)return;
    if(phase==='pending'&&current.swap) {
      executing.current=true;setCheckingIdentity(identity);setState(p=>({...p,error:null}));
      try {
        const saved=record.current;
        const s=saved?.signedTransaction?await api.submit(current.swap.id,saved.signedTransaction):await api.get(current.swap.id);
        await showSwap(s);
      }catch(e){if(latest.current===identity)setState(p=>({...p,error:message(e)}));}finally{executing.current=false;setCheckingIdentity(null);}
      return;
    }
    if(!quote||validation||expired||(!current.swap&&quoteExpired(quote))||!signer.current)return;
    executing.current=true;
    let signedSaved=false;
    try {
      if(phase!=='review'||!current.swap) {
        setState({key:identity,phase:'preparing',swap:null,signature:null,error:null});
        const request:PendingSwap={accountId,wallet,quoteId:quote.id,clientRequestId:randomUUID()};
        await savePendingSwap(request);record.current=request;
        const s=await api.prepare(request.quoteId,request.clientRequestId);
        if(latest.current!==identity)return;
        if(s.wallet!==wallet||s.quote.amount!==quote.amount||s.quote.input!==quote.input||s.quote.minimumOutput!==quote.minimumOutput)throw new Error('The prepared swap differs from your quote.');
        record.current={...request,intentId:s.id};await savePendingSwap(record.current);
        await showSwap(s);return;
      }
      const s=current.swap;
      if(!s.transaction)throw new Error('Refresh your quote before signing.');
      const unsigned=VersionedTransaction.deserialize(new Uint8Array(getBase64Encoder().encode(s.transaction)));
      setState(p=>({...p,phase:'preparing',error:null}));
      await verifyPreparedSwap(quote,unsigned,wallet,undefined,s.fees);
      if(latest.current!==identity)return;
      setState(p=>({...p,phase:'signing'}));
      const bytes=await signer.current!(unsigned.serialize(),wallet);
      const signed=validateSignedSwap(unsigned,bytes);
      // Store deterministic signed bytes before the backend send. A lost HTTP reply is recoverable.
      const saved:PendingSwap={accountId,wallet,quoteId:s.quoteId,clientRequestId:s.clientRequestId,intentId:s.id,
        signedTransaction:getBase64Decoder().decode(signed.transaction.serialize()),signature:signed.signature,blockhash:s.blockhash};
      await savePendingSwap(saved);signedSaved=true;
      if(latest.current!==identity)return;
      record.current=saved;setState(p=>({...p,phase:'sending',signature:signed.signature}));
      const submitted=await api.submit(s.id,saved.signedTransaction!);await showSwap(submitted);
    } catch(e) {
      if(latest.current===identity) {
        setState(p=>({...p,phase:signedSaved?'pending':p.swap?'review':'editing',signature:signedSaved?record.current?.signature??p.signature:p.signature,error:message(e)}));
        if(!signedSaved&&!current.swap) setRecovery({key:identity,ready:false,error:'Couldn’t finish preparing. Retry to recover the same swap request.'});
      }
    }finally{executing.current=false;}
  }
  function reset(){if(busy||phase==='pending'||executing.current)return;edit('');balances.refresh();}
  return {input,output:input==='SOL'?'USDC' as const:'SOL' as const,amount,edit,reverse,max,refreshQuote,submit,reset,pauseQuoteUpdates,
    quote,fees:current.swap?.fees??null,filledOutputRaw:current.swap?.filledOutputRaw??null,expired,phase,busy,locked,signature:current.signature,validation,
    error:(recovery.key===identity?recovery.error:null)??current.error??(quotes.key===quoteKey?quotes.error:null),
    quoting:quotes.key===quoteKey&&quotes.loading,secondsLeft:quote?Math.max(0,Math.ceil((Date.parse(quote.expiresAt)-clock)/1000)):0,
    canSubmit:recovered&&(phase==='pending'||!!quote&&!validation&&!expired&&!!wallet&&!!signer.current&&!busy),walletReady:!!wallet&&!!signer.current};
}
