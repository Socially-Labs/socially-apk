import assert from 'node:assert/strict';
import test from 'node:test';
import {publishWalletChange,subscribeWalletChanges} from '../src/api/wallet-changes.ts';
test('wallet invalidations stay scoped to the signed-in account and stop after unsubscribe',()=>{
 let a=0,b=0;
 const stopA=subscribeWalletChanges('a',()=>a++),stopB=subscribeWalletChanges('b',()=>b++);
 publishWalletChange('a');assert.equal(a,1);assert.equal(b,0);
 stopA();publishWalletChange('a');assert.equal(a,1);
 publishWalletChange('b');assert.equal(b,1);stopB();
});
