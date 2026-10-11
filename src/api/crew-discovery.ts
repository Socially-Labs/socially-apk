import { ApiError, createApiClient } from './client';
import { getApiOrigin } from './runtime-origin';
import { parseCaptainPortfolio, type CaptainPortfolio } from './captain-portfolio';
import { parseVaultSummary, type VaultSummary } from './vaults';

export type CrewCaptain = { id:string; displayName:string; username:string; bio:string; avatarUrl:string|null; bannerUrl:string|null;
  aumUsdc:string|null; netReturnPercent?:string|null; crewMembers:number; activeVaults:number; totalVaults:number; performance?:CaptainPortfolio|null; computedAt?:string|null; isDemo?:boolean; history?:{recordedDays:number} };
export type CrewRange = '7D'|'30D'|'90D'|'ALL';
export type DiscoveryFilters = { phase:'ALL'|'FUNDRAISING'|'ACTIVE'; duration:'all'|'short'|'long'; sort?:'RECENT'|'AUM' };
const client=()=>createApiClient({origin:getApiOrigin(),getAccessToken:async()=>null});
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const uuid=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const image=(v:unknown)=>{if(v===null)return true;try{const u=new URL(String(v));return typeof v==='string'&&u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
function invalid():never{throw new ApiError('invalid_response','Discover returned an unexpected response. Please retry.');}
export function parseCrewCaptain(v:unknown):CrewCaptain {
 if(record(v)&&v.history!==undefined&&(!record(v.history)||!Number.isSafeInteger(v.history.recordedDays)||Number(v.history.recordedDays)<0))invalid();
 if(!record(v)||(v.isDemo!==undefined&&typeof v.isDemo!=='boolean')||!uuid(v.id)||typeof v.displayName!=='string'||typeof v.username!=='string'||typeof v.bio!=='string'||!image(v.avatarUrl)||!image(v.bannerUrl)
 ||!(v.aumUsdc===null||typeof v.aumUsdc==='string'&&/^\d+\.\d{6}$/.test(v.aumUsdc))
 ||!(v.netReturnPercent===undefined||v.netReturnPercent===null||typeof v.netReturnPercent==='string'&&/^-?\d+\.\d{6}$/.test(v.netReturnPercent))
 ||!['crewMembers','activeVaults','totalVaults'].every(k=>Number.isSafeInteger(v[k])&&Number(v[k])>=0))invalid();
 const performance=v.performance==null?v.performance:parseCaptainPortfolio(v.performance,'30D');
 if(performance && performance.points.length>32)invalid();
 return {...v,performance} as CrewCaptain;
}
export async function fetchCaptains(query:string,after:string|null,signal:AbortSignal,sort='RECENT'){
 const q=new URLSearchParams({query,limit:'20',sort});if(after)q.set('after',after);
 const v=await client().request(`/v1/discover/captains?${q}`,{authenticated:false,signal});
 if(!record(v)||v.mode!=='PAPER'||!Array.isArray(v.captains)||v.captains.length>50||!(v.nextCursor===null||uuid(v.nextCursor)))invalid();
 return {items:v.captains.map(parseCrewCaptain),nextCursor:v.nextCursor as string|null};
}
export async function fetchDiscoveryVaults(query:string,filters:DiscoveryFilters,captainId:string|undefined,after:string|null,signal:AbortSignal){
 const q=new URLSearchParams({query,limit:'20',sort:filters.sort ?? 'RECENT'});if(after)q.set('after',after);if(captainId)q.set('captainId',captainId);
 if(filters.phase!=='ALL')q.set('phase',filters.phase);if(filters.duration!=='all')q.set('durationGroup',filters.duration);
 const v=await client().request(`/v1/vaults?${q}`,{authenticated:false,signal});
 if(!record(v)||!Array.isArray(v.vaults)||v.vaults.length>50||!(v.nextCursor===null||uuid(v.nextCursor)))invalid();
 return {items:v.vaults.map(parseVaultSummary),nextCursor:v.nextCursor as string|null};
}
export async function fetchCrewCaptain(id:string,range:CrewRange,signal:AbortSignal):Promise<{captain:CrewCaptain;portfolio:CaptainPortfolio;maxDrawdownPercent:string|null}>{
 const v=await client().request(`/v1/discover/captains/${encodeURIComponent(id)}?range=${range}`,{authenticated:false,signal});
 if(!record(v))invalid();const captain=parseCrewCaptain(v.captain);if(captain.id!==id)invalid();
 if(!(v.maxDrawdownPercent===null||typeof v.maxDrawdownPercent==='string'&&/^\d+\.\d{6}$/.test(v.maxDrawdownPercent)))invalid();
 return {captain,portfolio:parseCaptainPortfolio(v.portfolio,range),maxDrawdownPercent:v.maxDrawdownPercent as string|null};
}
export type DiscoveryItem = CrewCaptain | VaultSummary;
