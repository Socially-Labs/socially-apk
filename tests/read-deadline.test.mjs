import assert from 'node:assert/strict';
import test from 'node:test';
import { readWithDeadline } from '../src/api/read-deadline.ts';

test('a stalled settings read settles as an error instead of holding startup forever', async () => {
  await assert.rejects(readWithDeadline(new Promise(() => {}), 5, 'Retry loading settings'), /Retry loading settings/);
});

test('a timed-out read cannot replace the result of a successful retry', async () => {
  let finishOld;
  const oldRead = new Promise(resolve => { finishOld = resolve; });
  let settings = null;
  await readWithDeadline(oldRead, 5, 'timeout').then(value => { settings = value; }, () => {});
  settings = await readWithDeadline(Promise.resolve('current account settings'), 100, 'timeout');
  finishOld('outdated settings');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(settings, 'current account settings');
});

test('successful empty storage reads and genuine failures retain their meanings', async () => {
  assert.equal(await readWithDeadline(Promise.resolve(null), 100, 'timeout'), null);
  await assert.rejects(readWithDeadline(Promise.reject(new Error('storage unavailable')), 100, 'timeout'), /storage unavailable/);
});
