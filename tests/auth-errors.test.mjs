import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage, validEmail, secondsUntilResend } from '../src/auth/auth-errors.ts';
import { authFailureDetails, reportAuthFailure } from '../src/auth/auth-diagnostics.ts';

test('email validation rejects spaces, missing domains, and overly long addresses', () => {
  for (const email of ['', 'not-an-email', 'a@', 'a@localhost', 'a b@example.com', `${'a'.repeat(255)}@example.com`]) {
    assert.equal(validEmail(email), false, email);
  }
  assert.equal(validEmail('first.last+tag@example.co.uk'), true);
});

test('resend cooldown catches up after the app has been backgrounded', () => {
  assert.equal(secondsUntilResend(30_000, 0), 30);
  assert.equal(secondsUntilResend(30_000, 29_001), 1);
  assert.equal(secondsUntilResend(30_000, 90_000), 0);
});

test('SDK errors never expose raw server details in the form', () => {
  assert.equal(authErrorMessage(new Error('internal tenant configuration: secret'), 'send'), 'We couldn’t send your code. Check your email address and try again.');
  assert.match(authErrorMessage({ code: 'rate_limit_exceeded' }, 'send'), /Too many attempts/);
  assert.match(authErrorMessage(new Error('Failed to fetch'), 'verify'), /connection/);
  assert.match(authErrorMessage(new Error('expired_code'), 'verify'), /invalid or has expired/);
  assert.match(authErrorMessage(new Error('AUTH_NOT_CONFIGURED'), 'send'), /temporarily unavailable/);
  assert.match(authErrorMessage({code:'configuration_error',error:'Native app identifier is not allowed'},'send'),/unavailable for this app/);
  assert.match(authErrorMessage({code:'invalid_native_app_id',status:403},'send'),/unavailable for this app/);
  assert.match(authErrorMessage({error:'network unavailable'},'send'),/connection/);
});

test('pre-login diagnostics exclude email, OTP, provider messages and credentials',async()=>{
  let payload;
  const warn=console.warn;console.warn=()=>{};
  try {
    await reportAuthFailure('send',{code:'invalid_app_client',status:403,message:'person@example.com secret',token:'secret',otp:'123456'},'android','http://localhost:3000',async(url,options)=>{
      assert.equal(url,'http://localhost:3000/v0/auth/client-events');
      assert.equal(options.headers.Authorization,undefined);payload=JSON.parse(options.body);return new Response(null,{status:204});
    });
    assert.deepEqual(payload,{operation:'send',platform:'android',code:'invalid_app_client',status:403});
    assert.deepEqual(authFailureDetails({code:'Bearer sensitive.token',status:200}),{code:'unknown_error'});
    await reportAuthFailure('send',new Error('failure'),'android',undefined,async()=>{throw new Error('offline');});
  } finally {console.warn=warn;}
});
