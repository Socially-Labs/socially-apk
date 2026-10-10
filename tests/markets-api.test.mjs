import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../src/api/client.ts';
import { marketsApi, parsePrice, priceFreshness, parseToken, parseHistory, parseTradingContext } from '../src/api/markets.ts';
import { validTradeAmount, filterTokens } from '../src/components/markets/market-data.ts';

const mint = 'So11111111111111111111111111111111111111112', id = '11111111-1111-4111-8111-111111111111';
const now = Date.now(), at = new Date(now).toISOString();
const price = { instrumentId: 'SOL', mint, priceUsd: '100.25', priceUsdc: '99.25', sourceAt: at, receivedAt: at, status: 'CURRENT', reason: null, change24h: '2.25' };
const token = { mint, instrumentId: 'SOL', symbol: 'SOL', name: 'Solana', decimals: 9, icon: null, category: 'Major assets', tracked: true, tradable: true, tradeReason: null, verified: null, suspicious: false, price,
  metrics: { denomination: 'USD', source: 'JUPITER_TOKENS_V2', at: null, status: 'UNAVAILABLE', volume24h: null, liquidity: null, change1h: null, change24h: null } };
const context = { mode: 'PAPER', fund: { id, name: 'Vault', status: 'ACTIVE', trialEnd: at }, cashUsdc: '1000.000000', navUsdc: '1000', holdings: [],
  policy: { maxOrderBps: 1000, maxPositionBps: 2500, allowedInstruments: ['SOL'] }, limits: [{ instrumentId: 'SOL', canBuy: true, canSell: false, reason: null, maxBuyNotionalUsdc: '100', maxSellNotionalUsdc: '0', maxSellQuantity: '0.000000000' }], pending: [], capacityIsEstimate: true, asOf: at };

