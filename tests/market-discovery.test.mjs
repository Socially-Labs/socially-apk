import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createApiClient } from '../src/api/client.ts';
import { parseMarketList } from '../src/api/generated/market-contracts.ts';
import { marketsApi, discoveryToken, priceFreshness } from '../src/api/markets.ts';
import { filterTokens, periodChange } from '../src/components/markets/market-data.ts';
const at=new Date().toISOString(), mint='JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
const token={mint,instrumentId:null,symbol:'SAME',name:'Browse token',decimals:6,icon:null,category:'unknown',tracked:false,tradable:false,tradeReason:'unsupported_instrument',
  verified:null,suspicious:null,rank:1,price:{usd:'2',source:'JUPITER_TOKENS_V2',sourceAt:at,receivedAt:at,status:'CURRENT',usableForExecution:false},
  metrics:{interval:'1h',volumeUsd:'20',liquidityUsd:null,changePercent:'-2',source:'JUPITER_TOKENS_V2',asOf:at,status:'CURRENT',coverage:'COMPLETE'}};
const list={schemaVersion:1,mode:'PAPER',feed:'trending',interval:'1h',sort:'rank',scope:'PROVIDER_CANDIDATES',snapshotId:'fixture',asOf:at,fetchedAt:at,refreshAfter:at,status:'CURRENT',rankingStatus:'AVAILABLE',candidateCount:2,unrankedCount:0,nextCursor:null,items:[token]};
test('chart-free discovery never requests history',async()=>{
  const paths=[];
  const api=marketsApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=>null,fetchImpl:async url=>{
    paths.push(String(url));return new Response(JSON.stringify(list),{status:200});
  }}));
  const result=await api.discoveryPage({feed:'trending',interval:'1h',sort:'rank'},'',undefined,undefined,undefined,false);
  assert.equal(result.tokens.length,1);
  assert.deepEqual(result.histories,{});
  assert.equal(paths.length,1);
  assert.ok(!paths[0].includes('/history'));
});
// This is the actual AbortController implementation installed by React Native.
const { AbortController: NativeAbortController } = createRequire(import.meta.url)('abort-controller/dist/abort-controller');
test('generated market contracts exactly match backend source',async()=>{
  const source=await readFile(new URL('../../backend/packages/contracts/src/markets.ts',import.meta.url),'utf8');
  const generated=await readFile(new URL('../src/api/generated/market-contracts.ts',import.meta.url),'utf8');
  assert.equal(generated.slice(generated.indexOf('\n')+1),source);
});
test('parser preserves unknown flags and rejects execution provenance and malformed money',()=>{
  assert.equal(parseMarketList(list).items[0].suspicious,null);
  for(const patch of [{price:{...token.price,usableForExecution:true}},{price:{...token.price,usd:'NaN'}},
    {metrics:{...token.metrics,volumeUsd:'-1'}},{tradable:true}])assert.throws(()=>parseMarketList({...list,items:[{...token,...patch}]}));
  assert.throws(()=>parseMarketList({...list,items:[token,token]}));
});
test('provider rank, selected interval and incomplete history remain authoritative',()=>{
  const a=discoveryToken(token),b=discoveryToken({...token,mint:'So11111111111111111111111111111111111111112',rank:2,metrics:{...token.metrics,volumeUsd:'999'}});
  const filters={category:'All',liquidity:0,sort:'Volume'};
  assert.deepEqual(filterTokens([a,b],null,filters,false,false,[],'1H',true).map(t=>t.discovery.rank),[1,2]);
  assert.equal(a.metrics.volume24h,null);assert.equal(periodChange(a,'1H'),'-2');
  const incomplete=discoveryToken({...token,metrics:{...token.metrics,interval:'7d',changePercent:null,coverage:'PARTIAL'}});
  assert.equal(periodChange(incomplete,'7D',{range:'7D',changePercent:'20'}),null);
  assert.equal(a.category,'Unknown');assert.equal(priceFreshness(a.price,Date.parse(at)+60_001).status,'STALE');
});
test('discovery uses public reads, preserves mixed-case mint queries and cursor encoding',async()=>{
  const calls=[];
  const api=marketsApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=>{throw new Error('Public reads must not acquire credentials');},
    fetchImpl:async(url,options)=>{calls.push({url:String(url),options});return Response.json(list);}}));
  await api.discovery({feed:'trending',interval:'1h',sort:'rank'},mint);
  assert.equal(new URL(calls[0].url).searchParams.get('query'),mint);assert.match(calls[0].url,/\/v1\/markets\/search/);
  await api.discovery({feed:'toptraded',interval:'24h',sort:'rank'},'',undefined,'a+/=');
  assert.equal(new URL(calls[1].url).searchParams.get('cursor'),'a+/=');
});
test('chart requests coalesce and a cancelled consumer does not cancel another reader',async()=>{
  let calls=0,finish;
  const history={mode:'PAPER',mint,instrumentId:'JUP',range:'1H',denomination:'USD',intervalSeconds:10,from:at,to:at,changePercent:null,points:[],coverage:{start:null,end:null,status:'UNAVAILABLE',hasGaps:false}};
  const api=marketsApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=>null,fetchImpl:async()=>{calls++;await new Promise(resolve=>finish=resolve);return Response.json(history);}}));
  const controller=new AbortController(),first=api.history(mint,'1H',controller.signal),second=api.history(mint,'1H');
  controller.abort();await assert.rejects(first);
  finish();assert.equal((await second).mint,mint);assert.equal(calls,1);
});
test('token images use the configured backend and mint identity; missing logos retain the fallback',async()=>{
  const otherMint='So11111111111111111111111111111111111111112';
  const items=[{...token,icon:'https://ipfs.io/ipfs/old-image'}, {...token,mint:otherMint,icon:'https://example.com/other.png'},
    {...token,mint:'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',icon:null}];
  const api=marketsApi(createApiClient({origin:'http://192.168.1.8:3000',getAccessToken:async()=>null,
    fetchImpl:async()=>Response.json({...list,items,candidateCount:3})}));
  const result=await api.discovery({feed:'trending',interval:'1h',sort:'rank'});
  assert.equal(result.tokens[0].icon,`http://192.168.1.8:3000/v1/markets/${mint}/icon`);
  assert.equal(result.tokens[1].icon,`http://192.168.1.8:3000/v1/markets/${otherMint}/icon`);
  assert.notEqual(result.tokens[0].icon,result.tokens[1].icon);
  assert.equal(result.tokens[2].icon,null);
});
test('empty chart cache refreshes after five seconds while established charts retain thirty-second coalescing',async()=>{
  const originalNow=Date.now;let clock=originalNow(),calls=0,points=[];
  Date.now=()=>clock;
  try {
    const history={mode:'PAPER',mint,instrumentId:'JUP',range:'1H',denomination:'USD',intervalSeconds:10,
      from:new Date(clock-3600000).toISOString(),to:new Date(clock).toISOString(),changePercent:null,
      coverage:{start:null,end:null,status:'UNAVAILABLE',hasGaps:false}};
    const api=marketsApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=>null,
      fetchImpl:async()=>{calls++;return Response.json({...history,points});}}));
    assert.equal((await api.history(mint,'1H')).points.length,0);
    clock+=4000;await api.history(mint,'1H');assert.equal(calls,1);
    points=[{at:new Date(clock-2000).toISOString(),price:'1'},{at:new Date(clock-1000).toISOString(),price:'2'}];
    history.to=new Date(clock).toISOString();clock+=1001;
    assert.equal((await api.history(mint,'1H')).points.length,2);assert.equal(calls,2);
    clock+=6000;await api.history(mint,'1H');assert.equal(calls,2);
  }finally{Date.now=originalNow;}
});

