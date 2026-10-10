import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createApiClient } from '../src/api/client.ts';
import { marketsApi } from '../src/api/markets.ts';
import { activeMarketSession } from '../src/api/active-market.ts';
import { marketTradeAccess } from '../src/api/market-trade-access.ts';

const { AbortController } = createRequire(import.meta.url)('abort-controller/dist/abort-controller');
const mint='EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',instrumentId=`solana:${mint}`;
const id='11111111-1111-4111-8111-111111111111',at=new Date().toISOString();
const token={mint,instrumentId,symbol:'WIF',name:'dogwifhat',decimals:6,icon:null,category:'Tokens',tracked:true,tradable:true,tradeReason:null,verified:null,suspicious:null,
  price:{instrumentId,mint,priceUsd:'2',priceUsdc:'2',sourceAt:at,receivedAt:at,status:'CURRENT',reason:null,source:'JUPITER_PRICE_V3'},
  metrics:{denomination:'USD',source:'JUPITER_TOKENS_V2',at,status:'CURRENT',liquidity:null,volume24h:null,change1h:null,change24h:null}};
const fund={id,name:'Active paper vault',status:'ACTIVE',phase:'ACTIVE',trialEnd:new Date(Date.now()+86400000).toISOString()};
const limit={instrumentId,canBuy:true,canSell:false,reason:null,maxBuyNotionalUsdc:'100',maxSellNotionalUsdc:'0',maxSellQuantity:'0'};
const context={mode:'PAPER',fund,cashUsdc:'1000',navUsdc:'1000',holdings:[],limits:[limit],pending:[],policy:{allowedInstruments:[],maxOrderBps:1000,maxPositionBps:2500},capacityIsEstimate:true,asOf:at};
const round={schemaVersion:1,roundModelVersion:2,mode:'PAPER',id,captainId:'22222222-2222-4222-8222-222222222222',name:fund.name,description:'Spot',phase:'ACTIVE',riskState:'NORMAL',termsVersion:1,termsHash:'a'.repeat(64),durationDays:14,fundingWindowHours:24,acceptedCapitalUsdc:'1000.000000',remainingCapacityUsdc:'29000.000000',economicShares:'1000.000000',participants:2,fundingClosesAt:at,tradingStartsAt:at,tradingEndsAt:fund.trialEnd,actualActivatedAt:at,navUsdc:'1000.000000',valuationStatus:'CURRENT',valuedAt:at,eventSequence:'1',serverTime:at,settlement:null,blockedReason:null};
const listed={...token,instrumentId:null,tracked:false,tradable:false,tradeReason:'registration_required',price:{...token.price,source:'JUPITER_TOKENS_V2'}};

