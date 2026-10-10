import assert from 'node:assert/strict';
import test from 'node:test';
import { tradeAmountDisplay, tradeQuoteFresh, tradeQuoteKey, tradeQuoteReceive, tradeQuoteSpread } from '../src/api/trade-quote.ts';

const now = Date.now();
const quote = { observedAt: new Date(now).toISOString(), estimate: {
  quantity: '0.670788097', cashChangeUsdc: '-100.000000', feeUsdc: '0.100000', marketPriceUsdc: '148.62', fillPriceUsdc: '148.932102',
} };

test('quote identity separates vault, instrument, side and exact amount to prevent stale output', () => {
  const buy = { side: 'BUY', instrumentId: 'SOL', notionalUsdc: '100' };
  const key = tradeQuoteKey('a', buy);
  for (const [vault, intent] of [['b', buy], ['a', { ...buy, instrumentId: 'JUP' }],
    ['a', { ...buy, notionalUsdc: '101' }], ['a', { side: 'SELL', instrumentId: 'SOL', quantity: '100' }]]) {
    assert.notEqual(tradeQuoteKey(vault, intent), key);
  }
  assert.equal(tradeQuoteKey('a', null), null);
});

test('confirmation freshness rejects stale, malformed and implausibly future observations', () => {
  assert.equal(tradeQuoteFresh(quote, now), true);
  assert.equal(tradeQuoteFresh(quote, now + 15001), false);
  assert.equal(tradeQuoteFresh({ ...quote, observedAt: 'bad' }, now), false);
  assert.equal(tradeQuoteFresh({ ...quote, observedAt: new Date(now + 5001).toISOString() }, now), false);
});

test('backend fill amounts remain exact and model spread works on both sides', () => {
  assert.equal(tradeQuoteReceive(quote, 'BUY'), '0.670788097');
  const sell = { ...quote, estimate: { ...quote.estimate, cashChangeUsdc: '148.159278', fillPriceUsdc: '148.307898' } };
  assert.equal(tradeQuoteReceive(sell, 'SELL'), '148.159278');
  assert.equal(tradeQuoteSpread(quote), '0.21%');
  assert.equal(tradeQuoteSpread(sell), '0.21%');
  assert.equal(tradeAmountDisplay('0.000000000000000001'), '0.000000000000000001');
  assert.equal(tradeAmountDisplay('12500.000000'), '12,500');
  assert.equal(tradeAmountDisplay(null), '—');
});
