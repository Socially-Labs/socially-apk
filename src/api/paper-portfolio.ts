import { ApiError,type createApiClient } from './client.ts';
export type PaperPortfolio={mode:'PAPER';enabled:boolean;initialized:boolean;availableUsdc:string;initialUsdc:string|null;wallet:string|null;initializedAt:string|null};
export function parsePaperPortfolio(v:unknown):PaperPortfolio{
 if(!v||typeof v!=='object')throw new ApiError('invalid_response','Could not read your paper portfolio.');
 const p=v as Record<string,unknown>,amount=(v:unknown)=>typeof v==='string'&&/^\d{1,32}\.\d{6}$/.test(v);
 if(p.mode!=='PAPER'||typeof p.enabled!=='boolean'||typeof p.initialized!=='boolean'||!amount(p.availableUsdc)||
  (p.initialized?(!amount(p.initialUsdc)||typeof p.wallet!=='string'||!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(p.wallet)||typeof p.initializedAt!=='string'||!Number.isFinite(Date.parse(p.initializedAt))):p.initialUsdc!==null||p.wallet!==null||p.initializedAt!==null))throw new ApiError('invalid_response','Could not read your paper portfolio.');
 return p as PaperPortfolio;
}
export function paperPortfolioApi(client:ReturnType<typeof createApiClient>){return{
 read:async(signal?:AbortSignal)=>parsePaperPortfolio(await client.request('/v1/me/paper-portfolio',{signal})),
 initialize:async(wallet:string,signal?:AbortSignal)=>parsePaperPortfolio(await client.request('/v1/me/paper-portfolio/initialize',{method:'POST',body:{wallet},idempotencyKey:`paper-portfolio:${wallet}`,signal})),
};}
