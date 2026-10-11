import assert from 'node:assert/strict';
import test from 'node:test';
import { captainPortfolioApi, parseCaptainPortfolio, parseVaultPerformancePage } from '../src/api/captain-portfolio.ts';
import { amountSign, freshnessLabel, portfolioChartSegments, portfolioMoney, portfolioPercent } from '../src/api/captain-portfolio-display.ts';
import { createApiClient } from '../src/api/client.ts';
import { portfolioFixture, vaultPerformanceFixture, vaultIds } from './captain-portfolio-fixtures.ts';

test('portfolio contract retains exact money, loss, gaps and matching range', () => {
  const fixture = portfolioFixture();
  assert.equal(parseCaptainPortfolio(fixture, '30D').netPnlUsdc, '1240.000000');
  const loss = { ...fixture, netPnlUsdc: '-123.000001', netReturnPercent: '-0.123456', aumUsdc: null, valuationStatus: 'PARTIAL' };
  assert.equal(parseCaptainPortfolio(loss, '30D').aumUsdc, null);
  for (const patch of [{ revision: 1 }, { aumUsdc: '-1' }, { netPnlUsdc: 'NaN' }, { activeVaults: 4 },
    { points: [...fixture.points, fixture.points.at(-1)] }, { points: [{ ...fixture.points[0], segment: -1 }] }]) {
    assert.throws(() => parseCaptainPortfolio({ ...fixture, ...patch }, '30D'));
  }
  assert.throws(() => parseCaptainPortfolio(fixture, '7D'));
});
test('vault page validates pagination, owner-scoped rows and nullable return values', () => {
  const fixture = vaultPerformanceFixture();
  assert.equal(parseVaultPerformancePage(fixture, '30D').vaults[2].netPnlUsdc, '-130.000000');
  assert.throws(() => parseVaultPerformancePage({ ...fixture, vaults: [fixture.vaults[0], fixture.vaults[0]] }, '30D'));
  assert.throws(() => parseVaultPerformancePage({ ...fixture, nextCursor: 'bad-cursor' }, '30D'));
  assert.throws(() => parseVaultPerformancePage(fixture, 'ALL'));
});
test('chart never connects gaps, missing percentages, or different return segments', () => {
  const p = portfolioFixture().points;
  const points = [p[0], { ...p[1], hasGap: true }, p[2], { ...p[3], netReturnPercent: null },
    { ...p[4], segment: '1' }, { ...p[5], segment: '2' }, { ...p[6], segment: '2' }];
  const segments = portfolioChartSegments(points);
  assert.deepEqual(segments.map(s => s.length), [1, 1, 1, 2]);
  assert.equal(segments.at(-1)[0].segment, '2');
});
test('display keeps exact large balances and uses neutral unknown/zero values', () => {
  assert.equal(portfolioMoney('123456789012345678.123456'), '$123,456,789,012,345,678.12');
  assert.equal(portfolioMoney('-130.000000', true), '−$130.00');
  assert.equal(portfolioMoney('0.000001', true), '+<$0.01');
  assert.equal(portfolioMoney('-0.000000', true), '$0.00');
  assert.equal(portfolioPercent('-0.000001'), '−<0.01%');
  assert.equal(portfolioPercent(null), '—'); assert.equal(amountSign(null), null); assert.equal(amountSign('0.000000'), 0);
  assert.equal(freshnessLabel({ ...portfolioFixture(), valuationStatus: 'STALE' }), 'Valuation delayed');
});
test('summary and lazy drilldown use authenticated new endpoints and requested period/cursor', async () => {
  const calls = [], signal = new AbortController().signal;
  const api = captainPortfolioApi(createApiClient({ origin: 'http://localhost:3000', getAccessToken: async () => 'test',
    fetchImpl: async (url, options) => { calls.push({ url, options }); return Response.json(url.includes('/vaults') ? vaultPerformanceFixture('ALL') : portfolioFixture('ALL')); } }));
  await api.summary('ALL', signal);
  assert.equal(calls.length, 1);
  await api.vaults('ALL', vaultIds[0], signal);
  assert.match(calls[0].url, /\/v1\/me\/captain\/portfolio\?range=ALL$/);
  assert.match(calls[1].url, new RegExp(`portfolio/vaults\\?range=ALL&after=${vaultIds[0]}$`));
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test');
});
