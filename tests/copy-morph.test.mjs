import test from 'node:test';
import assert from 'node:assert/strict';
import { copyMorphPath, copyMorphRig } from '../src/components/wallet/copy-morph-rig.ts';

test('copy/check rig has finite, compatible cubic slots and a valid parking host', () => {
  assert.equal(copyMorphRig.parkedHost, 'front');
  for (const slot of ['front', 'rear', 'check']) {
    assert.equal(copyMorphRig[slot].length, 4);
    for (const cubic of copyMorphRig[slot]) {
      assert.equal(cubic.length, 8);
      assert(cubic.every(Number.isFinite));
    }
  }
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    for (const slot of ['front', 'rear']) {
      const d = copyMorphPath(t, slot);
      assert.equal((d.match(/M/g) || []).length, 1);
      assert.equal((d.match(/C/g) || []).length, 4);
      assert(!/NaN|Infinity/.test(d));
    }
  }
  assert.equal(copyMorphPath(1, 'front'), copyMorphPath(1, 'rear'));
  assert.equal(copyMorphPath(-1, 'front'), copyMorphPath(0, 'front'));
  assert.equal(copyMorphPath(2, 'front'), copyMorphPath(1, 'front'));
});
