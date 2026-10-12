import assert from 'node:assert/strict';
import test from 'node:test';
import { createPortfolioCache, PORTFOLIO_GRACE_MS } from '../src/api/captain-portfolio-cache.ts';
import { portfolioFixture } from './captain-portfolio-fixtures.ts';

test('temporary null valuations retain one confirmed snapshot and recover without blending totals', () => {
  const cache = createPortfolioCache(), p = portfolioFixture('7D');
  assert.equal(cache.accept('alice', p, 0).portfolioDelayed, false);
  const missing = { ...p, valuationStatus: 'PARTIAL', aumUsdc: null, netPnlUsdc: null };
  const held = cache.accept('alice', missing, 15_000);
  assert.equal(held.portfolio, p); assert.equal(held.portfolioDelayed, true);
  const recovered = { ...p, revision: '124', aumUsdc: '32000.000000', netReturnPercent: null };
  assert.deepEqual(cache.accept('alice', recovered, 30_000), { portfolio: recovered, portfolioDelayed: false });
  assert.equal(cache.read('alice', '7D', 30_000).netReturnPercent, null);
});
test('fallback expires despite repeated null responses and never crosses account, period or vault membership', () => {
  const cache = createPortfolioCache(), p = portfolioFixture('7D');
  cache.accept('alice', p, 0);
  assert.equal(cache.read('bob', '7D', 1), null);
  assert.equal(cache.read('alice', 'ALL', 1), null);
  const missing = { ...p, aumUsdc: null, netPnlUsdc: null, valuationStatus: 'STALE' };
  cache.accept('alice', missing, PORTFOLIO_GRACE_MS - 1);
  assert.equal(cache.accept('alice', missing, PORTFOLIO_GRACE_MS + 1).portfolio, missing);
  cache.accept('alice', p, 0);
  assert.equal(cache.accept('alice', { ...missing, totalVaults: 4 }, 1).portfolioDelayed, false);
  cache.clear(); assert.equal(cache.read('alice', '7D', 2), null);
});
