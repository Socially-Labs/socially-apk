import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiError, apiOrigin, createApiClient, parseAccount } from '../src/api/client.ts';
import { AccountStore } from '../src/api/account-store.ts';

const user = (id = '11111111-1111-4111-8111-111111111111') => ({ id, displayName: 'Trader', username: null, role: null,
  bio: '', avatarUrl: null, bannerUrl: null, mode: 'PAPER', paperCash: { value: '10000.000000000000000000', asset: 'USDC' } });
const bootstrap = (subject, account = user()) => ({ provider: 'privy', mode: 'PAPER', privyUserId: subject, user: account });
const deferred = () => { let resolve, reject; const promise = new Promise((yes,no) => {resolve=yes;reject=no;}); return {promise,resolve,reject}; };
const flush = () => new Promise(resolve => setImmediate(resolve));
const client = (fetchImpl, options = {}) => createApiClient({ origin:'http://localhost:3000', getAccessToken:async()=> 'current-token', fetchImpl, ...options });

test('origin configuration rejects paths, credentials and missing values', () => {
  assert.equal(apiOrigin('http://localhost:3000/'),'http://localhost:3000');
  for(const value of [undefined,'invalid','https://example.com/v0','https://user:secret@example.com','https://example.com?key=1']) {
    assert.throws(()=>apiOrigin(value),ApiError);
  }
});
test('account parser preserves decimal strings and rejects unfinished mismatches', () => {
  assert.equal(parseAccount(user()).paperCash.value,'10000.000000000000000000');
  for(const invalid of [{...user(),id:'did:privy:a'},{...user(),role:'crew'},{...user(),paperCash:{value:10000,asset:'USDC'}},{...user(),avatarUrl:'file:///private/photo.jpg'}]) {
    assert.throws(()=>parseAccount(invalid),ApiError);
  }
});
test('null tokens never send a request',async()=>{
  let calls=0; const api=client(async()=>{calls++;},{getAccessToken:async()=>null});
  await assert.rejects(api.me(),error=>error.code==='session_required');assert.equal(calls,0);
});
test('401 retries once with the current token and preserves a profile body',async()=>{
  let tokens=0;const calls=[];
  const api=client(async(url,options)=>{calls.push(options);return calls.length===1?Response.json({error:'unauthorized'},{status:401}):Response.json({...user(),username:'alice',role:'crew'});},{getAccessToken:async()=>`token-${++tokens}`});
  await api.updateProfile({username:'alice'});assert.equal(calls.length,2);
  assert.equal(calls[0].headers.Authorization,'Bearer token-1');assert.equal(calls[1].headers.Authorization,'Bearer token-2');
  assert.equal(calls[0].body,calls[1].body);
  let attempts=0;await assert.rejects(client(async()=>{attempts++;return Response.json({error:'unauthorized'},{status:401});}).me(),error=>error.status===401);
  assert.equal(attempts,2);
});
test('bootstrap verifies subject and validates the response',async()=>{
  await assert.rejects(client(async()=>Response.json(bootstrap('did:privy:other'))).bootstrap('did:privy:alice'),error=>error.code==='identity_mismatch');
});
test('timeouts bound pending token acquisition and cancellation prevents transport',async()=>{
  await assert.rejects(client(async()=>Response.json(user()),{getAccessToken:()=>new Promise(()=>{}),timeoutMs:10}).me(),error=>error.code==='timeout');
  const token=deferred();let calls=0;const abort=new AbortController();
  const pending=client(async()=>{calls++;return Response.json(user());},{getAccessToken:()=>token.promise}).me(abort.signal);
  abort.abort();token.resolve('late-token');await assert.rejects(pending,error=>error.code==='request_cancelled');assert.equal(calls,0);
});
test('5xx and unreadable responses leave a recoverable error',async()=>{
  await assert.rejects(client(async()=>Response.json({error:'database_unconfigured'},{status:503})).me(),error=>error.code==='database_unconfigured');
  await assert.rejects(client(async()=>new Response('<html>bad</html>')).me(),error=>error.code==='invalid_response');
});
test('store is idle until an authenticated subject starts and deduplicates starts',async()=>{
  const pending=deferred();let calls=0;
  const store=new AccountStore(client(async url=>{calls++;return url.endsWith('/v0/auth/privy')?pending.promise:Response.json(user());}));
  assert.equal(store.snapshot().status,'idle');assert.equal(calls,0);
  store.start('did:privy:alice');store.start('did:privy:alice');await flush();assert.equal(calls,1);
  pending.resolve(Response.json(bootstrap('did:privy:alice')));await flush();await flush();
  assert.equal(store.snapshot().status,'ready');assert.equal(calls,2);store.stop();
});
test('failed bootstrap remains blocked and explicit retry restores the account',async()=>{
  let fail=true;const store=new AccountStore(client(async url=>fail?Response.json({error:'unavailable'},{status:503}):Response.json(url.endsWith('/v0/auth/privy')?bootstrap('did:privy:alice'):user())));
  store.start('did:privy:alice');await flush();assert.equal(store.snapshot().status,'error');assert.equal(store.snapshot().account,null);
  fail=false;store.retry();await flush();await flush();assert.equal(store.snapshot().status,'ready');store.stop();
});
test('late account A responses cannot overwrite account B',async()=>{
  const a=deferred();const b=user('22222222-2222-4222-8222-222222222222');let calls=0;
  const store=new AccountStore(client(async url=>url.endsWith('/v0/auth/privy')?(++calls===1?a.promise:Response.json(bootstrap('did:privy:b',b))):Response.json(b)));
  store.start('did:privy:a');await flush();store.start('did:privy:b');await flush();await flush();
  a.resolve(Response.json(bootstrap('did:privy:a')));await flush();
  assert.equal(store.snapshot().subject,'did:privy:b');assert.equal(store.snapshot().account.id,b.id);store.stop();
});
test('logout during bootstrap discards late completions',async()=>{
  const pending=deferred();const store=new AccountStore(client(async()=>pending.promise));
  store.start('did:privy:a');await flush();store.stop();pending.resolve(Response.json(bootstrap('did:privy:a')));await flush();
  assert.equal(store.snapshot().status,'idle');assert.equal(store.snapshot().account,null);
});
test('logout during profile save cannot restore the old profile',async()=>{
  const update=deferred();
  const store=new AccountStore(client(async (url,options)=>options.method==='PATCH'?update.promise:
    Response.json(url.endsWith('/v0/auth/privy')?bootstrap('did:privy:a'):user())));
  store.start('did:privy:a');await flush();await flush();
  const pending=store.saveProfile({displayName:'Changed'});await flush();
  store.stop();update.resolve(Response.json({...user(),displayName:'Changed'}));
  await assert.rejects(pending,error=>error.code==='request_cancelled');
  assert.equal(store.snapshot().account,null);
});
test('signup returns a server profile and persists its role in the store',async()=>{
  const saved={...user(),username:'alice',role:'crew'};
  const store=new AccountStore(client(async url=>Response.json(url.endsWith('/v0/auth/privy')?bootstrap('did:privy:a'):url.endsWith('/v0/me/onboarding')?saved:user())));
  store.start('did:privy:a');await flush();await flush();await store.completeSignup('alice','crew');
  assert.equal(store.snapshot().account.username,'alice');assert.equal(store.snapshot().account.role,'crew');store.stop();
});
