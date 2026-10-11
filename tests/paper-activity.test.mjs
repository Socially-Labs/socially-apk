import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePaperActivity,paperActivityApi } from '../src/api/paper-activity.ts';
import { holdingPerformance } from '../src/api/holding-performance.ts';
const id='11111111-1111-4111-8111-111111111111';
const item={id,fund_id:id,vault_name:'Vault',kind:'SELL',status:'FILLED',reason:null,instrument_id:'SOL',symbol:'SOL',amount_usdc:'10',at:'2026-10-11T00:00:00Z',quantity:'1',fee_usdc:'0.01',fill_price_usdc:'10'};
test('activity validates statuses, monetary fields and cursor before rendering',()=>{
  assert.equal(parsePaperActivity({mode:'PAPER',items:[item],nextCursor:null}).items[0].kind,'SELL');
  for(const change of [{status:'UNKNOWN'},{amount_usdc:'NaN'},{at:'nope'},{quantity:-1}])assert.throws(()=>parsePaperActivity({mode:'PAPER',items:[{...item,...change}],nextCursor:null}));
  assert.throws(()=>parsePaperActivity({mode:'PAPER',items:[],nextCursor:'bad'}));
});
test('activity uses the authenticated personal endpoint and a bounded page',async()=>{
  let path;
  await paperActivityApi({request:async url=>{path=url;return {mode:'PAPER',items:[],nextCursor:null};}}).list(id);
  assert.equal(path,`/v1/me/paper-activity?limit=20&after=${id}`);
});
test('holding P&L reflects gains and losses and never turns missing prices into zero',()=>{
  assert.deepEqual(holdingPerformance({valueUsdc:'110',costBasisUsdc:'100'}),{costBasisUsdc:100,pnlUsdc:10,pnlPercent:10});
  assert.equal(holdingPerformance({valueUsdc:'80',costBasisUsdc:'100'}).pnlPercent,-20);
  assert.equal(holdingPerformance({valueUsdc:null,costBasisUsdc:'100'}),null);
  assert.equal(holdingPerformance({valueUsdc:'1',costBasisUsdc:'0'}).pnlPercent,null);
});
