import assert from 'node:assert/strict';
import test from 'node:test';
import { registerWalletDepositAlerts } from '../src/api/wallet-notifications.ts';
import { ApiError } from '../src/api/client.ts';
test('registration requires an explicit devnet watch confirmation',async()=>{
 const signal=new AbortController().signal;
 await registerWalletDepositAlerts({request:async(path,options)=>{assert.equal(path,'/v0/me/wallet-notifications');assert.equal(options.method,'PUT');assert.deepEqual(options.body,{address:'wallet'});assert.equal(options.signal,signal);return{watching:true,network:'devnet'};}},'wallet',signal);
 for(const response of [{},null,{watching:false,network:'devnet'},{watching:true,network:'mainnet'}])await assert.rejects(registerWalletDepositAlerts({request:async()=>response},'wallet'),e=>e.code==='invalid_response');
});
test('disabled registration remains an actionable failure for automatic retries',async()=>{
 await assert.rejects(registerWalletDepositAlerts({request:async()=>{throw new ApiError('wallet_notifications_disabled','Disabled',503);}},'wallet'),e=>e.code==='wallet_notifications_disabled');
});