test('freshness ages while disconnected and never upgrades explicit unavailable marks', () => {
  assert.equal(priceFreshness(parsePrice(price), now+15001).status, 'STALE');
  assert.equal(priceFreshness({ ...price, status: 'UNAVAILABLE' }, now).status, 'UNAVAILABLE');
  assert.equal(priceFreshness({ ...price, sourceAt: new Date(now+6000).toISOString() }, now).status, 'STALE');
  assert.equal(priceFreshness(null), null);
  for (const invalid of [{ priceUsd: '-1' }, { priceUsd: '0' }, { sourceAt: null }, { receivedAt: 'invalid' }]) assert.throws(() => parsePrice({ ...price, ...invalid }));
});
test('token identity and null metrics remain meaningful; malformed marks are rejected', () => {
  assert.equal(parseToken(token).metrics.volume24h, null);
  assert.equal(parseToken({ ...token, metrics: { ...token.metrics, volume24h: '0' } }).metrics.volume24h, '0');
  assert.throws(() => parseToken({ ...token, price: { ...price, mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' } }));
  assert.throws(() => parseToken({ ...token, decimals: 19 }));
  assert.deepEqual(parseTradingContext(context).holdings, []);
  assert.throws(() => parseTradingContext({ ...context, cashUsdc: 1000 }));
});
test('history validates denomination, ordering, bounds and partial/empty coverage', () => {
  const history = { mode: 'PAPER', mint, instrumentId: 'SOL', range: '24H', denomination: 'USD', intervalSeconds: 120, from: new Date(now-86400000).toISOString(), to: at,
    changePercent: null, points: [], coverage: { start: null, end: null, status: 'UNAVAILABLE', hasGaps: false } };
  assert.equal(parseHistory(history).points.length, 0);
  assert.throws(() => parseHistory({ ...history, denomination: 'USDC' }));
  assert.throws(() => parseHistory({ ...history, points: [{ at, price: '100' }, { at, price: '101' }] }));
  assert.throws(() => parseHistory({ ...history, points: [{ at: new Date(now+1000).toISOString(), price: '100' }] }));
});
test('financial amount entry rejects exponent, negative, zero and excessive mint precision', () => {
  assert.ok(validTradeAmount('0.00001', 5)); assert.ok(!validTradeAmount('0.000001', 5));
  for (const raw of ['-1', '1e3', '.5', '01', '0', '0.000', 'NaN', '']) assert.ok(!validTradeAmount(raw, 9));
});
test('filters use mints, real holdings and null-last statistics', () => {
  const other = { ...token, mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'SOL', metrics: { ...token.metrics, volume24h: '100', liquidity: '50000000' } };
  const filters = { category: 'All', liquidity: 0, sort: 'Volume' };
  assert.deepEqual(filterTokens([token,other],context,filters,false,false,[],'24H').map(t => t.mint),[other.mint,mint]);
  assert.deepEqual(filterTokens([token,other],context,filters,false,true,[mint],'24H').map(t=>t.mint),[mint]);
  assert.equal(filterTokens([token,other],context,filters,true,false,[],'24H').length,0);
  assert.equal(filterTokens([token],context,{...filters,liquidity:25000000},false,false,[],'24H').length,0);
});
test('market reads work without a session, watchlist uses PUT, uncertain submission retries preserve intent/key', async () => {
  const calls = []; let attempt = 0;
  const api = marketsApi(createApiClient({ origin: 'http://localhost:3000', getAccessToken: async () => 'session', fetchImpl: async (url, options) => {
    calls.push({ url, ...options });
    if (url.includes('/market/tokens')) return Response.json({ mode: 'PAPER', tokens: [token] });
    if (url.includes('/watchlist/')) return Response.json({ mode: 'PAPER', mint, saved: true });
    if (++attempt === 1) throw new TypeError('uncertain network');
    return Response.json({ mode: 'PAPER', orderId: id, status: 'PENDING' }, { status: 202 });
  } }));
  await api.tokens(); assert.equal(calls[0].headers.Authorization, undefined);
  await api.save(mint,true); assert.equal(calls[1].method,'PUT');
  const intent = { side: 'SELL', instrumentId: 'SOL', quantity: '0.123456789' }, key = 'same-recovery-key';
  await assert.rejects(api.submit(id,intent,key), e => e.code === 'network_error');
  assert.equal(await api.submit(id,intent,key),id);
  const submissions = calls.filter(c=>c.url.endsWith('/orders')); assert.equal(submissions.length,2);
  assert.ok(submissions.every(c=>c.headers['Idempotency-Key']===key && c.body===JSON.stringify(intent)));
});

const round = { schemaVersion:1,roundModelVersion:2,mode:'PAPER',id,captainId:'22222222-2222-4222-8222-222222222222',name:'Harbor',description:'Spot',phase:'FUNDRAISING',riskState:'NORMAL',termsVersion:1,termsHash:'a'.repeat(64),durationDays:14,fundingWindowHours:24,acceptedCapitalUsdc:'100.000000',remainingCapacityUsdc:'29900.000000',economicShares:'100.000000',participants:1,fundingClosesAt:at,tradingStartsAt:at,tradingEndsAt:at,actualActivatedAt:null,navUsdc:'100.000000',valuationStatus:'CURRENT',valuedAt:at,eventSequence:'1',serverTime:at,settlement:null,blockedReason:null };

test('current vaults include fundraising and route every trade operation to v1 without legacy reads', async () => {
  const calls=[];let vaults=[round];
  const api=marketsApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=> 'session',fetchImpl:async(url,options)=>{
    const path=new URL(url).pathname;calls.push({path,...options});
    if(path==='/v1/me/captain/vaults')return Response.json({vaults});
    if(path.endsWith('/trading-context'))return Response.json(context);
    if(path.endsWith('/orders/preview'))return Response.json({mode:'PAPER',estimate:{quantity:'1',marketPriceUsdc:'100',fillPriceUsdc:'100',feeUsdc:'0.1',cashChangeUsdc:'-100',modelVersion:1},policy:{allowed:true,reason:null},observationId:id,observedAt:at});
    if(path.endsWith('/cancel'))return Response.json({mode:'PAPER'});
    if(path.endsWith('/orders'))return Response.json({mode:'PAPER',orderId:id,status:'PENDING'});
    return Response.json({mode:'PAPER',order:{id,status:'FILLED',reject_reason:null,quantity:'1',fee_usdc:'0.1',fill_price_usdc:'100'}});
  }}));
  assert.equal((await api.funds())[0].phase,'FUNDRAISING');
  await api.context(id);await api.preview(id,{side:'BUY',instrumentId:'SOL',notionalUsdc:'100'});
  await api.submit(id,{side:'SELL',instrumentId:'SOL',quantity:'1'},'recovery-key');
  // A subsequent list that omits a round must not lose its pending-order route.
  vaults=[];await api.funds();await api.order(id,id);await api.cancel(id,id);
  assert.ok(calls.every(call=>call.path.startsWith('/v1/')));
  assert.ok(calls.every(call=>call.headers.Authorization==='Bearer session'));
  assert.equal(calls.find(call=>call.path.endsWith('/orders')&&call.method==='POST').headers['Idempotency-Key'],'recovery-key');
});

test('vault-list outages never silently switch trading to legacy trials', async()=>{
  for(const status of [401,403,500]){
    const calls=[];const api=marketsApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=> 'session',fetchImpl:async url=>{
      calls.push(url);return Response.json({error:{code:'unavailable',message:'Unavailable'}},{status});
    }}));
    await assert.rejects(api.funds());assert.ok(calls.length>=1);assert.ok(calls.every(url=>url.endsWith('/v1/me/captain/vaults')));
  }
});

test('dynamic tracking authenticates, selects the registered instrument and shares demand until the final consumer closes',async()=>{
  const dynamic=`solana:${mint}`,calls=[];
  const api=marketsApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=> 'session',fetchImpl:async(url,options)=>{
    calls.push({url,...options});
    return Response.json(url.endsWith('/tracking')?{mode:'PAPER',instrumentId:dynamic,mint,state:'WARMING',reason:'price_pending',retryAfterMs:1500,leaseExpiresAt:at}:context);
  }}));
  assert.equal((await api.track(mint)).state,'WARMING');assert.equal(calls[0].method,'POST');assert.equal(calls[0].headers.Authorization,'Bearer session');
  const releaseA=api.watchInstrument(dynamic),releaseB=api.watchInstrument(dynamic);releaseA();assert.ok(api.priceInstruments().includes(dynamic));releaseB();assert.ok(!api.priceInstruments().includes(dynamic));
  await api.context(id,undefined,dynamic);assert.equal(new URL(calls[1].url).searchParams.get('instrumentId'),dynamic);
});
