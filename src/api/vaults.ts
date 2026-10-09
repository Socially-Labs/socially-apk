import { ApiError,type createApiClient } from './client.ts';
import { parseVaultSummary,type VaultOperation,type VaultPosition,type VaultCreateInput } from './generated/vault-contracts.ts';
export { parseVaultSummary } from './generated/vault-contracts.ts';
export type { VaultSummary,VaultOperation,VaultPosition,VaultCreateInput } from './generated/vault-contracts.ts';
const record=(v:unknown):v is Record<string,unknown>=>!!v && typeof v==='object' && !Array.isArray(v);
const amount=(v:unknown)=>typeof v==='string' && /^(0|[1-9]\d{0,23})\.\d{6}$/.test(v);
const uuid=(v:unknown)=>typeof v==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
function fail():never { throw new ApiError('invalid_response','The vault service returned an unexpected response.'); }
export interface VaultConfig { enabled:boolean; mode:'PAPER'; fundingWindowHours:number[]; durationDays:number[];
 captainSeedUsdc:string; minimumCapitalUsdc:string; maximumCapitalUsdc:string; minimumCrewDepositUsdc:string;
 performanceFeeBps:1000; exitPolicy:'LOCKED_UNTIL_SETTLEMENT'; residuePolicy:'RETAIN_AS_LIABILITY'; serverTime:string }
export interface VaultPreview extends VaultConfig { input:VaultCreateInput; availableUsdc:string; captainEligible:boolean; seedUsdc:string; networkCostUsdc:string }
function parseVaultConfig(v:unknown):VaultConfig {
 if (!record(v) || v.mode!=='PAPER' || typeof v.enabled!=='boolean' || v.performanceFeeBps!==1000 || v.exitPolicy!=='LOCKED_UNTIL_SETTLEMENT' ||
    v.residuePolicy!=='RETAIN_AS_LIABILITY' || typeof v.serverTime!=='string' || !Number.isFinite(Date.parse(v.serverTime)) ||
    !['captainSeedUsdc','minimumCapitalUsdc','maximumCapitalUsdc','minimumCrewDepositUsdc'].every(k=>amount(v[k])) ||
    !Array.isArray(v.fundingWindowHours) || v.fundingWindowHours.some(h=>![12,24,72].includes(h)) ||
    !Array.isArray(v.durationDays) || v.durationDays.some(d=>![3,7,14,21,28,30,60,90,180,365].includes(d))) fail();
   return v as unknown as VaultConfig;
}
export function parseVaultOperation(v:unknown):VaultOperation {
 if (!record(v) || !uuid(v.id) || !uuid(v.vaultId) || !uuid(v.eventId) || v.mode!=='PAPER' || v.status!=='SUCCEEDED' ||
  !['CREATE','CONTRIBUTE','CANCEL','CLAIM'].includes(String(v.kind)) || !amount(v.amountUsdc)) fail();
 return v as unknown as VaultOperation;
}
export function parseVaultPosition(v:unknown):VaultPosition {
 if (!record(v) || !uuid(v.vaultId) || !['availableUsdc','contributedUsdc','shares'].every(k=>amount(v[k])) ||
  !(v.investmentValueUsdc===null || amount(v.investmentValueUsdc)) || !amount(v.captainFeeUsdc) ||
  !(v.personalPnlUsdc===null || typeof v.personalPnlUsdc==='string' && /^-?(0|[1-9]\d{0,23})\.\d{6}$/.test(v.personalPnlUsdc)) ||
  !(v.claimableUsdc===null || amount(v.claimableUsdc)) || typeof v.claimPaid!=='boolean' || typeof v.isCaptain!=='boolean') fail();
 return v as unknown as VaultPosition;
}
export type VaultIntent={ kind:'CREATE'; body:VaultCreateInput } | { kind:'CONTRIBUTE'; vaultId:string; body:{ amountUsdc:string; termsHash:string } } |
 { kind:'CANCEL'|'CLAIM'; vaultId:string; body:Record<string,never> };
