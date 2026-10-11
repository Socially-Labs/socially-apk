import test from 'node:test';
import assert from 'node:assert/strict';
import { canPullRefresh, refreshPullDistance, REFRESH_THRESHOLD } from '../src/components/shared/refresh/pull-refresh-gesture.ts';

test('refresh only claims a one-finger downward pull that starts at the top', () => {
  assert.equal(canPullRefresh(true, 0, 1, 30, 1, false), true);
  for (const args of [[false, 0, 0, 30, 1, false], [true, 100, 0, 30, 1, false], [true, 0, 30, 10, 1, false], [true, 0, 0, -30, 1, false], [true, 0, 0, 30, 2, false], [true, 0, 0, 30, 1, true]]) {
    assert.equal(canPullRefresh(...args), false);
  }
});
test('resistance requires a deliberate pull and clamps excessive travel', () => {
  assert.ok(refreshPullDistance(100) < REFRESH_THRESHOLD);
  assert.ok(refreshPullDistance(140) >= REFRESH_THRESHOLD);
  assert.equal(refreshPullDistance(-50), 0);
  assert.equal(refreshPullDistance(1000), 110);
});
