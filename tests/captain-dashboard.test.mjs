import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCaptainDashboard,parseCaptainPerformance,captainDashboardApi } from '../src/api/captain-dashboard.ts';
import { createApiClient } from '../src/api/client.ts';
const time='2026-10-09T00:00:00Z';
const dashboard={schemaVersion:1,mode:'PAPER',state:'NEW',vaultCount:0,activeVaults:0,openVaults:0,crewMembers:0,aumUsdc:'0.000000',valuationStatus:'CURRENT',serverTime:time,
 earnings:{earnedUsdc:'0.000000',claimedUsdc:'0.000000',claimableUsdc:'0.000000'},creation:{allowed:true,reason:null,seedUsdc:'100.000000',availableUsdc:'10000.000000'}};
test('new Captain, unavailable values, and rejected creation remain distinct',()=>{
 assert.equal(parseCaptainDashboard(dashboard).state,'NEW');
 assert.equal(parseCaptainDashboard({...dashboard,state:'EXISTING',vaultCount:1,aumUsdc:null,valuationStatus:'UNAVAILABLE',creation:{...dashboard.creation,allowed:false,reason:'open_round_exists'}}).aumUsdc,null);
 for(const patch of [{state:'EXISTING'},{aumUsdc:null},{crewMembers:-1},{creation:{...dashboard.creation,allowed:false}},{earnings:{...dashboard.earnings,earnedUsdc:'NaN'}}])assert.throws(()=>parseCaptainDashboard({...dashboard,...patch}));
});
test('AUM history validates its period and gaps without turning them into zeroes',()=>{
 const p={mode:'PAPER',range:'90D',intervalSeconds:86400,points:[{at:time,aumUsdc:null}],coverage:'PARTIAL',changeUsdc:null,changePercent:null,methodology:'Includes capital flows'};
 assert.equal(parseCaptainPerformance(p,'90D').points[0].aumUsdc,null);
 assert.throws(()=>parseCaptainPerformance(p,'30D'));
 assert.throws(()=>parseCaptainPerformance({...p,points:[{at:time,aumUsdc:'1'},{at:time,aumUsdc:'2'}]},'90D'));
 assert.throws(()=>parseCaptainPerformance({...p,changeUsdc:'NaN'},'90D'));
});
test('private dashboard and paginated roster requests use authenticated routes',async()=>{
 const calls=[];const api=captainDashboardApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=> 'test',fetchImpl:async(url,options)=>{calls.push({url,options});return Response.json(url.includes('/crew')?{mode:'PAPER',members:[],nextCursor:null}:dashboard);}}));
 await api.dashboard();await api.crew('11111111-1111-4111-8111-111111111111');
 assert.equal(calls[0].url,'http://localhost:3000/v1/me/captain/dashboard');assert.equal(calls[0].options.headers.Authorization,'Bearer test');assert.match(calls[1].url,/crew\?after=/);
});
