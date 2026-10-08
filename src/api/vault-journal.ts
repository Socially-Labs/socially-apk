import { ApiError } from './client.ts';
import type { VaultIntent,vaultsApi } from './vaults.ts';
export type VaultAttempt={ subject:string; mode:'PAPER'; key:string; intent:VaultIntent };
export interface IntentStorage { read:(key:string)=>Promise<string|null>; write:(key:string,value:string)=>Promise<void>; remove:(key:string)=>Promise<void> }
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function parseVaultAttempt(raw:string,subject:string):VaultAttempt {
 const v=JSON.parse(raw) as VaultAttempt;
 if (!v || v.subject!==subject || v.mode!=='PAPER' || typeof v.key!=='string' || !uuid.test(v.key) || !v.intent || !v.intent.body ||
  !['CREATE','CONTRIBUTE','CANCEL','CLAIM'].includes(v.intent.kind)) throw new Error('Vault request recovery data is invalid.');
 if (v.intent.kind!=='CREATE' && !uuid.test(v.intent.vaultId)) throw new Error('Vault request recovery data is invalid.');
 if (v.intent.kind==='CONTRIBUTE' && (typeof v.intent.body.amountUsdc!=='string' || !/^(0|[1-9]\d{0,23})(\.\d{1,6})?$/.test(v.intent.body.amountUsdc) ||
  typeof v.intent.body.termsHash!=='string' || !/^[a-f0-9]{64}$/.test(v.intent.body.termsHash))) throw new Error('Vault request recovery data is invalid.');
 if (v.intent.kind==='CREATE' && (typeof v.intent.body.name!=='string' || typeof v.intent.body.description!=='string' ||
  v.intent.body.termsVersion!==1 || ![12,24,72].includes(v.intent.body.fundingWindowHours) || ![3,7,14,21,28,30,60,90,180,365].includes(v.intent.body.durationDays))) throw new Error('Vault request recovery data is invalid.');
 return v;
}
/** Persist before sending; storage failure prevents a new financial request. */
export async function submitVaultAttempt(api:ReturnType<typeof vaultsApi>,storage:IntentStorage,storageKey:string,attempt:VaultAttempt,signal?:AbortSignal) {
 await storage.write(storageKey,JSON.stringify(attempt));
 if (signal?.aborted) throw new ApiError('request_cancelled','Request cancelled.');
 let result;
 try { result=await api.submit(attempt.intent,attempt.key,signal); }
 catch (error) {
  // Known transactional rejection has no financial effect; uncertain transport/server outcomes retain the exact intent.
  if (error instanceof ApiError && error.code==='vault_request_rejected') await storage.remove(storageKey);
  throw error;
 }
 await storage.remove(storageKey);
 return result;
}
