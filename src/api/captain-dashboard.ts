import { parseTradingReturns,type TradingReturns } from './generated/paper-trading-contracts.ts';
import { ApiError, type createApiClient } from './client.ts';
import { parseVaultSummary } from './vaults.ts';
export type CaptainRange = '7D'|'30D'|'90D'|'ALL';
export type CaptainDashboard = {
 dashboardRevision?:string; schemaVersion:1; mode:'PAPER'; state:'NEW'|'EXISTING'; vaultCount:number; activeVaults:number; openVaults:number; crewMembers:number;
 aumUsdc:string|null; valuationStatus:'CURRENT'|'UNAVAILABLE'; serverTime:string;
 earnings:{ earnedUsdc:string; claimedUsdc:string; claimableUsdc:string };
 creation:{ allowed:boolean; reason:'funding_unavailable'|'open_round_exists'|'insufficient_seed'|null; seedUsdc:string; availableUsdc:string };
};
export type CaptainPerformance={ tradingReturn?:TradingReturns; mode:'PAPER';range:CaptainRange;intervalSeconds:number;points:{ at:string;aumUsdc:string|null }[];
 coverage:'PARTIAL'|'UNAVAILABLE';changeUsdc:string|null;changePercent:string|null;methodology:string };
export type CaptainMember={ id:string;displayName:string;username:string|null;avatarUrl:string|null;vaultCount:number;allocatedUsdc:string;joinedAt:string };
export type CaptainEarning={ vaultId:string;name:string;earnedUsdc:string;claimedUsdc:string;claimableUsdc:string;finalizedAt:string;claimedAt:string|null };
type Page<T>={ items:T[];nextCursor:string|null };
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const amount=(v:unknown):v is string=>typeof v==='string'&&/^\d{1,24}(\.\d{1,18})?$/.test(v);
const signed=(v:unknown)=>typeof v==='string'&&/^-?\d{1,24}(\.\d{1,18})?$/.test(v);
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const count=(v:unknown)=>Number.isSafeInteger(v)&&Number(v)>=0;
const date=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v));
function fail():never{throw new ApiError('invalid_response','The Captain dashboard returned an unexpected response. Please retry.');}
export function parseCaptainDashboard(v:unknown):CaptainDashboard {
 if(!record(v)||v.schemaVersion!==1||v.mode!=='PAPER'||!['NEW','EXISTING'].includes(String(v.state))||
 !['vaultCount','activeVaults','openVaults','crewMembers'].every(k=>count(v[k]))||!(v.aumUsdc===null||amount(v.aumUsdc))||
 !['CURRENT','UNAVAILABLE'].includes(String(v.valuationStatus))||!date(v.serverTime)||
 !record(v.earnings)||!['earnedUsdc','claimedUsdc','claimableUsdc'].every(k=>amount((v.earnings as Record<string,unknown>)[k]))||
 !record(v.creation)||typeof v.creation.allowed!=='boolean'||!(v.creation.reason===null||['funding_unavailable','open_round_exists','insufficient_seed'].includes(String(v.creation.reason)))||
 !amount(v.creation.seedUsdc)||!amount(v.creation.availableUsdc))fail();
 if((v.state==='NEW')!==(v.vaultCount===0)||(v.valuationStatus==='CURRENT')!==(v.aumUsdc!==null)||v.creation.allowed!==(v.creation.reason===null))fail();
 return v as CaptainDashboard;
}
export function parseCaptainPerformance(v:unknown,range:CaptainRange):CaptainPerformance {
 if(!record(v)||v.mode!=='PAPER'||v.range!==range||!count(v.intervalSeconds)||Number(v.intervalSeconds)===0||!Array.isArray(v.points)||
 !['PARTIAL','UNAVAILABLE'].includes(String(v.coverage))||!(v.changeUsdc===null||signed(v.changeUsdc))||!(v.changePercent===null||signed(v.changePercent))||typeof v.methodology!=='string')fail();
 let last=-Infinity;
 for(const point of v.points){if(!record(point)||!date(point.at)||!(point.aumUsdc===null||amount(point.aumUsdc))||Date.parse(String(point.at))<=last)fail();last=Date.parse(String(point.at));}
 if(v.tradingReturn!==undefined){const returns=parseTradingReturns(v.tradingReturn);if(returns.range!==range)fail();}
 return v as CaptainPerformance;
}
function page<T>(v:unknown,key:string,valid:(item:Record<string,unknown>)=>boolean):Page<T>{
 if(!record(v)||v.mode!=='PAPER'||!Array.isArray(v[key])||!(v.nextCursor===null||uuid(v.nextCursor)))fail();
 const rows=v[key] as unknown[];if(rows.length>50||rows.some(i=>!record(i)||!valid(i)))fail();
 return{items:rows as T[],nextCursor:v.nextCursor as string|null};
}
export function captainDashboardApi(client:ReturnType<typeof createApiClient>){
 const query=(after?:string|null)=>after?`?after=${encodeURIComponent(after)}`:'';
 return {
 async dashboard(signal?:AbortSignal){return parseCaptainDashboard(await client.request('/v1/me/captain/dashboard',{signal}));},
 async performance(range:CaptainRange,signal?:AbortSignal){return parseCaptainPerformance(await client.request(`/v1/me/captain/performance?range=${range}`,{signal}),range);},
 async vaults(after?:string|null,signal?:AbortSignal){const v=await client.request(`/v1/me/captain/vaults${query(after)}`,{signal});if(!record(v)||!Array.isArray(v.vaults)||!(v.nextCursor===null||uuid(v.nextCursor)))fail();return{items:v.vaults.map(parseVaultSummary),nextCursor:v.nextCursor as string|null};},
 async crew(after?:string|null,signal?:AbortSignal){return page<CaptainMember>(await client.request(`/v1/me/captain/crew${query(after)}`,{signal}),'members',i=>uuid(i.id)&&typeof i.displayName==='string'&&(i.username===null||typeof i.username==='string')&&(i.avatarUrl===null||typeof i.avatarUrl==='string')&&count(i.vaultCount)&&amount(i.allocatedUsdc)&&date(i.joinedAt));},
 async earnings(after?:string|null,signal?:AbortSignal){return page<CaptainEarning>(await client.request(`/v1/me/captain/earnings${query(after)}`,{signal}),'earnings',i=>uuid(i.vaultId)&&typeof i.name==='string'&&amount(i.earnedUsdc)&&amount(i.claimedUsdc)&&amount(i.claimableUsdc)&&date(i.finalizedAt)&&(i.claimedAt===null||date(i.claimedAt)));},
 };
}
