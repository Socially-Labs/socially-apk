import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSwapQuote,parseWalletSwap,swapsApi } from '../src/api/swaps.ts';
const id='00000000-0000-4000-8000-000000000001',requestId='00000000-0000-4000-8000-000000000002',wallet='11111111111111111111111111111111';
const quote=()=>({id,wallet,cluster:'devnet',input:'SOL',output:'USDC',amount:'1000000',outputAmount:'20000',minimumOutput:'19800',slippageBps:100,priceImpact:1,hops:1,venueFees:[{mint:wallet,amountRaw:'2500'}],expiresAt:new Date(Date.now()+30000).toISOString()});
const swap=()=>({id,quoteId:id,clientRequestId:requestId,wallet,cluster:'devnet',status:'PREPARED',quote:quote(),transaction:'AQ==',signature:null,blockhash:wallet,lastValidBlockHeight:100,fees:{networkFeeLamports:'5000',priorityFeeLamports:'1000',accountRentLamports:'0'},filledOutputRaw:null,actualNetworkFeeLamports:null,failure:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
test('swap response parsers reject unsafe amounts, cluster, costs and inconsistent identities',()=>{
 assert.equal(parseSwapQuote(quote()).input,'SOL');assert.equal(parseWalletSwap(swap()).status,'PREPARED');
 for(const patch of [{cluster:'mainnet'},{amount:'18446744073709551616'},{priceImpact:6},{minimumOutput:'1'},{slippageBps:1000},{expiresAt:'never'},{venueFees:[{mint:wallet,amountRaw:'-1'}]}])assert.throws(()=>parseSwapQuote({...quote(),...patch}));
 for(const patch of [{wallet:'22222222222222222222222222222222'},{status:'SUBMITTED'},{status:'CONFIRMED'},{transaction:null},{fees:{networkFeeLamports:'5000',priorityFeeLamports:'6000',accountRentLamports:'0'}}])assert.throws(()=>parseWalletSwap({...swap(),...patch}));
});
test('API uses authenticated backend routes and binds returned intents to the request',async()=>{
 const calls=[],client=swapsApi({request:async(path,options)=>{calls.push({path,options});return path.endsWith('/quotes')?{quote:quote()}:{swap:swap()};}});
 await client.quote('SOL','1000000',wallet);await client.prepare(id,requestId);await client.get(id);await client.submit(id,'signed-wire');
 assert.deepEqual(calls.map(c=>c.path),['/v1/me/swaps/quotes','/v1/me/swaps',`/v1/me/swaps/${id}`,`/v1/me/swaps/${id}/submit`]);
 assert.deepEqual(calls[3].options.body,{signedTransaction:'signed-wire'});
 const malicious=swapsApi({request:async()=>({quote:quote()})});await assert.rejects(malicious.quote('USDC','1',wallet));
 const wrongIntent=swapsApi({request:async()=>({swap:swap()})});await assert.rejects(wrongIntent.prepare(requestId,requestId));
});
