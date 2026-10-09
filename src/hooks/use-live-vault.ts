import { useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { CryptoDigestAlgorithm,digestStringAsync,randomUUID } from 'expo-crypto';
import { Buffer } from 'buffer';
import { VersionedTransaction } from '@solana/web3.js';
import { ApiError,createApiClient } from '@/api/client';
import { liveVaultsApi,type LiveCreate,type LiveOperation } from '@/api/live-vaults';
import { orderStorage } from '@/api/market-order-storage';
import { assertDevnet,swapConnection } from '@/api/solana-swap';
import { useAuth } from '@/auth/session';

type Attempt={key:string;body:LiveCreate}|{key:string;vaultId:string};
export const liveTerminal=(op:LiveOperation)=>['CONFIRMED','FAILED','EXPIRED'].includes(op.status);
export function useLiveVault(scope='create') {
 const auth=useAuth(),identity=`${auth.isAuthenticated?auth.accountId:null}:${auth.solanaAddress}:${scope}`;
 const latest=useRef(identity),session=useRef(auth);
 useLayoutEffect(()=>{latest.current=identity;session.current=auth;},[identity,auth]);
 const {getAccessToken}=auth;
 const api=useMemo(()=>liveVaultsApi(createApiClient({origin:process.env.EXPO_PUBLIC_API_URL,getAccessToken,timeoutMs:60000})),[getAccessToken]);
 const [op,setOp]=useState<LiveOperation|null>(null),[attempt,setAttempt]=useState<Attempt|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 const storage=useRef<string|null>(null),lock=useRef(false),epoch=useRef(0);
 useEffect(()=>{
  const generation=++epoch.current;let active=true;lock.current=false;storage.current=null;
  void(async()=>{await Promise.resolve();if(!active)return;setReady(false);setOp(null);setAttempt(null);setError(null);setBusy(false);
   if(!auth.isAuthenticated||!auth.accountId||!auth.solanaAddress)return;
   try{
   const key=`live-vault-${await digestStringAsync(CryptoDigestAlgorithm.SHA256,identity)}`;if(!active)return;storage.current=key;
   const saved=await orderStorage.read(key);if(!active)return;
   if(saved){const parsed=JSON.parse(saved) as Attempt;if(!parsed||typeof parsed.key!=='string'||!('body'in parsed||'vaultId'in parsed))throw Error('Invalid saved vault request');setAttempt(parsed);
    try{const recovered=await api.recover(parsed.key);if(active)setOp(recovered);}catch(e){if(!(e instanceof ApiError&&e.status===404))throw e;}
   }else{const pending=await api.pending();const found=pending.find(o=>o.wallet===auth.solanaAddress&&(scope==='create'?o.kind==='CREATE':o.kind==='EXIT'&&o.vaultId===scope));if(found&&active){setOp(found);const recovered={key:found.clientRequestId,vaultId:found.vaultId};setAttempt(recovered);await orderStorage.write(key,JSON.stringify(recovered));}}
   if(active)setReady(true);
  }catch(e){if(active)setError(e instanceof Error?e.message:'Could not recover vault funding.');}finally{if(active&&epoch.current===generation)setBusy(false);}})();
  return()=>{active=false;};
 },[api,identity,auth.isAuthenticated,auth.accountId,auth.solanaAddress,scope]);
 useFocusEffect(useCallback(()=>{
  if(!op||liveTerminal(op))return;let stopped=false,timer:ReturnType<typeof setTimeout>|undefined;const id=identity,key=op.clientRequestId,controller=new AbortController();
  const poll=async()=>{if(stopped||AppState.currentState==='background'||AppState.currentState==='inactive')return;try{const next=await api.recover(key,controller.signal);if(!stopped&&latest.current===id){setOp(next);setError(null);if(liveTerminal(next))return;}}catch(e){if(!stopped&&latest.current===id)setError(e instanceof Error?e.message:'Could not refresh confirmation.');}if(!stopped)timer=setTimeout(()=>void poll(),3000);};
  timer=setTimeout(()=>void poll(),3000);const sub=AppState.addEventListener('change',status=>{if(status==='active'){clearTimeout(timer);void poll();}else clearTimeout(timer);});
  return()=>{stopped=true;controller.abort();clearTimeout(timer);sub.remove();};
 },[api,identity,op]));
 const run=async(work:(valid:()=>boolean)=>Promise<void>)=>{if(lock.current||!ready)return;const id=identity,generation=epoch.current;lock.current=true;setBusy(true);setError(null);try{await work(()=>latest.current===id&&epoch.current===generation);}catch(e){if(latest.current===id&&epoch.current===generation)setError(e instanceof Error?e.message:'Vault request failed.');}finally{if(latest.current===id&&epoch.current===generation){lock.current=false;setBusy(false);}}};
 const prepare=async(body?:Omit<LiveCreate,'clientRequestId'|'wallet'>)=>run(async valid=>{
  if(!storage.current||!session.current.solanaAddress)throw Error('Sign in with your wallet first.');
  const saved=attempt??(scope==='create'?{key:randomUUID(),body:{...body!,clientRequestId:'',wallet:session.current.solanaAddress}}:{key:randomUUID(),vaultId:scope});
  if('body'in saved)saved.body.clientRequestId=saved.key;
  await orderStorage.write(storage.current,JSON.stringify(saved));if(!valid())return;setAttempt(saved);
  try{const next='body'in saved?await api.prepare(saved.body):await api.exit(saved.vaultId,saved.key);if(valid())setOp(next);}
  catch(e){if(valid()&&e instanceof ApiError&&[400,403,422].includes(e.status)){await orderStorage.remove(storage.current);if(valid())setAttempt(null);}throw e;}
 });
 const confirm=async()=>run(async valid=>{
  if(!op||op.status!=='PREPARED'||!op.transaction||!session.current.signSolanaTransaction||op.wallet!==session.current.solanaAddress)throw Error('Connect the wallet that prepared this transaction.');
  const connection=swapConnection();await assertDevnet(connection);if(!valid())return;
  if(await connection.getBlockHeight('confirmed')>op.lastValidBlockHeight)throw Error('Transaction expired. Wait for expiry confirmation, then prepare again.');
  const tx=VersionedTransaction.deserialize(Buffer.from(op.transaction,'base64'));
  if(tx.message.header.numRequiredSignatures!==1||tx.message.staticAccountKeys[0]?.toBase58()!==op.wallet)throw Error('Transaction signer does not match your wallet.');
  const signed=await session.current.signSolanaTransaction(tx.serialize(),op.wallet);if(!valid())return;
  const verified=VersionedTransaction.deserialize(signed);if(!Buffer.from(verified.message.serialize()).equals(Buffer.from(tx.message.serialize())))throw Error('Signed transaction changed.');
  const next=await api.submit(op,Buffer.from(signed).toString('base64'));if(valid())setOp(next);
 });
 const reset=async()=>{if(busy||op&&!liveTerminal(op))return;if(storage.current)await orderStorage.remove(storage.current);setAttempt(null);setOp(null);setError(null);};
 return {api,op,attempt,ready,busy,error,prepare,confirm,reset};
}
