import { parseExecutionProgress,type ExecutionProgress } from './generated/paper-trading-contracts.ts';
import { parseMarketTracking, parseMarketList, type MarketList, type MarketToken as DiscoveryToken } from './generated/market-contracts.ts';
import { parseVaultSummary, type VaultPhase } from './generated/vault-contracts.ts';
import { ApiError, type createApiClient } from './client.ts';

export type Period = '5M' | '6H' | '1H' | '24H' | '7D' | '30D';
export type Price = { instrumentId: string; mint: string; priceUsd: string | null; priceUsdc: string | null;
  sourceAt: string | null; receivedAt: string; status: 'CURRENT' | 'STALE' | 'UNAVAILABLE'; reason: string | null; change24h?: string | null; source?: 'JUPITER_PRICE_V3' | 'JUPITER_TOKENS_V2' };
export type Token = { mint: string; instrumentId: string | null; name: string; symbol: string; decimals: number; icon: string | null;
  category: 'Major assets' | 'Tokens' | 'Memecoins' | 'Unknown'; discovery?: DiscoveryToken; tracked: boolean; tradable: boolean; tradeReason: string | null;
  verified: boolean | null; suspicious: boolean | null; price: Price | null;
  metrics: { denomination: 'USD'; source: string; at: string | null; status: string; liquidity: string | null; volume24h: string | null; change1h: string | null; change24h: string | null } };
