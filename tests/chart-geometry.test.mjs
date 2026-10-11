import assert from 'node:assert/strict';
import test from 'node:test';
import { chartGeometry, nearestPoint } from '../src/components/shared/charts/chart-geometry.ts';

const datum = (time, value, extra = {}) => ({ time, value, label: String(value), ...extra });
test('flat histories are centered and sub-unit changes retain a minimum visual range', () => {
  const flat = chartGeometry([datum(0, 42), datum(1, 42)], 300, 80);
  assert.equal(flat.points[0].y, 40);
  const tiny = chartGeometry([datum(0, 42), datum(1, 42.01)], 300, 80);
  assert.ok(Math.abs(tiny.points[0].y - tiny.points[1].y) < 1);
});
test('irregular time intervals preserve spacing and unavailable marks break paths', () => {
  const g = chartGeometry([datum(0, 0), datum(1, 1), datum(5, null), datum(8, 2), datum(10, 3)], 300, 80);
  assert.deepEqual(g.segments.map(s => s.length), [2, 2]);
  assert.ok(Math.abs((g.points[1].x - g.left) / (g.right - g.left) - 0.1) < 1e-9);
  assert.equal(g.paths.length, 2);
  assert.equal(nearestPoint(g.points, g.right + 500), 3);
  assert.equal(nearestPoint(g.points, -500), 0);
});
test('invalid coordinates and return segment changes never connect', () => {
  const g = chartGeometry([datum(0, 2), datum(NaN, 3), datum(2, 4), datum(3, 5, { segment: 'new' }), datum(4, Infinity), datum(5, 6)], 300, 80);
  assert.deepEqual(g.segments.map(s => s.length), [1, 1, 1, 1]);
  assert.ok(g.paths.every(p => !/NaN|Infinity/.test(p.line + p.fill)));
});
test('positive and negative return domains both retain zero and nearest selection follows time', () => {
  for (const values of [[2, 4], [-4, -2], [-2, 4], [0, 0]]) {
    const g = chartGeometry(values.map((v, i) => datum(i, v)), 300, 80, { axes: true, includeZero: true, minimumRange: 0.5 });
    assert.ok(g.zeroY >= g.top && g.zeroY <= g.bottom);
    assert.equal(nearestPoint(g.points, g.points[0].x + 1), 0);
  }
  assert.equal(nearestPoint([], 0), -1);
});
test('Captain scale exposes tiny recorded changes without inventing movement in flat history', () => {
  const tiny = chartGeometry([datum(0, 0.00001), datum(1, 0.00002)], 300, 80, { minimumRange: 0.000001 });
  assert.ok(tiny.max - tiny.min < 0.00002);
  assert.ok(Math.abs(tiny.points[0].y - tiny.points[1].y) > 40);
  const flat = chartGeometry([datum(0, 0), datum(1, 0)], 300, 80, { minimumRange: 0.000001 });
  assert.equal(flat.points[0].y, flat.points[1].y);
});
