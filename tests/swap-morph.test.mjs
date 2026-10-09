import test from 'node:test';
import assert from 'node:assert/strict';
import { swapMorphPath, swapMorphRig } from '../src/components/wallet/swap-morph-rig.ts';

test('arrow/check correspondence has finite equal-arity cubics and exact endpoints', () => {
  assert.equal(swapMorphRig.arrow.length, swapMorphRig.check.length);
  assert.notEqual(swapMorphRig.parkedSlot, swapMorphRig.parkedHost);
  assert.deepEqual(swapMorphRig.check[swapMorphRig.parkedSlot], swapMorphRig.check[swapMorphRig.parkedHost]);
  for (let slot = 0; slot < 3; slot++) {
    for (const t of [0, .25, .5, .75, 1, .5, 0]) {
      const path = swapMorphPath(t, slot);
      assert.equal(path.replace(/[-\d.e+\s]/g, ''), 'MC');
      const numbers = path.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g).map(Number);
      assert.equal(numbers.length, 8); assert(numbers.every(Number.isFinite));
      if (t === 0 || t === 1) assert.deepEqual(numbers, swapMorphRig[t === 0 ? 'arrow' : 'check'][slot]);
    }
    assert.equal(swapMorphPath(-1, slot), swapMorphPath(0, slot));
    assert.equal(swapMorphPath(2, slot), swapMorphPath(1, slot));
  }
});
