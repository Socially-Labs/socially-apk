import test from 'node:test';
import assert from 'node:assert/strict';
import { focusedFieldScrollDelta } from '../src/components/shared/keyboard/keyboard-geometry.ts';

test('reveals the entire amount above a sheet footer, not just its first 8px', () => {
  const delta = focusedFieldScrollDelta(155, 227, 219, 56);
  assert.equal(delta, 56);
  assert.ok(219 - delta >= 155);
  assert.ok(219 - delta + 56 <= 227 - 8);
});
test('keeps OTP and room for its action visible after the viewport contracts', () => {
  const delta = focusedFieldScrollDelta(0, 340, 350, 58, 160);
  assert.ok(350 - delta >= 16);
  assert.ok(350 - delta + 58 + 160 <= 340);
});
test('does not jump a visible field when feedback changes or the keyboard opens', () => {
  assert.equal(focusedFieldScrollDelta(0, 480, 150, 58, 160), 0);
  assert.equal(focusedFieldScrollDelta(107, 367, 171, 56), 0);
});
test('recovers fields above the viewport and ignores an unlaid-out container', () => {
  assert.equal(focusedFieldScrollDelta(100, 400, 60, 48), -48);
  assert.equal(focusedFieldScrollDelta(100, 100, 150, 48), 0);
});
