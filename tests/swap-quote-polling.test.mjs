import test from 'node:test';
import assert from 'node:assert/strict';
import { startSwapQuotePolling } from '../src/components/wallet/swap-quote-polling.ts';
const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

test('quotes debounce, stay sequential, repeat silently and invalidate late replies on cleanup', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0, resolve, signal;
  const quotes = [], errors = [];
  const stop = startSwapQuotePolling({ request: s => { calls++; signal = s; return new Promise(r => { resolve = r; }); }, onQuote: q => quotes.push(q), onError: e => errors.push(e), onLoading() {} });
  t.mock.timers.tick(449); assert.equal(calls, 0);
  t.mock.timers.tick(1); assert.equal(calls, 1);
  t.mock.timers.tick(9000); assert.equal(calls, 1);
  resolve('first'); await flush(); assert.deepEqual(quotes, ['first']);
  t.mock.timers.tick(2999); assert.equal(calls, 1);
  t.mock.timers.tick(1); assert.equal(calls, 2);
  stop(); assert.equal(signal.aborted, true);
  resolve('late'); await flush(); t.mock.timers.tick(60000);
  assert.deepEqual(quotes, ['first']); assert.equal(calls, 2); assert.deepEqual(errors, []);
});

test('quote failures back off and a successful request restores the three-second cadence', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0; const errors = [], quotes = [];
  const stop = startSwapQuotePolling({ request: async () => { calls++; if (calls <= 2) throw Error('temporarily unavailable'); return 'ready'; }, onQuote: q => quotes.push(q), onError: e => errors.push(e.message), onLoading() {} });
  t.mock.timers.tick(450); await flush(); assert.equal(calls, 1);
  t.mock.timers.tick(5999); assert.equal(calls, 1);
  t.mock.timers.tick(1); await flush(); assert.equal(calls, 2);
  t.mock.timers.tick(12000); await flush(); assert.equal(calls, 3);
  t.mock.timers.tick(3000); await flush(); assert.equal(calls, 4);
  assert.equal(errors.length, 2); assert.deepEqual(quotes, ['ready', 'ready']); stop();
});