test('only expanded 24h chart requests opt into backfill; list cache cannot suppress them',async()=>{
  const calls=[],history={mode:'PAPER',mint,instrumentId:'JUP',range:'24H',denomination:'USD',intervalSeconds:300,
    from:at,to:at,changePercent:null,points:[],coverage:{start:null,end:null,status:'UNAVAILABLE',hasGaps:false}};
  const api=marketsApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=>null,
    fetchImpl:async url=>{calls.push(new URL(url));return Response.json(history);}}));
  await api.history(mint,'24H');
  await Promise.all([api.history(mint,'24H',undefined,true),api.history(mint,'24H',undefined,true)]);
  assert.equal(calls.length,2);
  assert.equal(calls[0].searchParams.has('backfill'),false);
  assert.equal(calls[1].searchParams.get('backfill'),'true');
});

test('ten-market pages wait for the whole chart batch, coalesce and cache repeat reads',async()=>{
  const calls=[];let release;
  const history={mode:'PAPER',mint,instrumentId:'JUP',range:'24H',denomination:'USD',intervalSeconds:300,
    from:at,to:at,changePercent:null,points:[],coverage:{start:null,end:null,status:'UNAVAILABLE',hasGaps:false}};
  const api=marketsApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=>null,
    fetchImpl:async url=>{const parsed=new URL(url);calls.push(parsed);
      if(parsed.pathname.endsWith('/history/batch')){await new Promise(resolve=>release=resolve);return Response.json({mode:'PAPER',range:'24H',items:[{mint,history,status:'READY'}]});}
      return Response.json(list);
    }}));
  const options={feed:'trending',interval:'1h',sort:'rank'};
  let published=false;
  const first=api.discoveryPage(options).then(page=>{published=true;return page;});
  const second=api.discoveryPage(options);
  while(!release)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(published,false);assert.equal(calls.length,2);
  assert.equal(calls[0].searchParams.get('limit'),'10');
  assert.equal(calls[1].searchParams.has('backfill'),false);
  release();const [a,b]=await Promise.all([first,second]);
  assert.equal(a.histories[mint].range,'24H');assert.deepEqual(a,b);
  await api.discoveryPage(options);assert.equal(calls.length,2);
  api.invalidateDiscovery();await api.discovery(options);assert.equal(calls.length,3);
});

