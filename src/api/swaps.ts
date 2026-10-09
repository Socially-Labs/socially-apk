import { ApiError, type createApiClient } from './client.ts';
import { swapMint, type SwapToken } from '../constants/solana-network.ts';
export interface VenueFee { mint:string; amountRaw:string }
export interface SwapQuote {
  id:string; wallet:string; cluster:'devnet'; input:SwapToken; output:SwapToken; amount:string; outputAmount:string; minimumOutput:string;
  priceImpact:number; slippageBps:number; hops:number; expiresAt:string; venueFees:VenueFee[]|null;
}
export interface SwapFees { networkFeeLamports:string; priorityFeeLamports:string; accountRentLamports:string }
export interface WalletSwap {
  id:string; quoteId:string; clientRequestId:string; wallet:string; cluster:'devnet';
  status:'PREPARED'|'SUBMITTED'|'CONFIRMED'|'FAILED'|'EXPIRED'; quote:SwapQuote;
  transaction:string|null; signature:string|null; blockhash:string; lastValidBlockHeight:number; fees:SwapFees;
  filledOutputRaw:string|null; actualNetworkFeeLamports:string|null; failure:string|null; createdAt:string; updatedAt:string;
}
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const address=(v:unknown):v is string=>typeof v==='string'&&/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v);
const raw=(v:unknown):v is string=>typeof v==='string'&&/^(0|[1-9]\d{0,19})$/.test(v)&&BigInt(v)<=18446744073709551615n;
const fees=(v:unknown):v is SwapFees=>record(v)&&raw(v.networkFeeLamports)&&raw(v.priorityFeeLamports)&&raw(v.accountRentLamports);
const date=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v));
function fail():never {throw new ApiError('invalid_response','The swap service returned an unexpected response.');}
export function parseSwapQuote(v:unknown):SwapQuote {
  if(!record(v)||!uuid(v.id)||!address(v.wallet)||v.cluster!=='devnet'||!['SOL','USDC'].includes(String(v.input))||
      v.output!==(v.input==='SOL'?'USDC':'SOL')||!raw(v.amount)||BigInt(v.amount)<=0n||!raw(v.outputAmount)||BigInt(v.outputAmount)<=0n||
      !raw(v.minimumOutput)||BigInt(v.minimumOutput)<=0n||BigInt(v.minimumOutput)>BigInt(v.outputAmount)||
      typeof v.slippageBps!=='number'||!Number.isInteger(v.slippageBps)||v.slippageBps<1||v.slippageBps>100||
      BigInt(v.minimumOutput)<BigInt(v.outputAmount)*BigInt(10000-v.slippageBps)/10000n||
      typeof v.priceImpact!=='number'||!Number.isFinite(v.priceImpact)||v.priceImpact<0||v.priceImpact>5||
      typeof v.hops!=='number'||!Number.isInteger(v.hops)||v.hops<1||v.hops>4||!date(v.expiresAt)||
      !(v.venueFees===null||Array.isArray(v.venueFees)&&v.venueFees.every(f=>record(f)&&address(f.mint)&&raw(f.amountRaw))))fail();
  return v as unknown as SwapQuote;
}
export function parseWalletSwap(v:unknown):WalletSwap {
  if(!record(v)||!uuid(v.id)||!uuid(v.quoteId)||!uuid(v.clientRequestId)||!address(v.wallet)||v.cluster!=='devnet'||
      !['PREPARED','SUBMITTED','CONFIRMED','FAILED','EXPIRED'].includes(String(v.status))||!address(v.blockhash)||
      typeof v.lastValidBlockHeight!=='number'||!Number.isSafeInteger(v.lastValidBlockHeight)||v.lastValidBlockHeight<1||
      !fees(v.fees)||
      !(v.transaction===null||typeof v.transaction==='string'&&v.transaction.length<=1644&&/^[A-Za-z0-9+/]+={0,2}$/.test(v.transaction))||
      !(v.signature===null||typeof v.signature==='string'&&/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(v.signature))||
      !(v.filledOutputRaw===null||raw(v.filledOutputRaw))||!(v.actualNetworkFeeLamports===null||raw(v.actualNetworkFeeLamports))||
      !(v.failure===null||typeof v.failure==='string')||!date(v.createdAt)||!date(v.updatedAt))fail();
  const quote=parseSwapQuote(v.quote);
  if(quote.id!==v.quoteId||quote.wallet!==v.wallet||v.status==='PREPARED'&&(v.transaction===null||v.signature!==null)||
      ['SUBMITTED','CONFIRMED'].includes(String(v.status))&&v.signature===null||v.status==='CONFIRMED'&&(v.filledOutputRaw===null||v.actualNetworkFeeLamports===null)||
      BigInt(v.fees.priorityFeeLamports as string)>BigInt(v.fees.networkFeeLamports as string))fail();
  return {...v,quote} as unknown as WalletSwap;
}
export function swapsApi(client:Pick<ReturnType<typeof createApiClient>,'request'>) {
  const one=async(path:string,options?:Parameters<typeof client.request>[1])=>{
    const v=await client.request(path,options);if(!record(v))fail();return parseWalletSwap(v.swap);
  };
  return {
    async quote(input:SwapToken,amountRaw:string,wallet:string,signal?:AbortSignal) {
      const v=await client.request('/v1/me/swaps/quotes',{method:'POST',body:{input,amountRaw,wallet},signal});if(!record(v))fail();
      const q=parseSwapQuote(v.quote);if(q.input!==input||q.amount!==amountRaw||q.wallet!==wallet)fail();return q;
    },
    async prepare(quoteId:string,clientRequestId:string) {
      const v=await one('/v1/me/swaps',{method:'POST',body:{quoteId,clientRequestId}});
      if(v.quoteId!==quoteId||v.clientRequestId!==clientRequestId)fail();return v;
    },
    async get(id:string) {const v=await one(`/v1/me/swaps/${id}`);if(v.id!==id)fail();return v;},
    async submit(id:string,signedTransaction:string) {
      const v=await one(`/v1/me/swaps/${id}/submit`,{method:'POST',body:{signedTransaction}});if(v.id!==id)fail();return v;
    },
    async list(status?:WalletSwap['status']) {
      const v=await client.request(`/v1/me/swaps?limit=50${status?`&status=${status}`:''}`);
      if(!record(v)||!Array.isArray(v.swaps)||v.swaps.length>50||!(v.nextCursor===null||uuid(v.nextCursor)))fail();
      return v.swaps.map(parseWalletSwap);
    },
  };
}
export const feeToken=(mint:string):SwapToken|null=>mint===swapMint('SOL')?'SOL':mint===swapMint('USDC')?'USDC':null;
