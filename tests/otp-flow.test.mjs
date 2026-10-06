import assert from 'node:assert/strict';
import test from 'node:test';
import { otpEdit } from '../src/auth/otp-model.ts';
import { completeAuthSession, initialAuthCompletion, observeAuthSession } from '../src/auth/auth-completion-model.ts';
import { authMorphPath, authMorphRig } from '../src/components/auth/auth-morph-rig.ts';

test('typing or pasting a complete OTP submits once and stays recoverable after failure',()=>{
  let lastAttempt=null;
  let submissions=0;
  for(const value of ['1','12','123','1234','12345','123456','123456','123456']) {
    const edit=otpEdit(value,lastAttempt);lastAttempt=edit.lastAttempt;
    if(edit.autoSubmit)submissions++;
  }
  assert.equal(submissions,1,'Duplicate autofill events cannot retry a failed code');
  const deletion=otpEdit('12345',lastAttempt);assert.equal(deletion.autoSubmit,false);
  assert.equal(otpEdit('123457',deletion.lastAttempt).autoSubmit,true,'Correcting the final digit retries');
  const pasted=otpEdit('123 456',null);assert.equal(pasted.code,'123456');assert.equal(pasted.autoSubmit,true);
  assert.equal(otpEdit('abc123456789',null).code,'123456');
});

test('restored sessions skip success while new login waits for completion',()=>{
  assert.equal(observeAuthSession(initialAuthCompletion,false,null),initialAuthCompletion);
  const restored=observeAuthSession(initialAuthCompletion,true,'returning');
  assert.equal(restored.pending,false);
  const signedOut=observeAuthSession(restored,true,null);
  const login=observeAuthSession(signedOut,true,'returning');
  assert.equal(login.pending,true);
  assert.equal(observeAuthSession(login,true,'returning'),login,'Rerenders do not restart the interlude');
  assert.equal(completeAuthSession(login,'returning').pending,false);
});

test('logout and account switching invalidate an old success-sheet completion',()=>{
  const signedOut=observeAuthSession(initialAuthCompletion,true,null);
  const a=observeAuthSession(signedOut,true,'a');
  const b=observeAuthSession(a,true,'b');
  assert.equal(completeAuthSession(b,'a'),b,'An old sheet cannot release a new account');
  assert.equal(observeAuthSession(b,true,null).pending,false);
});

test('auth morph geometry retains valid correspondence at endpoints and intermediate frames',()=>{
  for(const slot of ['frame','mark']){
    const count=slot==='frame'?4:2;
    for(const state of authMorphRig){
      assert.equal(state[slot].length,count);
      for(const segment of state[slot]){assert.equal(segment.length,8);assert.ok(segment.every(Number.isFinite));}
    }
    for(const position of [0,.25,.5,.75,1,1.25,1.5,1.75,2]){
      const path=authMorphPath(position,slot);
      assert.equal((path.match(/C/g)??[]).length,count);
      assert.ok(!/NaN|undefined|Infinity/.test(path));
    }
    assert.equal(authMorphPath(-1,slot),authMorphPath(0,slot));
    assert.equal(authMorphPath(3,slot),authMorphPath(2,slot));
  }
});
