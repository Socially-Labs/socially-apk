import assert from 'node:assert/strict';
import test from 'node:test';
import { captainInvestmentPerformance } from '../src/api/captain-investment-performance.ts';

const returns = {
  mode: 'PAPER', range: '7D', method: 'CHAINED_ECONOMIC_UNIT_PRICE', intervalSeconds: 3600,
  baselineAt: '2026-10-10T00:00:00Z', asOf: '2026-10-10T01:00:00Z', coverage: 'PARTIAL',
  netReturnPercent: '-1.250000', methodology: 'Deposits excluded',
  points: [
    { at: '2026-10-10T00:00:00Z', indexValue: '100', hasGap: false },
    { at: '2026-10-10T01:00:00Z', indexValue: '98.75', hasGap: false },
  ],
};

test('investment card uses server return values and timestamps, including losses', () => {
  const view = captainInvestmentPerformance(returns);
  assert.deepEqual(view.values, [100, 98.75]);
  assert.deepEqual(view.timestamps, returns.points.map(p => p.at));
  assert.equal(view.change, '−1.25%');
  assert.equal(view.positive, false);
  assert.equal(view.validHistory, true);
});

test('missing returns, one observation and valuation gaps never manufacture a graph', () => {
  assert.equal(captainInvestmentPerformance().change, '—');
  assert.deepEqual(captainInvestmentPerformance().values, []);
  assert.deepEqual(captainInvestmentPerformance({ ...returns, points: returns.points.slice(0, 1) }).values, []);
  for (const point of [{ ...returns.points[1], hasGap: true }, { ...returns.points[1], indexValue: null }]) {
    const view = captainInvestmentPerformance({ ...returns, netReturnPercent: null, points: [returns.points[0], point] });
    assert.equal(view.hasGaps, true);
    assert.deepEqual(view.values, []);
    assert.equal(view.change, '—');
  }
});

test('the change badge uses the selected-period return instead of recalculating from sparse chart points', () => {
  const view = captainInvestmentPerformance({ ...returns, netReturnPercent: '2.000000' });
  assert.equal(view.change, '+2.00%');
  assert.equal(view.positive, true);
  assert.equal(captainInvestmentPerformance({ ...returns, netReturnPercent: '-0.000001' }).change, '0.00%');
});
