import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {createApiClient} from '../src/api/client.ts';
import {parsePaperPortfolio,paperPortfolioApi} from '../src/api/paper-portfolio.ts';
const wallet='So11111111111111111111111111111111111111112';
const initial={mode:'PAPER',enabled:true,initialized:false,availableUsdc:'0.000000',initialUsdc:null,wallet:null,initializedAt:null};
const ready={...initial,initialized:true,availableUsdc:'500.000000',initialUsdc:'600.000000',wallet,initializedAt:new Date().toISOString()};
test('portfolio parser rejects mixed modes and malformed balances',()=>{
 assert.deepEqual(parsePaperPortfolio(initial),initial);assert.deepEqual(parsePaperPortfolio(ready),ready);
 for(const changes of [{mode:'SOLANA'},{availableUsdc:600},{availableUsdc:'-1.000000'},{initialUsdc:null},{wallet:'invalid'},{initializedAt:'invalid'},{initialized:false}])assert.throws(()=>parsePaperPortfolio({...ready,...changes}));
});
test('initialization sends only the authenticated wallet and propagates cancellation',async()=>{
 const calls=[];const api=paperPortfolioApi(createApiClient({origin:'http://localhost:3000',getAccessToken:async()=> 'session',fetchImpl:async(url,options)=>{calls.push({url,options});assert.equal(options.headers.Authorization,'Bearer session');return Response.json(options.method==='POST'?ready:initial);}}));
 assert.equal((await api.read()).initialized,false);assert.equal((await api.initialize(wallet)).initialUsdc,'600.000000');assert.deepEqual(JSON.parse(calls[1].options.body),{wallet});assert.ok(calls[1].url.endsWith('/v1/me/paper-portfolio/initialize'));
 const controller=new AbortController();controller.abort();await assert.rejects(api.initialize(wallet,controller.signal));assert.equal(calls.length,2);
});
test('active create route uses the original harbor screen',async()=>{
 const route=await readFile(new URL('../src/app/vaults/create.tsx',import.meta.url),'utf8');assert.match(route,/VaultCreateScreen as default/);assert.doesNotMatch(route,/LiveVaultCreateScreen/);
});
