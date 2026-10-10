import assert from 'node:assert/strict';
import test from 'node:test';
import { harbourBoatPath, harbourBoatRig, harbourWaterPath, harbourWaterRig } from '../src/components/markets/market-harbour-rig.ts';

function point(c, t) {
  const u = 1 - t;
  return [0, 1].map(axis => u ** 3 * c[axis] + 3 * u ** 2 * t * c[axis + 2] + 3 * u * t ** 2 * c[axis + 4] + t ** 3 * c[axis + 6]);
}

test('sails and hull stay connected, bounded and noncollapsed throughout the morph', () => {
  for (const [slot, [from, to]] of Object.entries(harbourBoatRig)) {
    let winding;
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const contour = from.map((c, i) => c.map((v, j) => v + (to[i][j] - v) * progress));
      for (let i = 0; i < contour.length; i++) assert.deepEqual(contour[i].slice(6), contour[(i + 1) % contour.length].slice(0, 2), `${slot} is closed and joined`);
      const points = contour.flatMap(c => Array.from({ length: 12 }, (_, i) => point(c, i / 12)));
      assert.ok(points.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 64 && y >= 0 && y <= 56));
      const area = points.reduce((sum, [x, y], i) => { const next = points[(i + 1) % points.length]; return sum + x * next[1] - next[0] * y; }, 0) / 2;
      assert.ok(Math.abs(area) > 60, `${slot} never collapses`);
      winding ??= Math.sign(area);
      assert.equal(Math.sign(area), winding, `${slot} never flips winding`);
      assert.equal(harbourBoatPath(progress, slot).replace(/[-\d.e+\s]/g, ''), 'MCCCZ');
    }
  }
});

test('morph progress clamps to exact endpoints and never emits invalid geometry', () => {
  for (const slot of Object.keys(harbourBoatRig)) {
    assert.equal(harbourBoatPath(-1, slot), harbourBoatPath(0, slot));
    assert.equal(harbourBoatPath(2, slot), harbourBoatPath(1, slot));
    assert.equal(harbourBoatPath(NaN, slot), harbourBoatPath(0, slot));
    assert.notEqual(harbourBoatPath(0, slot), harbourBoatPath(1, slot));
  }
});

test('water layers retain matching curves and a fixed bottom closure during reversal', () => {
  for (const layer of [0, 1]) {
    const [from, to] = harbourWaterRig[layer];
    assert.equal(from.length, to.length);
    for (const t of [0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25, 0]) {
      const path = harbourWaterPath(t, layer);
      assert.equal(path.replace(/[-\d.e+\s]/g, ''), 'MCCLLZ');
      assert.ok(path.endsWith('L360 30 L0 30 Z'));
      assert.doesNotMatch(path, /NaN|Infinity|undefined/);
    }
  }
});
