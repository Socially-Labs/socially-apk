import { settingsStorage } from '@/components/settings/settings-storage';
export type PendingSwap = {
  accountId:string; wallet:string; quoteId:string; clientRequestId:string;
  intentId?:string; signedTransaction?:string; signature?:string; blockhash?:string;
};
const uuid=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const key=(accountId:string,wallet:string)=>`socially.swap.devnet.v2.${accountId.replace(/[^a-zA-Z0-9._-]/g,'_')}.${wallet}`;
// SecureStore writes are asynchronous on native. Keep an earlier edit/clear from
// completing after the signed transaction has been saved for recovery.
const writes=new Map<string,Promise<void>>();
function write(storageKey:string,value:string) {
  const pending=(writes.get(storageKey)??Promise.resolve()).catch(()=>{}).then(()=>settingsStorage.write(storageKey,value));
  writes.set(storageKey,pending);
  void pending.finally(()=>{if(writes.get(storageKey)===pending)writes.delete(storageKey);}).catch(()=>{});
  return pending;
}
export async function loadPendingSwap(accountId:string,wallet:string):Promise<PendingSwap|null> {
  await writes.get(key(accountId,wallet));
  const raw=await settingsStorage.read(key(accountId,wallet));
  if(!raw)return null;
  const r=JSON.parse(raw);
  if(r?.accountId!==accountId||r.wallet!==wallet||!uuid(r.quoteId)||!uuid(r.clientRequestId)||!(r.intentId===undefined||uuid(r.intentId))||
      !(r.signedTransaction===undefined||typeof r.signedTransaction==='string'&&r.signedTransaction.length<=1644&&/^[A-Za-z0-9+/]+={0,2}$/.test(r.signedTransaction))||
      !(r.signature===undefined||typeof r.signature==='string'&&/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(r.signature))||
      !(r.blockhash===undefined||typeof r.blockhash==='string'&&/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(r.blockhash))||
      r.signedTransaction!==undefined&&(!r.intentId||!r.signature||!r.blockhash))throw new Error('Couldn’t restore your previous swap. Please retry.');
  return r;
}
export async function savePendingSwap(record:PendingSwap) {await write(key(record.accountId,record.wallet),JSON.stringify(record));}
export async function clearPendingSwap(accountId:string,wallet:string) {await write(key(accountId,wallet),'');}
