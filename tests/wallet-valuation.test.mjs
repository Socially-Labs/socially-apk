import test from 'node:test';
import assert from 'node:assert/strict';
import { walletValueUsd, WALLET_PRICE_MINTS as M } from '../src/components/wallet/wallet-valuation.ts';
const now = Date.now();
const marks = () => [{ mint: M.SOL, priceUsd: '100.123456789012345678', status: 'CURRENT', sourceAt: new Date(now).toISOString() },
  { mint: M.USDC, priceUsd: '0.99', status: 'CURRENT', sourceAt: new Date(now).toISOString() }];

test('wallet valuation combines SOL and USDC using their independent USD prices with exact decimal math', () => {
  assert.equal(walletValueUsd('0.5', '3', marks(), now), '53.031728394506172839');
  assert.equal(walletValueUsd('0', '3', marks().slice(1), now), '2.970000000000000000');
  assert.equal(walletValueUsd('0', '0', [], now), '0.000000000000000000');
  assert.equal(walletValueUsd(null, '3', marks(), now), null);
  assert.equal(walletValueUsd('NaN', '3', marks(), now), null);
});

test('missing, stale, future, unavailable, wrong-mint and nonpositive prices cannot produce a partial total', () => {
  for (const patch of [{ status: 'STALE' }, { status: 'UNAVAILABLE' }, { sourceAt: new Date(now - 90001).toISOString() },
    { sourceAt: new Date(now + 5001).toISOString() }, { sourceAt: null }, { priceUsd: '0' }, { priceUsd: '-1' }, { mint: 'other-token' }]) {
    const prices = marks(); prices[0] = { ...prices[0], ...patch };
    assert.equal(walletValueUsd('0.5', '3', prices, now), null);
  }
  assert.equal(walletValueUsd('0.5', '3', marks().slice(0, 1), now), null);
});