export function vaultsApi(client:ReturnType<typeof createApiClient>) {
 return {
  async uploadImage(id:string,kind:'avatar'|'banner',file:{ body:BodyInit; size:number },send:typeof fetch,signal:AbortSignal) {
   if (!Number.isInteger(file.size) || file.size<1 || file.size>5_242_880) throw new Error('Choose an image smaller than 5 MB.');
   const base=`/v1/vaults/${encodeURIComponent(id)}/assets/uploads`;
   const upload=await client.request(base,{ method:'POST',body:{ kind,contentType:'image/jpeg',byteSize:file.size },signal });
   const https=(value:unknown)=>{ try { const url=new URL(String(value)); return typeof value==='string' && url.protocol==='https:' && !url.username && !url.password; } catch { return false; } };
   if (!record(upload) || !uuid(upload.uploadId) || !https(upload.uploadUrl) || upload.kind!==kind || upload.method!=='PUT') fail();
   const result=await send(upload.uploadUrl as string,{ method:'PUT',headers:{ 'Content-Type':'image/jpeg' },body:file.body,signal });
   if (!result.ok) throw new Error('Image upload failed. Choose the image again.');
   const done=await client.request(`${base}/${upload.uploadId}/complete`,{ method:'POST',body:{},signal });
   if (!record(done) || !record(done.asset) || done.asset.id!==upload.uploadId || done.asset.kind!==kind || !https(done.asset.url)) fail();
   return done.asset.url as string;
  },
  async config(signal?:AbortSignal):Promise<VaultConfig> {
   const v=await client.request('/v1/vault-config',{ signal,authenticated:false });
   return parseVaultConfig(v);
  },
  async list(mine=false,after?:string,signal?:AbortSignal,durationGroup:'all'|'short'|'long'='all') {
   const query=new URLSearchParams(); if (after) query.set('after',after); if (durationGroup!=='all') query.set('durationGroup',durationGroup);
   const v=await client.request(`${mine?'/v1/me/vaults':'/v1/vaults'}${query.size?`?${query}`:''}`,{ signal,authenticated:mine });
   if (!record(v) || !Array.isArray(v.vaults) || v.vaults.length>50 || !(v.nextCursor===null || uuid(v.nextCursor))) fail();
   return { vaults:v.vaults.map(parseVaultSummary),nextCursor:v.nextCursor as string|null };
  },
  async detail(id:string,signal?:AbortSignal) { const v=parseVaultSummary(await client.request(`/v1/vaults/${encodeURIComponent(id)}`,{ signal,authenticated:false })); if (v.id!==id) fail(); return v; },
  async position(id:string,signal?:AbortSignal) { const v=parseVaultPosition(await client.request(`/v1/vaults/${encodeURIComponent(id)}/position`,{ signal })); if (v.vaultId!==id) fail(); return v; },
  async preview(body:VaultCreateInput,signal?:AbortSignal):Promise<VaultPreview> {
   const v=await client.request('/v1/vaults/preview',{ method:'POST',body,signal });
   parseVaultConfig(v);
   if (!record(v) || !record(v.input) || !amount(v.availableUsdc) || typeof v.captainEligible!=='boolean' ||
    v.seedUsdc!==v.captainSeedUsdc || !amount(v.seedUsdc) || v.networkCostUsdc!=='0.000000' ||
    v.input.name!==body.name || v.input.description!==body.description || v.input.fundingWindowHours!==body.fundingWindowHours ||
    v.input.durationDays!==body.durationDays || v.input.termsVersion!==body.termsVersion) fail();
   return v as unknown as VaultPreview;
  },
  async quote(id:string,body:{ amountUsdc:string; termsHash:string },signal?:AbortSignal) {
   const v=await client.request(`/v1/vaults/${encodeURIComponent(id)}/contribution-quotes`,{ method:'POST',body,signal });
   if (!record(v) || v.vaultId!==id || !amount(v.amountUsdc) || !amount(v.shares) || typeof v.allowed!=='boolean' || !(v.reason===null || typeof v.reason==='string') || v.reserved!==false) fail();
   return { amountUsdc:v.amountUsdc as string,allowed:v.allowed as boolean,reason:v.reason as string|null };
  },
  async recover(key:string,signal?:AbortSignal) { return parseVaultOperation(await client.request(`/v1/me/operations?clientRequestId=${encodeURIComponent(key)}`,{ signal })); },
  async submit(intent:VaultIntent,key:string,signal?:AbortSignal) {
   const path=intent.kind==='CREATE'?'/v1/vaults':`/v1/vaults/${encodeURIComponent(intent.vaultId)}/${intent.kind==='CONTRIBUTE'?'contributions':intent.kind==='CANCEL'?'contribution-cancellations':'claims'}`;
   const v=parseVaultOperation(await client.request(path,{ method:'POST',body:intent.body,idempotencyKey:key,signal }));
   if (v.kind!==intent.kind || intent.kind!=='CREATE' && v.vaultId!==intent.vaultId) fail(); return v;
  },
 };
}
