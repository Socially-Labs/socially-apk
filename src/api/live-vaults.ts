import { ApiError, type createApiClient } from './client.ts';
export type FundingAsset='SOL'|'USDC';
export interface LiveCreate {clientRequestId:string;wallet:string;asset:FundingAsset;amountRaw:string;name:string;description:string}
export interface LiveOperation {id:string;clientRequestId:string;vaultId:string;fundAddress:string;wallet:string;seedUsdcRaw:string;kind:'CREATE'|'EXIT';mode:'ONCHAIN';cluster:'devnet';asset:FundingAsset|'SHARES';amountRaw:string;
 status:'PREPARED'|'SUBMITTED'|'CONFIRMED'|'FAILED'|'EXPIRED';transaction:string|null;signature:string|null;lastValidBlockHeight:number;
 fees:{networkFeeLamports:string;priorityFeeLamports:string;accountRentLamports:string};failure:string|null}
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(v);
const raw=(v:unknown):v is string=>typeof v==='string'&&/^(0|[1-9]\d{0,19})$/.test(v)&&BigInt(v)<=18446744073709551615n;
const address=(v:unknown):v is string=>typeof v==='string'&&/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v);
function fail():never {throw new ApiError('invalid_response','The onchain vault service returned an invalid response.');}
export function parseLiveOperation(v:unknown):LiveOperation {
 if(!record(v)||!uuid(v.id)||!uuid(v.clientRequestId)||!uuid(v.vaultId)||!address(v.fundAddress)||!address(v.wallet)||!raw(v.seedUsdcRaw)||BigInt(v.seedUsdcRaw)<100000000n||
  !['CREATE','EXIT'].includes(String(v.kind))||v.mode!=='ONCHAIN'||v.cluster!=='devnet'||!['SOL','USDC','SHARES'].includes(String(v.asset))||!raw(v.amountRaw)||v.amountRaw==='0'||
  (v.kind==='EXIT')!==(v.asset==='SHARES')||!['PREPARED','SUBMITTED','CONFIRMED','FAILED','EXPIRED'].includes(String(v.status))||
  !(v.signature===null||typeof v.signature==='string')||!(v.failure===null||typeof v.failure==='string')||!Number.isSafeInteger(v.lastValidBlockHeight)||Number(v.lastValidBlockHeight)<1||
  !record(v.fees)||!['networkFeeLamports','priorityFeeLamports','accountRentLamports'].every(k=>raw((v.fees as Record<string,unknown>)[k]))||
  (v.status==='PREPARED'?typeof v.transaction!=='string'||v.transaction.length>1644||!/^[A-Za-z0-9+/]+={0,2}$/.test(v.transaction):v.transaction!==null))fail();
 return v as unknown as LiveOperation;
}
export function liveVaultsApi(client:ReturnType<typeof createApiClient>) {
 const operation=(v:unknown)=>{if(!record(v))fail();return parseLiveOperation(v.operation);};
 return {
  async config(signal?:AbortSignal){const v=await client.request('/v1/live-vaults/config',{authenticated:false,signal});if(!record(v)||v.mode!=='ONCHAIN'||v.cluster!=='devnet'||typeof v.enabled!=='boolean'||!(v.reason===null||typeof v.reason==='string')||v.minimumSeedUsdcRaw!=='100000000'||v.exitPolicy!=='IN_KIND_ON_DEMAND'||v.settlementAsset!=='USDC'||v.performanceFeeBps!==1000||!Array.isArray(v.assets)||v.assets.join(',')!=='SOL,USDC')fail();return {enabled:v.enabled,reason:v.reason as string|null};},
  async prepare(body:LiveCreate){const v=operation(await client.request('/v1/live-vaults',{method:'POST',body}));if(v.clientRequestId!==body.clientRequestId||v.kind!=='CREATE'||v.wallet!==body.wallet||v.asset!==body.asset||v.amountRaw!==body.amountRaw)fail();return v;},
  async exit(vaultId:string,clientRequestId:string){const v=operation(await client.request(`/v1/live-vaults/${encodeURIComponent(vaultId)}/exits`,{method:'POST',body:{clientRequestId}}));if(v.vaultId!==vaultId||v.kind!=='EXIT'||v.clientRequestId!==clientRequestId)fail();return v;},
  async recover(key:string,signal?:AbortSignal){const v=operation(await client.request(`/v1/me/live-vault-operations?clientRequestId=${encodeURIComponent(key)}`,{signal}));if(v.clientRequestId!==key)fail();return v;},
  async pending(signal?:AbortSignal){const v=await client.request('/v1/me/live-vault-pending',{signal});if(!record(v)||!Array.isArray(v.operations)||v.operations.length>10)fail();return v.operations.map(parseLiveOperation);},
  async submit(op:LiveOperation,signedTransaction:string){const v=operation(await client.request(`/v1/live-vault-operations/${op.id}/submit`,{method:'POST',body:{signedTransaction}}));if(v.id!==op.id||v.vaultId!==op.vaultId||v.wallet!==op.wallet||v.kind!==op.kind)fail();return v;},
  async list(signal?:AbortSignal){const v=await client.request('/v1/me/live-vaults',{signal});if(!record(v)||!Array.isArray(v.vaults)||v.vaults.length>50)fail();return v.vaults.map(x=>{if(!record(x)||!uuid(x.id)||typeof x.name!=='string'||!address(x.fundAddress)||!raw(x.seedUsdcRaw))fail();return {id:x.id as string,name:x.name as string,fundAddress:x.fundAddress as string,seedUsdcRaw:x.seedUsdcRaw as string};});},
  async detail(id:string,signal?:AbortSignal){const v=await client.request(`/v1/live-vaults/${encodeURIComponent(id)}`,{signal});if(!record(v)||!record(v.vault)||v.vault.id!==id||v.vault.mode!=='ONCHAIN'||v.vault.cluster!=='devnet'||typeof v.vault.name!=='string'||!address(v.vault.fundAddress)||!address(v.vault.wallet)||!raw(v.vault.seedUsdcRaw)||!(v.position===null||record(v.position)&&raw(v.position.sharesRaw)&&Array.isArray(v.position.holdings)&&v.position.holdings.every(x=>record(x)&&address(x.mint)&&raw(x.amountRaw))))fail();return v as unknown as {vault:{id:string;name:string;fundAddress:string;wallet:string;seedUsdcRaw:string;status:string};position:{sharesRaw:string;holdings:{mint:string;amountRaw:string}[]}|null};},
 };
}