test('listed token registers, retains its instrument between lease renewals and uses v1 buy/sell routes',async()=>{
  let clock=Date.now(),canBuy=false;const calls=[],published=[];
  const preview={mode:'PAPER',estimate:{quantity:'5',marketPriceUsdc:'2',fillPriceUsdc:'2.01',feeUsdc:'0.01',cashChangeUsdc:'-10',modelVersion:1},policy:{allowed:true,reason:null},observationId:id,observedAt:at};
  const api=marketsApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=> 'session',fetchImpl:async(url,options)=>{
    const parsed=new URL(url);calls.push({url:parsed,options});
    if(parsed.pathname==='/v1/me/captain/vaults')return Response.json({vaults:[round]});
    if(parsed.pathname.endsWith('/tracking'))return Response.json({mode:'PAPER',mint,instrumentId,state:'READY',reason:null,retryAfterMs:1500,leaseExpiresAt:new Date(clock+30000).toISOString()});
    if(parsed.pathname.startsWith('/v0/market/tokens/'))return Response.json({mode:'PAPER',token});
    if(parsed.pathname.endsWith('/trading-context')){
      assert.equal(parsed.searchParams.get('instrumentId'),instrumentId);
      return Response.json({...context,limits:[{...limit,canBuy,reason:canBuy?null:'price_unavailable'}]});
    }
    if(parsed.pathname.endsWith('/orders/preview'))return Response.json(preview);
    if(parsed.pathname.endsWith('/orders'))return Response.json({mode:'PAPER',orderId:id,status:'PENDING'},{status:202});
    return Response.json({mode:'PAPER',order:{id,status:'FILLED',reject_reason:null,quantity:'5',fee_usdc:'0.01',fill_price_usdc:'2.01'}});
  }}));
  await api.funds();
  const session=activeMarketSession(api,listed,value=>published.push(value),()=>clock),controller=new AbortController();
  let resolved=await session.refresh(context,controller.signal);
  assert.equal(marketTradeAccess(resolved.token,resolved.context,'captain','BUY',null).allowed,false);
  canBuy=true;clock+=5000;
  resolved=await session.refresh(context,controller.signal);
  assert.equal(marketTradeAccess(resolved.token,resolved.context,'captain','BUY',null).allowed,true);
  assert.equal(calls.filter(call=>call.url.pathname.endsWith('/tracking')).length,1,'refresh preserves identity without renewing every time');
  assert.equal(published.length,2);
  assert.ok(api.priceInstruments().includes(instrumentId));
  for(const intent of [{side:'BUY',instrumentId,notionalUsdc:'10'},{side:'SELL',instrumentId,quantity:'5'}]){
    assert.equal((await api.preview(id,intent)).policy.allowed,true);
    assert.equal(await api.submit(id,intent,`recovery-${intent.side}`),id);
    assert.equal((await api.order(id,id)).status,'FILLED');
  }
  const orders=calls.filter(call=>call.url.pathname.includes('/orders'));
  assert.ok(orders.every(call=>call.url.pathname.startsWith(`/v1/vaults/${id}/`)));
  assert.ok(orders.every(call=>call.options.headers.Authorization==='Bearer session'));
  assert.equal(orders.find(call=>call.options.headers['Idempotency-Key']==='recovery-SELL').options.body,JSON.stringify({side:'SELL',instrumentId,quantity:'5'}));
  clock+=15000;await session.refresh(context,controller.signal);
  assert.equal(calls.filter(call=>call.url.pathname.endsWith('/tracking')).length,2);
  session.dispose();assert.ok(!api.priceInstruments().includes(instrumentId));
});

test('cancelled vault and allowlist blockers are explained without enabling forbidden trades',()=>{
  const cancelled={...context,fund:{...fund,status:'COMPLETED',phase:'CANCELLED'}};
  const blocked=marketTradeAccess(listed,cancelled,'captain','BUY','Market is warming up');
  assert.equal(blocked.allowed,false);assert.match(blocked.reason,/cancelled/);
  const restricted={...context,limits:[{...limit,canBuy:false,reason:'asset_not_allowed'}]};
  assert.match(marketTradeAccess(token,restricted,'captain','BUY',null).reason,/rules do not include/);
  assert.match(marketTradeAccess(token,{...context,fund:{...fund,phase:'FUNDRAISING'}},'captain','BUY',null).reason,/fundraising/);
  assert.equal(marketTradeAccess(listed,context,'captain','BUY',null).allowed,false);
  assert.equal(marketTradeAccess({...token,price:{...token.price,source:'JUPITER_TOKENS_V2'}},context,'captain','BUY',null).allowed,false);
});

test('sell-only holdings stay usable and stale prices still block execution',()=>{
  const held={...context,holdings:[{instrumentId,mint,symbol:'WIF',quantity:'5',costBasisUsdc:'10',valueUsdc:'10'}],limits:[{...limit,canBuy:false,canSell:true,reason:'asset_disabled',maxSellQuantity:'5'}]};
  const sellOnly={...token,tradable:false,tradeReason:'asset_disabled'};
  assert.equal(marketTradeAccess(sellOnly,held,'captain','SELL',null).allowed,true);
  assert.equal(marketTradeAccess(sellOnly,held,'captain','BUY',null).allowed,false);
  assert.equal(marketTradeAccess({...token,price:{...token.price,status:'STALE'}},held,'captain','SELL',null).allowed,false);
  assert.match(marketTradeAccess(token,context,'captain','SELL',null).reason,/does not hold/);
});

test('token data remains available when private context fails; disposed sessions do not retain tracking',async()=>{
  const seen=[];let watched=false;
  const api={track:async()=>({instrumentId}),watchInstrument:()=>{watched=true;return()=>{watched=false;}},token:async()=>token,
    context:async()=>{throw new Error('Vault context unavailable');}};
  const session=activeMarketSession(api,listed,value=>seen.push(value));
  await assert.rejects(session.refresh(context,new AbortController().signal),/context unavailable/);
  assert.equal(seen[0].mint,mint);session.dispose();assert.equal(watched,false);
});
