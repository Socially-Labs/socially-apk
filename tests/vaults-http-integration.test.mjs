import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { readdir,readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createApiClient } from '../src/api/client.ts';
import { vaultsApi } from '../src/api/vaults.ts';
import { parseVaultAttempt,submitVaultAttempt } from '../src/api/vault-journal.ts';

test('APK vault DTOs and persisted requests integrate with the real paper API over HTTP',{ timeout:30000 },async()=>{
 const connectionString=process.env.TEST_DATABASE_URL;
 assert.ok(connectionString); assert.match(new URL(connectionString).hostname,/^(localhost|127\.0\.0\.1|\[::1\])$/);
 const backend=resolve('../backend'),require=createRequire(resolve(backend,'apps/api/package.json')),pg=require('pg');
 const { createApp }=await import(pathToFileURL(resolve(backend,'apps/api/dist/app.js')));
 const { configurePrivyFixture }=await import(pathToFileURL(resolve(backend,'apps/api/test/privy-fixture.mjs')));
 const token=configurePrivyFixture(),schema=`vault_http_${randomUUID().replaceAll('-','')}`;
 const admin=new pg.Pool({ connectionString }); await admin.query(`CREATE SCHEMA ${schema}`);
 const pool=new pg.Pool({ connectionString,options:`-c search_path=${schema}` });
 process.env.VAULT_PAPER_ENABLED='true'; process.env.VAULT_TERMS_APPROVAL='locked-v1-retain-residue'; delete process.env.USDG_MINT;
 let app;
 try {
  const dir=resolve(backend,'packages/db/migrations');
  for (const file of (await readdir(dir)).filter(f=>f.endsWith('.sql')).sort()) await pool.query(await readFile(resolve(dir,file),'utf8'));
  app=createApp(pool); app.log.level='silent'; const origin=await app.listen({ host:'127.0.0.1',port:0 });
  let subject='mobile-captain'; const client=createApiClient({ origin,getAccessToken:async()=>token(subject) }),api=vaultsApi(client);
  await client.me(); await client.onboarding({ username:'http_captain',role:'captain' });
  const config=await api.config(); assert.equal(config.enabled,true);
  const storageValues=new Map(),storage={ read:async k=>storageValues.get(k)??null,write:async(k,v)=>{storageValues.set(k,v);},remove:async k=>{storageValues.delete(k);} };
  const saved={ subject,mode:'PAPER',key:randomUUID(),intent:{ kind:'CREATE',body:{ name:'Mobile paper round',description:'Spot only',fundingWindowHours:24,durationDays:14,termsVersion:1 } } };
  const created=await submitVaultAttempt(api,storage,'create',saved); assert.equal(storageValues.size,0);
  const detail=await api.detail(created.vaultId); assert.equal(detail.acceptedCapitalUsdc,'100.000000');
  assert.equal((await api.recover(saved.key)).vaultId,detail.id);
  subject='mobile-crew'; await client.me();
  const quote=await api.quote(detail.id,{ amountUsdc:'50',termsHash:detail.termsHash }); assert.equal(quote.allowed,true);
  const contribution={ subject,mode:'PAPER',key:randomUUID(),intent:{ kind:'CONTRIBUTE',vaultId:detail.id,body:{ amountUsdc:'50',termsHash:detail.termsHash } } };
  // Simulate an accepted request whose successful HTTP response never reaches the app.
  let drop=true;
  const uncertain=vaultsApi(createApiClient({ origin,getAccessToken:async()=>token(subject),fetchImpl:async(url,options)=>{
   const response=await fetch(url,options); if (drop && options.method==='POST') { drop=false; throw new TypeError('response lost after commit'); } return response;
  } }));
  await assert.rejects(submitVaultAttempt(uncertain,storage,'join',contribution));
  const restored=parseVaultAttempt(storageValues.get('join'),subject);
  const expired=vaultsApi(createApiClient({ origin,getAccessToken:async()=> 'expired-session' }));
  await assert.rejects(submitVaultAttempt(expired,storage,'join',restored),error=>error.status===401);
  assert.ok(storageValues.has('join'),'Login expiration must preserve the already accepted request');
  const recovered=await api.recover(restored.key); assert.equal(recovered.amountUsdc,'50.000000');
  const retry=await submitVaultAttempt(api,storage,'join',restored); assert.equal(retry.id,recovered.id);
  const position=await api.position(detail.id); assert.equal(position.shares,'50.000000'); assert.equal(position.availableUsdc,'9950.000000');
  assert.equal((await api.detail(detail.id)).acceptedCapitalUsdc,'150.000000');
  await api.submit({ kind:'CANCEL',vaultId:detail.id,body:{} },randomUUID());
  assert.equal((await api.position(detail.id)).availableUsdc,'10000.000000');
 } finally { if (app) await app.close(); else await pool.end(); await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end(); }
});
