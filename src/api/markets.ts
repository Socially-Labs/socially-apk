import { parseVaultSummary } from './generated/vault-contracts.ts';
import { ApiError, type createApiClient } from './client.ts';

export type Period = '1H' | '24H' | '7D' | '30D';
export type Price = { instrumentId: string; mint: string; priceUsd: string | null; priceUsdc: string | null;
  sourceAt: string | null; receivedAt: string; status: 'CURRENT' | 'STALE' | 'UNAVAILABLE'; reason: string | null; change24h?: string | null };
export type Token = { mint: string; instrumentId: string | null; name: string; symbol: string; decimals: number; icon: string | null;
  category: 'Major assets' | 'Tokens' | 'Memecoins'; tracked: boolean; tradable: boolean; tradeReason: string | null;
  verified: boolean | null; suspicious: boolean; price: Price | null;
  metrics: { denomination: 'USD'; source: string; at: string | null; status: string; liquidity: string | null; volume24h: string | null; change1h: string | null; change24h: string | null } };
export type History = { mint: string; instrumentId: string; range: Period; denomination: 'USD'; intervalSeconds: number;
  from: string; to: string; changePercent: string | null; points: { at: string; price: string }[];
  coverage: { start: string | null; end: string | null; status: 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE'; hasGaps: boolean } };
export type Fund = { id: string; name: string; status: string; trialEnd: string };
export type TradingContext = { fund: Fund; cashUsdc: string; navUsdc: string | null;
  holdings: { instrumentId: string; mint: string | null; symbol: string; quantity: string; costBasisUsdc: string; valueUsdc: string | null }[];
  policy: { maxOrderBps: number; maxPositionBps: number; allowedInstruments: string[] };
  limits: { instrumentId: string; canBuy: boolean; canSell: boolean; reason: string | null; maxBuyNotionalUsdc: string; maxSellNotionalUsdc: string; maxSellQuantity?: string }[];
  pending: { id: string; side: string; instrumentId: string; notionalUsdc: string }[]; capacityIsEstimate: boolean; asOf: string };
export type Intent = { side: 'BUY'; instrumentId: string; notionalUsdc: string } | { side: 'SELL'; instrumentId: string; quantity: string };
export type Preview = { estimate: { quantity: string; marketPriceUsdc: string; fillPriceUsdc: string; feeUsdc: string; cashChangeUsdc: string; modelVersion: number };
  policy: { allowed: boolean; reason: string | null }; observationId: string; observedAt: string };
export type Order = { id: string; status: 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'REJECTED' | 'CANCELLED'; reject_reason: string | null;
  quantity: string | null; fee_usdc: string | null; fill_price_usdc: string | null; requested_quantity?: string | null };
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string';
const decimal = (v: unknown): v is string => text(v) && /^-?\d{1,24}(\.\d{1,18})?$/.test(v);
const positive = (v: unknown): v is string => decimal(v) && !v.startsWith('-') && /[1-9]/.test(v);
const nullable = (v: unknown, check: (v: unknown) => boolean) => v === null || check(v);
const date = (v: unknown): v is string => text(v) && Number.isFinite(Date.parse(v));
const mint = (v: unknown): v is string => text(v) && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v);
const uuid = (v: unknown): v is string => text(v) && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(v);
function fail(): never { throw new ApiError('invalid_response', 'The market service returned an unexpected response.'); }
function envelope(v: unknown): Record<string, unknown> { if (!record(v) || v.mode !== 'PAPER') fail(); return v; }
export function parsePrice(v: unknown): Price {
  if (!record(v) || !text(v.instrumentId) || !mint(v.mint) || !nullable(v.priceUsd, positive) || !nullable(v.priceUsdc, positive) ||
    !nullable(v.sourceAt, date) || !date(v.receivedAt) || !['CURRENT', 'STALE', 'UNAVAILABLE'].includes(String(v.status)) ||
    !nullable(v.reason, text) || !(v.change24h === undefined || nullable(v.change24h, decimal)) ||
    v.status === 'CURRENT' && (!v.sourceAt || !v.priceUsd || !v.priceUsdc)) fail();
  return v as Price;
}
export function priceFreshness(price: Price | null, now = Date.now()): Price | null {
  if (!price || price.status === 'UNAVAILABLE') return price;
  const source = price.sourceAt ? Date.parse(price.sourceAt) : NaN, received = Date.parse(price.receivedAt);
  return Number.isFinite(source) && source <= now + 5000 && now - source <= 15000 && received <= now + 5000 && now - received <= 15000
    ? price : { ...price, status: 'STALE', reason: 'observation_stale' };
}
export function parseToken(v: unknown): Token {
  if (!record(v) || !mint(v.mint) || !nullable(v.instrumentId, text) || !text(v.name) || !text(v.symbol) ||
    !Number.isInteger(v.decimals) || Number(v.decimals) < 0 || Number(v.decimals) > 18 || !nullable(v.icon, text) ||
    !['Major assets', 'Tokens', 'Memecoins'].includes(String(v.category)) || typeof v.tracked !== 'boolean' || typeof v.tradable !== 'boolean' ||
    !nullable(v.tradeReason, text) || !nullable(v.verified, x => typeof x === 'boolean') || typeof v.suspicious !== 'boolean' ||
    !record(v.metrics) || v.metrics.denomination !== 'USD' || !text(v.metrics.source) || !text(v.metrics.status) || !nullable(v.metrics.at, date) ||
    !['liquidity', 'volume24h', 'change1h', 'change24h'].every(key => nullable((v.metrics as Record<string, unknown>)[key], decimal))) fail();
  if (v.price !== null) { const p = parsePrice(v.price); if (p.mint !== v.mint || p.instrumentId !== v.instrumentId) fail(); }
  return v as Token;
}
export function parseHistory(v: unknown): History {
  const h = envelope(v);
  if (!mint(h.mint) || !text(h.instrumentId) || !['1H', '24H', '7D', '30D'].includes(String(h.range)) || h.denomination !== 'USD' ||
    !date(h.from) || !date(h.to) || !Number.isInteger(h.intervalSeconds) || Number(h.intervalSeconds) < 1 || !nullable(h.changePercent, decimal) ||
    !record(h.coverage) || !['COMPLETE', 'PARTIAL', 'UNAVAILABLE'].includes(String(h.coverage.status)) || typeof h.coverage.hasGaps !== 'boolean' ||
    !nullable(h.coverage.start, date) || !nullable(h.coverage.end, date) || !Array.isArray(h.points) || h.points.length > 721) fail();
  let previous = -Infinity;
  for (const p of h.points) {
    if (!record(p) || !date(p.at) || !positive(p.price) || Date.parse(p.at) <= previous || Date.parse(p.at) < Date.parse(String(h.from)) || Date.parse(p.at) > Date.parse(String(h.to))) fail();
    previous = Date.parse(p.at);
  }
  return h as History;
}
function parseFund(v: unknown): Fund {
  if (!record(v) || !uuid(v.id) || !text(v.name) || !['ACTIVE', 'FROZEN', 'COMPLETED'].includes(String(v.status)) || !date(v.trialEnd)) fail();
  return v as Fund;
}
export function parseTradingContext(v: unknown): TradingContext {
  const c = envelope(v); parseFund(c.fund);
  if (!decimal(c.cashUsdc) || !nullable(c.navUsdc, decimal) || !Array.isArray(c.holdings) || !Array.isArray(c.limits) || !Array.isArray(c.pending) ||
    !record(c.policy) || !Number.isInteger(c.policy.maxOrderBps) || !Number.isInteger(c.policy.maxPositionBps) ||
    !Array.isArray(c.policy.allowedInstruments) || !c.policy.allowedInstruments.every(text) || typeof c.capacityIsEstimate !== 'boolean' || !date(c.asOf)) fail();
  for (const h of c.holdings) if (!record(h) || !text(h.instrumentId) || !nullable(h.mint, mint) || !text(h.symbol) || !decimal(h.quantity) || !decimal(h.costBasisUsdc) || !nullable(h.valueUsdc, decimal)) fail();
  for (const l of c.limits) if (!record(l) || !text(l.instrumentId) || typeof l.canBuy !== 'boolean' || typeof l.canSell !== 'boolean' || !nullable(l.reason, text) || !decimal(l.maxBuyNotionalUsdc) || !decimal(l.maxSellNotionalUsdc) || !decimal(l.maxSellQuantity)) fail();
  for (const p of c.pending) if (!record(p) || !uuid(p.id) || !['BUY', 'SELL'].includes(String(p.side)) || !text(p.instrumentId) || !decimal(p.notionalUsdc)) fail();
  return c as TradingContext;
}
export function marketsApi(client: ReturnType<typeof createApiClient>) {
  const roundIds=new Set<string>();
  const fundPath=(id:string)=>roundIds.has(id)?`/v1/vaults/${id}`:`/v0/funds/${id}`;
  return {
    async prices(signal?: AbortSignal) {
      const r = envelope(await client.request('/v0/market/prices', { signal, authenticated: false }));
      if (!Array.isArray(r.prices) || r.prices.length > 50) fail(); return r.prices.map(parsePrice);
    },
    async startTrial(name: string, idempotencyKey: string, signal?: AbortSignal) {
      const r = envelope(await client.request('/v0/funds', { method: 'POST', body: { name }, idempotencyKey, signal }));
      if (!uuid(r.id) || r.status !== 'ACTIVE') fail(); return r.id;
    },
    async tokens(query = '', signal?: AbortSignal) {
      const r = envelope(await client.request(`/v0/market/tokens${query ? `?query=${encodeURIComponent(query)}` : ''}`, { signal, authenticated: false }));
      if (!Array.isArray(r.tokens) || r.tokens.length > 100) fail(); return r.tokens.map(parseToken);
    },
    async history(mint: string, range: Period, signal?: AbortSignal) {
      const h = parseHistory(await client.request(`/v0/market/tokens/${encodeURIComponent(mint)}/history?range=${range}`, { signal, authenticated: false }));
      if (h.mint !== mint || h.range !== range) fail(); return h;
    },
    async funds(signal?: AbortSignal) {
      const r = envelope(await client.request('/v0/me/captain/funds', { signal })); if (!Array.isArray(r.funds)) fail();
      const legacy=r.funds.map(parseFund);
      let response:unknown;
      try { response=await client.request('/v1/me/captain/vaults',{ signal }); }
      catch (error) { if (error instanceof ApiError && error.status===404) return legacy; throw error; }
      if (!record(response) || !Array.isArray(response.vaults)) fail();
      const rounds=response.vaults.map(parseVaultSummary);
      roundIds.clear(); for (const round of rounds) roundIds.add(round.id);
      return [...rounds.filter(v=>v.phase==='ACTIVE').map(v=>({ id:v.id,name:v.name,status:v.riskState==='FROZEN'?'FROZEN':'ACTIVE',trialEnd:v.tradingEndsAt })),...legacy];
    },
    async context(id: string, signal?: AbortSignal) { const c = parseTradingContext(await client.request(`${fundPath(id)}/trading-context`, { signal })); if (c.fund.id !== id) fail(); return c; },
    async watchlist(signal?: AbortSignal) { const r = envelope(await client.request('/v0/me/watchlist', { signal })); if (!Array.isArray(r.mints) || !r.mints.every(mint)) fail(); return r.mints as string[]; },
    async savedMarkets(signal?: AbortSignal) {
      const r = envelope(await client.request('/v0/me/watchlist', { signal }));
      if (!Array.isArray(r.mints) || !r.mints.every(mint) || !Array.isArray(r.tokens) || r.tokens.length > 100) fail();
      const tokens = r.tokens.map(parseToken);
      if (tokens.some(token => !(r.mints as string[]).includes(token.mint))) fail();
      return { mints: r.mints as string[], tokens };
    },
    async save(mint: string, saved: boolean, signal?: AbortSignal) {
      const r = envelope(await client.request(`/v0/me/watchlist/${encodeURIComponent(mint)}`, { method: saved ? 'PUT' : 'DELETE', signal }));
      if (r.mint !== mint || r.saved !== saved) fail();
    },
    async preview(id: string, body: Intent, signal?: AbortSignal): Promise<Preview> {
      const r = envelope(await client.request(`${fundPath(id)}/orders/preview`, { method: 'POST', body, signal }));
      if (!record(r.estimate) || !['quantity', 'marketPriceUsdc', 'fillPriceUsdc', 'feeUsdc', 'cashChangeUsdc'].every(key => decimal((r.estimate as Record<string, unknown>)[key])) ||
        !record(r.policy) || typeof r.policy.allowed !== 'boolean' || !nullable(r.policy.reason, text) || !uuid(r.observationId) || !date(r.observedAt)) fail(); return r as Preview;
    },
    async submit(id: string, body: Intent, idempotencyKey: string, signal?: AbortSignal) {
      const r = envelope(await client.request(`${fundPath(id)}/orders`, { method: 'POST', body, idempotencyKey, signal }));
      if (!uuid(r.orderId) || r.status !== 'PENDING') fail(); return r.orderId;
    },
    async order(id: string, orderId: string, signal?: AbortSignal): Promise<Order> {
      const r = envelope(await client.request(`${fundPath(id)}/orders/${orderId}`, { signal })), o = r.order;
      if (!record(o) || o.id !== orderId || !['PENDING', 'FILLED', 'PARTIALLY_FILLED', 'REJECTED', 'CANCELLED'].includes(String(o.status)) ||
        !nullable(o.reject_reason, text) || !['quantity', 'fee_usdc', 'fill_price_usdc'].every(key => nullable(o[key], decimal))) fail(); return o as Order;
    },
    async cancel(id: string, orderId: string, signal?: AbortSignal) { envelope(await client.request(`${fundPath(id)}/orders/${orderId}/cancel`, { method: 'POST', signal })); },
  };
}