export type History = { livePoint?: { at: string; price: string }; source?:'JUPITER_PRICE_V3'|'BIRDEYE_TOKEN_USD'; seriesId?:string; backfillStatus?:string; nextRefreshAt?:string; mint: string; instrumentId: string; range: Period; denomination: 'USD'; intervalSeconds: number;
  from: string; to: string; changePercent: string | null; points: { at: string; price: string }[];
  coverage: { start: string | null; end: string | null; status: 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE'; hasGaps: boolean } };
export type Fund = { id: string; name: string; status: string; trialEnd: string; phase?: VaultPhase };
export type TradingContext = { fund: Fund; cashUsdc: string; navUsdc: string | null; testActivationAllowed?: boolean;
  holdings: { instrumentId: string; mint: string | null; symbol: string; quantity: string; costBasisUsdc: string; valueUsdc: string | null }[];
  policy: { maxOrderBps: number; maxPositionBps: number; allowedInstruments: string[] };
  limits: { instrumentId: string; canBuy: boolean; canSell: boolean; reason: string | null; maxBuyNotionalUsdc: string; maxSellNotionalUsdc: string; maxSellQuantity?: string }[];
  pending: { id: string; side: string; instrumentId: string; notionalUsdc: string }[]; accountingRevision?:string; capacityIsEstimate: boolean; asOf: string };
export type Intent = { side: 'BUY'; instrumentId: string; notionalUsdc: string } | { side: 'SELL'; instrumentId: string; quantity: string };
export type Preview = { estimate: { quantity: string; marketPriceUsdc: string; fillPriceUsdc: string; feeUsdc: string; cashChangeUsdc: string; modelVersion: number };
  policy: { allowed: boolean; reason: string | null }; observationId: string; observedAt: string };
export type Order = { execution?:ExecutionProgress; id: string; status: 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'REJECTED' | 'CANCELLED'; reject_reason: string | null;
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
// React Native's abort-controller polyfill exposes aborted/events, but not
// throwIfAborted() or reason. Keep cancellation compatible with that runtime.
function cancellation(signal: AbortSignal) { return signal.reason ?? new ApiError('request_cancelled', 'Market request cancelled.'); }
function checkCancelled(signal?: AbortSignal) { if (signal?.aborted) throw cancellation(signal); }
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
  if (price.source === 'JUPITER_TOKENS_V2') return Number.isFinite(source) && source <= now + 5000 && now - source <= 300000 && received <= now + 5000 && now - received <= 60000 ? price : { ...price, status: 'STALE', reason: 'metadata_stale' };
  return Number.isFinite(source) && source <= now + 5000 && now - source <= 15000 && received <= now + 5000 && now - received <= 15000
    ? price : { ...price, status: 'STALE', reason: 'observation_stale' };
}
export function parseToken(v: unknown): Token {
  if (!record(v) || !mint(v.mint) || !nullable(v.instrumentId, text) || !text(v.name) || !text(v.symbol) ||
    !Number.isInteger(v.decimals) || Number(v.decimals) < 0 || Number(v.decimals) > 18 || !nullable(v.icon, text) ||
    !['Major assets', 'Tokens', 'Memecoins', 'Unknown'].includes(String(v.category)) || typeof v.tracked !== 'boolean' || typeof v.tradable !== 'boolean' ||
    !nullable(v.tradeReason, text) || !nullable(v.verified, x => typeof x === 'boolean') || !nullable(v.suspicious, x => typeof x === 'boolean') ||
    !record(v.metrics) || v.metrics.denomination !== 'USD' || !text(v.metrics.source) || !text(v.metrics.status) || !nullable(v.metrics.at, date) ||
    !['liquidity', 'volume24h', 'change1h', 'change24h'].every(key => nullable((v.metrics as Record<string, unknown>)[key], decimal))) fail();
  if (v.price !== null) { const p = parsePrice(v.price); if (p.mint !== v.mint || p.instrumentId !== v.instrumentId) fail(); }
  return v as Token;
}
export function parseHistory(v: unknown): History {
  const h = envelope(v);
  if (!mint(h.mint) || !text(h.instrumentId) || !['5M', '1H', '6H', '24H', '7D', '30D'].includes(String(h.range)) || h.denomination !== 'USD' ||
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
  if(c.testActivationAllowed!==undefined && typeof c.testActivationAllowed!=='boolean')fail();
  if(c.accountingRevision!==undefined && (!text(c.accountingRevision)|| !/^(0|[1-9]\d*)$/.test(c.accountingRevision)))fail();
  if (!decimal(c.cashUsdc) || !nullable(c.navUsdc, decimal) || !Array.isArray(c.holdings) || !Array.isArray(c.limits) || !Array.isArray(c.pending) ||
    !record(c.policy) || !Number.isInteger(c.policy.maxOrderBps) || !Number.isInteger(c.policy.maxPositionBps) ||
    !Array.isArray(c.policy.allowedInstruments) || !c.policy.allowedInstruments.every(text) || typeof c.capacityIsEstimate !== 'boolean' || !date(c.asOf)) fail();
  for (const h of c.holdings) if (!record(h) || !text(h.instrumentId) || !nullable(h.mint, mint) || !text(h.symbol) || !decimal(h.quantity) || !decimal(h.costBasisUsdc) || !nullable(h.valueUsdc, decimal)) fail();
  for (const l of c.limits) if (!record(l) || !text(l.instrumentId) || typeof l.canBuy !== 'boolean' || typeof l.canSell !== 'boolean' || !nullable(l.reason, text) || !decimal(l.maxBuyNotionalUsdc) || !decimal(l.maxSellNotionalUsdc) || !decimal(l.maxSellQuantity)) fail();
  for (const p of c.pending) if (!record(p) || !uuid(p.id) || !['BUY', 'SELL'].includes(String(p.side)) || !text(p.instrumentId) || !decimal(p.notionalUsdc)) fail();
  return c as TradingContext;
}
export function discoveryToken(t: DiscoveryToken): Token {
  return { ...t, discovery: t, category: t.category === 'major' ? 'Major assets' : t.category === 'token' ? 'Tokens' : t.category === 'memecoin' ? 'Memecoins' : 'Unknown',
    price: t.price ? { instrumentId: t.instrumentId ?? '', mint: t.mint, priceUsd: t.price.usd, priceUsdc: null,
      sourceAt: t.price.sourceAt, receivedAt: t.price.receivedAt, status: t.price.status, reason: null, source: t.price.source } : null,
    metrics: { denomination: 'USD', source: t.metrics.source, at: t.metrics.asOf, status: t.metrics.status,
      liquidity: t.metrics.liquidityUsd, volume24h: t.metrics.interval === '24h' ? t.metrics.volumeUsd : null,
      change1h: t.metrics.interval === '1h' ? t.metrics.changePercent : null, change24h: t.metrics.interval === '24h' ? t.metrics.changePercent : null } };
}
export type DiscoveryRequest = { feed: 'supported' | 'toptraded' | 'trending'; interval: string; sort: string; category?: string; minLiquidityUsd?: string };
export function marketsApi(client: ReturnType<typeof createApiClient>) {
  const withIcon = (token: Token): Token => ({ ...token, icon: token.icon ? `${client.publicOrigin()}/v1/markets/${encodeURIComponent(token.mint)}/icon` : null });
  const histories = new Map<string, { at: number; ttl: number; value: Promise<History> }>();
  const pages = new Map<string, { at: number; ttl: number; value: Promise<{ list: MarketList; tokens: Token[] }> }>();
  const batches = new Map<string, { at: number; value: Promise<Record<string, History | null>> }>();
  const consume = <T,>(value: Promise<T>, signal?: AbortSignal): Promise<T> => {
    checkCancelled(signal);
    if (!signal) return value;
    return new Promise((resolve, reject) => {
      const cleanup = () => signal.removeEventListener('abort', abort);
      const abort = () => { cleanup(); reject(cancellation(signal)); };
      signal.addEventListener('abort', abort, { once: true });
      value.then(result => { cleanup(); resolve(result); }, error => { cleanup(); reject(error); });
    });
  };
  const watched=new Map<string,number>();
  const priceInstruments=()=>[...new Set(["SOL","JUP","JTO","BONK","USDC",...watched.keys()])].slice(0,50);
  const roundIds=new Set<string>();
  const fundPath=(id:string)=>roundIds.has(id)?`/v1/vaults/${id}`:`/v0/funds/${id}`;
  return {
    priceInstruments,
    watchInstrument(id:string){watched.set(id,(watched.get(id)??0)+1);return()=>{const count=(watched.get(id)??1)-1;if(count)watched.set(id,count);else watched.delete(id);};},
    async track(mint:string,signal?:AbortSignal) {
      const result=parseMarketTracking(await client.request(`/v1/markets/${encodeURIComponent(mint)}/tracking`,{method:'POST',signal}));
      if(result.mint!==mint)fail();return result;
    },
    async token(mint:string,signal?:AbortSignal) {
      const r=envelope(await client.request(`/v0/market/tokens/${encodeURIComponent(mint)}`,{authenticated:false,signal}));
      const token=parseToken(r.token);if(token.mint!==mint)fail();return withIcon(token);
    },
    invalidateDiscovery() { pages.clear(); },
    async discovery(options: DiscoveryRequest, query = '', signal?: AbortSignal, cursor?: string): Promise<{ list: MarketList; tokens: Token[] }> {
      checkCancelled(signal);
      const params = new URLSearchParams(query ? { query, limit: '10', interval: ['7d','30d'].includes(options.interval) ? '24h' : options.interval } : { ...options, limit: '10' });
      if (cursor) params.set('cursor', cursor);
      const path = `/v1/markets${query ? '/search' : ''}?${params}`, now = Date.now();
      let entry = pages.get(path);
      if (!entry || now - entry.at >= entry.ttl) {
        if (pages.size >= 64) pages.delete(pages.keys().next().value!);
        const value = client.request(path, { authenticated: false }).then(raw => {
          const list = parseMarketList(raw);
          return { list, tokens: list.items.map(token => withIcon(discoveryToken(token))) };
        });
        entry = { at: now, ttl: 15000, value }; pages.set(path, entry);
        const admitted = entry;
        void value.then(({ list }) => { admitted.at = Date.now(); admitted.ttl = Math.max(15000, Math.min(60000, Date.parse(list.refreshAfter) - Date.now())); })
          .catch(() => { if (pages.get(path) === admitted) pages.delete(path); });
      }
      return consume(entry.value, signal);
    },
    async historyBatch(mints: string[], signal?: AbortSignal): Promise<Record<string, History | null>> {
      checkCancelled(signal);
      const addresses = [...new Set(mints)].sort();
      if (!addresses.length) return {};
      if (addresses.length > 10 || addresses.some(address => !mint(address))) throw new Error('Invalid market history batch');
      const key = addresses.join(','), now = Date.now();
      let entry = batches.get(key);
      if (!entry || now - entry.at >= 30000) {
        if (batches.size >= 16) batches.delete(batches.keys().next().value!);
        const value = client.request(`/v1/markets/history/batch?range=24h&mints=${encodeURIComponent(key)}`, { authenticated: false }).then(raw => {
          const r = envelope(raw);
          if (r.range !== '24H' || !Array.isArray(r.items) || r.items.length !== addresses.length) fail();
          const result: Record<string, History | null> = {};
          for (const item of r.items) {
            if (!record(item) || !text(item.mint) || !addresses.includes(item.mint) || Object.prototype.hasOwnProperty.call(result, item.mint)) fail();
            if (item.status === 'UNAVAILABLE' && item.history === null) result[item.mint] = null;
            else {
              const history = parseHistory(item.history);
              if (item.status !== 'READY' || history.mint !== item.mint || history.range !== '24H') fail();
              result[item.mint] = history;
            }
          }
          return result;
        });
        entry = { at: now, value }; batches.set(key, entry);
        const admitted = entry;
        void value.then(() => { admitted.at = Date.now(); }).catch(() => { if (batches.get(key) === admitted) batches.delete(key); });
      }
      return consume(entry.value, signal);
    },
    async discoveryPage(options: DiscoveryRequest, query = '', signal?: AbortSignal, cursor?: string,
      onCatalog?: (page: { list: MarketList; tokens: Token[] }) => void) {
      const result = await this.discovery(options, query, signal, cursor);
      checkCancelled(signal);
      onCatalog?.(result);
      let histories: Record<string, History | null> = {};
      try { histories = await this.historyBatch(result.tokens.map(token => token.mint), signal); }
      catch { checkCancelled(signal); /* Chart outages must not hide the catalog. */ }
      return { ...result, histories };
    },
    async prices(signal?: AbortSignal, instruments?:string[]) {
      const r = envelope(await client.request(`/v0/market/prices${instruments?.length ? `?instruments=${encodeURIComponent(instruments.join(','))}` : ''}`, { signal, authenticated: false }));
      if (!Array.isArray(r.prices) || r.prices.length > 50) fail(); return r.prices.map(parsePrice);
    },
    async startTrial(name: string, idempotencyKey: string, signal?: AbortSignal) {
      const r = envelope(await client.request('/v0/funds', { method: 'POST', body: { name }, idempotencyKey, signal }));
      if (!uuid(r.id) || r.status !== 'ACTIVE') fail(); return r.id;
    },
    async tokens(query = '', signal?: AbortSignal) {
      const r = envelope(await client.request(`/v0/market/tokens${query ? `?query=${encodeURIComponent(query)}` : ''}`, { signal, authenticated: false }));
      if (!Array.isArray(r.tokens) || r.tokens.length > 100) fail(); return r.tokens.map(token => withIcon(parseToken(token)));
    },
    async history(mint: string, range: Period, signal?: AbortSignal, backfill = false) {
      checkCancelled(signal);
      const key = `${mint}:${range}:${backfill}`, now = Date.now();
      let entry = histories.get(key);
      if (!entry || now - entry.at >= entry.ttl) {
        if (histories.size >= 64) histories.delete(histories.keys().next().value!);
        const value = client.request(`/v0/market/tokens/${encodeURIComponent(mint)}/history?range=${range}${backfill ? '&backfill=true' : ''}`, { authenticated: false })
          .then(raw => { const h = parseHistory(raw); if (h.mint !== mint || h.range !== range) fail(); return h; });
        entry = { at: now, ttl: 30_000, value }; histories.set(key, entry);
        void value.then(history => { const cached = histories.get(key); if (cached?.value === value && (history.points.length < 2 || ['PENDING','RUNNING'].includes(history.backfillStatus ?? ''))) cached.ttl = 5000; }).catch(() => undefined);
        void value.catch(() => { if (histories.get(key)?.value === value) histories.delete(key); });
      }
      return consume(entry.value, signal);
    },
    async funds(signal?: AbortSignal) {
      // Current paper vaults are the source of truth. Older trial routes are only
      // used for compatibility with servers that do not expose vault rounds.
      let response: unknown;
      try { response = await client.request('/v1/me/captain/vaults', { signal }); }
      catch (error) {
        if (!(error instanceof ApiError) || error.status !== 404) throw error;
        const legacy = envelope(await client.request('/v0/me/captain/funds', { signal }));
        if (!Array.isArray(legacy.funds)) fail();
        return legacy.funds.map(parseFund);
      }
      if (!record(response) || !Array.isArray(response.vaults)) fail();
      const rounds = response.vaults.map(parseVaultSummary);
      // Keep known route identities for pending-order recovery across refreshes.
      for (const round of rounds) roundIds.add(round.id);
      return rounds.map(v => ({ id: v.id, name: v.name, phase: v.phase,
        status: v.riskState === 'FROZEN' ? 'FROZEN' : v.phase === 'ACTIVE' ? 'ACTIVE' : 'COMPLETED',
        trialEnd: v.tradingEndsAt }));
    },
    async context(id: string, signal?: AbortSignal, instrumentId?: string) { const c = parseTradingContext(await client.request(`${fundPath(id)}/trading-context${instrumentId ? `?instrumentId=${encodeURIComponent(instrumentId)}` : ""}`, { signal })); if (c.fund.id !== id) fail(); return c; },
    async startTestTrading(id: string, signal?: AbortSignal) {
      const result=envelope(await client.request(`/v1/vaults/${id}/test-activation`,{method:'POST',signal}));
      if(result.vaultId!==id||result.phase!=='ACTIVE'||result.testOnly!==true)fail();
    },
    async watchlist(signal?: AbortSignal) { const r = envelope(await client.request('/v0/me/watchlist', { signal })); if (!Array.isArray(r.mints) || !r.mints.every(mint)) fail(); return r.mints as string[]; },
    async savedMarkets(signal?: AbortSignal) {
      const r = envelope(await client.request('/v0/me/watchlist', { signal }));
      if (!Array.isArray(r.mints) || !r.mints.every(mint) || !Array.isArray(r.tokens) || r.tokens.length > 100) fail();
      const tokens = r.tokens.map(token => withIcon(parseToken(token)));
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
        !nullable(o.reject_reason, text) || !['quantity', 'fee_usdc', 'fill_price_usdc'].every(key => nullable(o[key], decimal))) fail(); if(o.execution!==undefined)parseExecutionProgress(o.execution);return o as Order;
    },
    async cancel(id: string, orderId: string, signal?: AbortSignal) { envelope(await client.request(`${fundPath(id)}/orders/${orderId}/cancel`, { method: 'POST', signal })); },
  };
}
