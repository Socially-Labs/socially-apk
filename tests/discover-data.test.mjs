import assert from 'node:assert/strict';
import test from 'node:test';
import { discoverCaptains, drawdown, emptyFilters, filterCount, hasPeriod, performanceSeries, periods, selectCaptains } from '../src/constants/discover.ts';

const base = { query: '', category: 'All Captains', period: '90D', sort: 'Featured', filters: emptyFilters, saved: [] };

test('portfolio charts, displayed returns and drawdowns share the same values', () => {
  for (const captain of discoverCaptains) {
    assert.equal(captain.holdings.reduce((sum, holding) => sum + holding.weight, 0), 100);
    for (const period of periods.filter(period => hasPeriod(captain, period))) {
      const series = performanceSeries(captain, period);
      assert.equal(series[0], 100);
      assert.ok(Math.abs(series.at(-1) - (100 + captain.returns[period])) < 0.00001);
      let peak = series[0];
      const observed = series.map(value => { peak = Math.max(peak, value); return (peak - value) / peak * 100; });
      assert.equal(drawdown(captain, period), Math.max(...observed));
    }
  }
});

test('a full-year view excludes Captains without enough history', () => {
  const results = selectCaptains({ ...base, period: '1Y' });
  assert.ok(results.every(captain => captain.months >= 12));
  assert.ok(!results.some(captain => captain.id === 'nova' || captain.id === 'drift'));
});

test('keyword search combines Captain, strategy and asset terms', () => {
  assert.deepEqual(selectCaptains({ ...base, query: 'solana momentum' }).map(captain => captain.id), ['atlas', 'nova']);
  assert.deepEqual(selectCaptains({ ...base, query: 'low risk' }).map(captain => captain.id), ['solstice', 'tide']);
  assert.deepEqual(selectCaptains({ ...base, query: 'no-such-captain' }), []);
});

test('filters intersect, and empty combinations stay recoverable', () => {
  const filters = { ...emptyFilters, risk: 'Lower', aum: '$1M+', proven: true, positive: true };
  assert.deepEqual(selectCaptains({ ...base, filters }).map(captain => captain.id), ['solstice']);
  assert.equal(filterCount(filters), 4);
  assert.deepEqual(selectCaptains({ ...base, filters: { ...filters, strategy: 'Memecoins' } }), []);
  assert.equal(selectCaptains(base).length, discoverCaptains.length);
});

test('sorting uses the selected period and preserves losses', () => {
  const results = selectCaptains({ ...base, period: '30D', sort: 'Highest return' });
  assert.equal(results[0].id, 'nova');
  assert.equal(results.at(-1).id, 'drift');
  assert.ok(results.at(-1).returns['30D'] < 0);
  const byRisk = selectCaptains({ ...base, sort: 'Lowest drawdown' });
  assert.ok(byRisk.every((captain, i) => i === 0 || drawdown(byRisk[i - 1], '90D') <= drawdown(captain, '90D')));
});

test('saved results reflect the shortlist and still respect filters', () => {
  assert.deepEqual(selectCaptains({ ...base, category: 'Saved', saved: ['atlas', 'nova'] }).map(captain => captain.id), ['atlas', 'nova']);
  assert.deepEqual(selectCaptains({ ...base, category: 'Saved', saved: ['nova'], period: '1Y' }), []);
});

test('categories honor their stated history and consistency conditions', () => {
  const consistent = selectCaptains({ ...base, category: 'Consistent' });
  assert.deepEqual(consistent.map(captain => captain.id), ['solstice', 'tide']);
  assert.deepEqual(selectCaptains({ ...base, category: 'Rising' }).map(captain => captain.id), ['nova', 'drift']);
  assert.deepEqual(selectCaptains({ ...base, category: 'Rising', period: '30D' }).map(captain => captain.id), ['nova']);
  assert.equal(selectCaptains({ ...base, category: 'Most followed' })[0].id, 'solstice');
  const top = selectCaptains({ ...base, category: 'Top performers', period: '30D' });
  assert.equal(top[0].id, 'nova');
  assert.ok(top.every(captain => captain.returns['30D'] > 0));
});
