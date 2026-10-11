import { ApiError, type createApiClient } from './client.ts';

export interface PaperActivity {
  id: string; fund_id: string; vault_name: string; kind: 'BUY'|'SELL'|'CREATE'|'CONTRIBUTE'|'CANCEL'|'CLAIM';
  status: string; reason: string|null; instrument_id: string|null; symbol: string|null;
  amount_usdc: string; at: string; quantity: string|null; fee_usdc: string|null; fill_price_usdc: string|null;
}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const uuid=(v:unknown)=>typeof v==='string'&&/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(v);
const decimal=(v:unknown)=>typeof v==='string'&&/^\d+(\.\d+)?$/.test(v)&&Number.isFinite(Number(v));
export function parsePaperActivity(raw:unknown):{items:PaperActivity[];nextCursor:string|null} {
  if (!object(raw)||raw.mode!=='PAPER'||!Array.isArray(raw.items)||raw.items.length>20||!(raw.nextCursor===null||uuid(raw.nextCursor))) throw new ApiError('invalid_response','Could not read your paper activity.');
  for(const row of raw.items) {
    if(!object(row)||!uuid(row.id)||!uuid(row.fund_id)||typeof row.vault_name!=='string'||
      !['BUY','SELL','CREATE','CONTRIBUTE','CANCEL','CLAIM'].includes(String(row.kind))||
      !['PENDING','FILLED','PARTIALLY_FILLED','REJECTED','CANCELLED','SUCCEEDED'].includes(String(row.status))||
      typeof row.at!=='string'||!Number.isFinite(Date.parse(row.at))||!decimal(row.amount_usdc)||
      !['reason','symbol','instrument_id'].every(k=>row[k]===null||typeof row[k]==='string')||
      !['quantity','fee_usdc','fill_price_usdc'].every(k=>row[k]===null||decimal(row[k]))) throw new ApiError('invalid_response','Could not read your paper activity.');
  }
  return {items:raw.items as PaperActivity[],nextCursor:raw.nextCursor as string|null};
}
export function paperActivityApi(client:ReturnType<typeof createApiClient>) {
  return {async list(after:string|null,signal?:AbortSignal) {
    return parsePaperActivity(await client.request(`/v1/me/paper-activity?limit=20${after?`&after=${encodeURIComponent(after)}`:''}`,{signal}));
  }};
}