test('search cursors and chart-batch cancellation preserve shared requests',async()=>{
  let calls=0,release;
  const api=marketsApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=>null,
    fetchImpl:async url=>{calls++;const parsed=new URL(url);
      if(parsed.pathname.endsWith('/history/batch')){await new Promise(resolve=>release=resolve);return Response.json({mode:'PAPER',range:'24H',items:[{mint,history:null,status:'UNAVAILABLE'}]});}
      assert.equal(parsed.searchParams.get('cursor'),'next+/=');assert.equal(parsed.searchParams.get('limit'),'10');return Response.json(list);
    }}));
  await api.discovery({feed:'trending',interval:'24h',sort:'rank'},'Token',undefined,'next+/=');
  const controller=new AbortController(),first=api.historyBatch([mint],controller.signal),second=api.historyBatch([mint]);
  controller.abort();await assert.rejects(first);release();assert.equal((await second)[mint],null);assert.equal(calls,2);
});

test('failed chart batches are evicted and malformed or partial batches never publish',async()=>{
  let calls=0;
  const api=marketsApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=>null,
    fetchImpl:async()=>{calls++;return Response.json({mode:'PAPER',range:'24H',items:calls===1?[]:[{mint,history:null,status:'UNAVAILABLE'}]});}}));
  await assert.rejects(api.historyBatch([mint]),/unexpected response/);
  assert.equal((await api.historyBatch([mint]))[mint],null);assert.equal(calls,2);
  await assert.rejects(api.historyBatch(Array(11).fill(mint).map((m,i)=>m+String(i))),/Invalid/);
});

test('React Native abort signals support catalog, chart batches and individual charts',async()=>{
  const history={mode:'PAPER',mint,instrumentId:'JUP',range:'24H',denomination:'USD',intervalSeconds:300,
    from:at,to:at,changePercent:null,points:[],coverage:{start:null,end:null,status:'UNAVAILABLE',hasGaps:false}};
  let calls=0;
  const api=marketsApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=>null,fetchImpl:async url=>{
    calls++;
    if(url.includes('/history/batch'))return Response.json({mode:'PAPER',range:'24H',items:[{mint,history,status:'READY'}]});
    if(url.includes('/history?'))return Response.json(history);
    return Response.json(list);
  }}));
  const controller=new NativeAbortController(),signal=controller.signal,options={feed:'trending',interval:'1h',sort:'rank'};
  assert.equal(signal.throwIfAborted,undefined);
  assert.equal((await api.discoveryPage(options,'',signal)).tokens[0].mint,mint);
  assert.equal((await api.history(mint,'24H',signal)).mint,mint);
  controller.abort();
  for(const request of [()=>api.discovery(options,'',signal),()=>api.historyBatch([mint],signal),()=>api.history(mint,'24H',signal)]) {
    await assert.rejects(request(),error=>error.code==='request_cancelled');
  }
  assert.equal(calls,3);
});

test('initial token metadata is published before charts and survives chart failures',async()=>{
  let release,visible;
  const api=marketsApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=>null,fetchImpl:async url=>{
    if(url.includes('/history/batch')){await new Promise(resolve=>release=resolve);return Response.json({mode:'PAPER',range:'24H',items:[]});}
    return Response.json(list);
  }}));
  const pending=api.discoveryPage({feed:'trending',interval:'1h',sort:'rank'},'',new NativeAbortController().signal,undefined,page=>visible=page);
  while(!release)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(visible.tokens[0].mint,mint,'names and prices are usable while charts are pending');
  release();
  const result=await pending;
  assert.equal(result.tokens[0].mint,mint);
  assert.deepEqual(result.histories,{});
});

test('React Native cancellation of shared chart hydration is never swallowed as a chart outage',async()=>{
  let release;
  const api=marketsApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=>null,fetchImpl:async url=>{
    if(url.includes('/history/batch')){await new Promise(resolve=>release=resolve);return Response.json({mode:'PAPER',range:'24H',items:[{mint,history:null,status:'UNAVAILABLE'}]});}
    return Response.json(list);
  }}));
  const controller=new NativeAbortController();
  const pending=api.discoveryPage({feed:'trending',interval:'1h',sort:'rank'},'',controller.signal);
  while(!release)await new Promise(resolve=>setImmediate(resolve));
  controller.abort();
  await assert.rejects(pending,error=>error.code==='request_cancelled');
  release();
  assert.equal((await api.historyBatch([mint]))[mint],null);
});
