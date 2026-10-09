import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLiveOperation,liveVaultsApi } from '../src/api/live-vaults.ts';
const id='11111111-1111-4111-8111-111111111111',wallet='So11111111111111111111111111111111111111112';
const op={id,clientRequestId:id,vaultId:id,fundAddress:wallet,wallet,seedUsdcRaw:'100000000',kind:'CREATE',mode:'ONCHAIN',cluster:'devnet',asset:'SOL',amountRaw:'1000000000',status:'PREPARED',transaction:'AAAA',signature:null,lastValidBlockHeight:100,fees:{networkFeeLamports:'5000',priorityFeeLamports:'0',accountRentLamports:'4000000'},failure:null};
test('onchain vault parser fails closed on paper mode, wrong cluster, missing minimum and invalid fees',()=>{
 assert.equal(parseLiveOperation(op).asset,'SOL');
 for(const patch of [{mode:'PAPER'},{cluster:'mainnet'},{seedUsdcRaw:'99999999'},{amountRaw:'18446744073709551616'},{kind:'EXIT'},{fees:{...op.fees,networkFeeLamports:'-1'}},{status:'SUBMITTED'},{wallet:'invalid'}])assert.throws(()=>parseLiveOperation({...op,...patch}));
 assert.equal(parseLiveOperation({...op,status:'CONFIRMED',transaction:null}).status,'CONFIRMED');
});
test('funding preparation binds response to the requested wallet, asset, amount and request ID',async()=>{
 const body={clientRequestId:id,wallet,asset:'SOL',amountRaw:'1000000000',name:'Harbor',description:''};
 const api=liveVaultsApi({request:async()=>({operation:op})});assert.equal((await api.prepare(body)).id,id);
 for(const patch of [{asset:'USDC'},{amountRaw:'1000000001'},{wallet:'11111111111111111111111111111111'},{clientRequestId:'22222222-2222-4222-8222-222222222222'}])await assert.rejects(api.prepare({...body,...patch}));
});
