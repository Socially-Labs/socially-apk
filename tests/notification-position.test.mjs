import assert from 'node:assert/strict';
import test from 'node:test';
import { notificationPosition } from '../src/components/home/notification-position.ts';
const limits = { inset: 16, maxWidth: 350, maxHeight: 520 };

test('popup remains inside safe areas for scrolled anchors, notches and orientation changes', () => {
  for (const [width, height, insets] of [
    [320, 568, { top: 24, bottom: 24, left: 0, right: 0 }],
    [393, 852, { top: 59, bottom: 34, left: 0, right: 0 }],
    [844, 390, { top: 0, bottom: 21, left: 59, right: 59 }],
  ]) {
    for (const y of [-100, 0, 80, 800]) {
      const p = notificationPosition({ x: width - 60, y, width: 44, height: 44 }, width, height, insets, limits);
      assert.ok(p.top >= insets.top + 20);
      assert.ok(p.left >= Math.max(16, insets.left));
      assert.ok(p.left + p.panelWidth <= width - Math.max(16, insets.right));
      assert.ok(p.top + p.maxHeight <= height - Math.max(16, insets.bottom));
      assert.ok(p.maxHeight >= 280);
      if (y < 0 || y > height) assert.equal(p.showPointer, false);
    }
  }
});
test('normally placed bell leaves a 20px gap above the popup', () => {
  const p = notificationPosition({ x: 330, y: 60, width: 44, height: 44 }, 393, 852, { top: 24, bottom: 34, left: 0, right: 0 }, limits);
  assert.equal(p.top, 124);
  assert.equal(p.showPointer, true);
});
