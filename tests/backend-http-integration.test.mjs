import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createApiClient } from '../src/api/client.ts';
import { AccountStore } from '../src/api/account-store.ts';

test('mobile account client integrates with the real backend over HTTP', { timeout: 30_000 }, async () => {
  const connectionString=process.env.TEST_DATABASE_URL;
  assert.ok(connectionString,'TEST_DATABASE_URL must point to an isolated local test database');
  assert.match(new URL(connectionString).hostname,/^(localhost|127\.0\.0\.1|\[::1\])$/);
  const backend=resolve(process.env.BACKEND_REPO_PATH ?? '../backend');
  const require=createRequire(resolve(backend,'apps/api/package.json'));
  const pg=require('pg');
  const {createApp}=await import(pathToFileURL(resolve(backend,'apps/api/dist/app.js')).href);
  const {configurePrivyFixture}=await import(pathToFileURL(resolve(backend,'apps/api/test/privy-fixture.mjs')).href);
  const {AssetStorage}=await import(pathToFileURL(resolve(backend,'apps/api/dist/asset-storage.js')).href);
  const {ApiFault}=await import(pathToFileURL(resolve(backend,'apps/api/dist/errors.js')).href);
  // The API and PostgreSQL are real; the external S3 boundary is isolated.
  const originalStorage = Object.fromEntries(['sign','publish','discard'].map(key=>[key,AssetStorage.prototype[key]]));
  const storageEnv = { AWS_REGION:'us-east-1', S3_ASSET_BUCKET:'test-assets', S3_UPLOAD_BUCKET:'test-staging', ASSET_PUBLIC_BASE_URL:'https://assets.example' };
  const originalEnv = Object.fromEntries(Object.keys(storageEnv).map(key=>[key,process.env[key]]));
  Object.assign(process.env,storageEnv);
  const uploaded = new Map();
  AssetStorage.prototype.sign = async file=>`https://uploads.example/${file.staging_key}`;
  AssetStorage.prototype.publish = async (file,kind,userId,id)=>{
    const body=uploaded.get(file.staging_key);
    if(!body)throw new ApiFault(409,'upload_not_found','Upload the file before completing it');
    assert.equal(body.size,file.byte_size);
    return `https://assets.example/users/${userId}/${kind}/${id}.webp`;
  };
  AssetStorage.prototype.discard = async key=>{uploaded.delete(key);};
  const nativeFetch=globalThis.fetch;
  const token=configurePrivyFixture();
  const schema=`mobile_http_${randomUUID().replaceAll('-','')}`;
  const admin=new pg.Pool({connectionString});
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool=new pg.Pool({connectionString,options:`-c search_path=${schema}`});
  let app,store;
  try {
    const dir=resolve(backend,'packages/db/migrations');
    for(const file of (await readdir(dir)).filter(x=>x.endsWith('.sql')).sort())await pool.query(await readFile(resolve(dir,file),'utf8'));
    app=createApp(pool);app.log.level='silent';
    const origin=await app.listen({host:'127.0.0.1',port:0});
    let identity='crew';
    const api=createApiClient({origin,fetchImpl:nativeFetch,getAccessToken:async()=>token(identity)});
    store=new AccountStore(api);
    const ready=async()=>{
      for(let n=0;n<200;n++){
        if(store.snapshot().status==='ready')return;
        if(store.snapshot().status==='error')throw new Error(store.snapshot().error);
        await new Promise(r=>setTimeout(r,10));
      }
      throw new Error('Account load timed out');
    };
    store.start('did:privy:crew');await ready();const crewId=store.snapshot().account.id;
    assert.equal(store.snapshot().account.username,null);
    await store.completeSignup('mobile_crew','crew','Mobile Crew');
    await store.saveProfile({displayName:'Edited Crew',bio:'Saved through the mobile client'});
    await store.saveProfile({hideBalances:true,avatarKind:'initials'});
    const image=new Blob([new Uint8Array(100)],{type:'image/jpeg'});
    const uploadFetch=async(url,options)=>{
      assert.equal(options.method,'PUT');assert.equal(options.headers['Content-Type'],'image/jpeg');
      assert.equal(options.headers.Authorization,undefined,'Privy tokens must never be sent to storage');
      uploaded.set(new URL(url).pathname.slice(1),options.body);return new Response(null,{status:200});
    };
    const photo=await store.uploadImage('avatar','device-photo',async()=>({body:image,size:image.size}),uploadFetch);
    const banner=await store.uploadImage('banner','device-banner',async()=>({body:image,size:image.size}),uploadFetch);
    assert.equal(store.snapshot().account.avatarUrl,null,'Upload completion leaves attachment to Save changes');
    await store.saveProfile({avatarUrl:photo,bannerUrl:banner});
    await assert.rejects(store.saveProfile({avatarUrl:banner}),e=>e.code==='asset_not_verified');
    await assert.rejects(store.uploadImage('avatar','bad-upload',async()=>({body:image,size:image.size}),async()=>new Response(null,{status:403})));
    assert.equal(store.snapshot().account.avatarUrl,photo,'Failed upload leaves the saved photo intact');
    await assert.rejects(api.submitSupport({message:'          ',appVersion:'1.0.0',platform:'android'}),e=>e.status===400);
    const ticket=await store.submitSupport({message:'Profile image needs help',appVersion:'1.0.0',platform:'android'});
    const row=(await pool.query('SELECT * FROM support_requests WHERE id=$1',[ticket.id])).rows[0];
    assert.equal(row.user_id,crewId);assert.equal(row.message,'Profile image needs help');assert.equal(row.status,'OPEN');
    for(let i=0;i<4;i++)await store.submitSupport({message:`Another request ${i}`,appVersion:'1.0.0',platform:'android'});
    await assert.rejects(store.submitSupport({message:'Too many requests',appVersion:'1.0.0',platform:'android'}),e=>e.status===429);
    store.stop();store.start('did:privy:crew');await ready();
    assert.equal(store.snapshot().account.id,crewId);
    assert.equal(store.snapshot().account.username,'mobile_crew');
    assert.equal(store.snapshot().account.displayName,'Edited Crew');
    assert.equal(store.snapshot().account.hideBalances,true);assert.equal(store.snapshot().account.avatarKind,'initials');
    assert.equal(store.snapshot().account.avatarUrl,photo);assert.equal(store.snapshot().account.bannerUrl,banner);
    await store.saveProfile({avatarUrl:null,bannerUrl:null,hideBalances:false});
    assert.equal((await api.me()).avatarUrl,null);assert.equal((await api.me()).bannerUrl,null);
    store.stop();identity='captain';store.start('did:privy:captain');await ready();
    assert.notEqual(store.snapshot().account.id,crewId);assert.equal(store.snapshot().account.username,null);
    assert.equal(await store.usernameAvailable('mobile_crew'),false);
    await assert.rejects(store.completeSignup('mobile_crew','captain'),e=>e.code==='username_taken');
    await store.completeSignup('mobile_captain','captain','Mobile Captain');
    await assert.rejects(store.saveProfile({avatarUrl:photo}),e=>e.code==='asset_not_verified');
    assert.equal(store.snapshot().account.hideBalances,false,'Display preference is scoped to the account');
    const captainId=store.snapshot().account.id;
    const profile=await nativeFetch(`${origin}/v0/captains/${captainId}`);
    assert.equal((await profile.json()).handle,'mobile_captain');
    assert.equal((await pool.query("SELECT id FROM fund_events WHERE type='paper_budget_granted'")).rowCount,2);
    store.stop();assert.equal(store.snapshot().account,null);
  } finally {
    store?.stop();
    if(app)await app.close();else await pool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();globalThis.fetch=nativeFetch;
    Object.assign(AssetStorage.prototype,originalStorage);
    for(const [key,value] of Object.entries(originalEnv)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
  }
});
