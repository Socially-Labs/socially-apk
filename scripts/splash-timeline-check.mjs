import assert from 'node:assert/strict';
import { transition, traitsOf, progress, buildTimeline } from '../src/components/auth/splash/splash-timeline.ts';
import { coastalFrame, coastalBoatMotion, COASTAL_ART } from '../src/components/auth/coastal-motion.ts';

const full = buildTimeline({ reduceMotion: false });
const reduced = buildTimeline({ reduceMotion: true });
const checks = [
  ['splash advances once and ignores duplicate/out-of-order events', () => {
    let phase = 'mirroring';
    for (const event of ['left', 'mirrorPainted', 'mirrorPainted', 'nativeHidden', 'performed', 'left', 'authenticated', 'left', 'nativeHidden']) {
      phase = transition(phase, event);
    }
    assert.equal(phase, 'gone');
    assert.equal(transition('mirroring', 'left'), 'mirroring');
    assert.equal(transition('performing', 'mirrorPainted'), 'performing');
  }],
  ['splash holds for sign-in and never leaves before authentication', () => {
    assert.equal(transition('performing', 'performed'), 'waiting');
    assert.equal(transition('waiting', 'left'), 'waiting');
    assert.equal(transition('performing', 'authenticated'), 'performing');
    assert.equal(transition('waiting', 'authenticated'), 'leaving');
  }],
  ['splash blocks interactions until it is fully gone', () => {
    for (const phase of ['mirroring', 'unveiling', 'performing', 'waiting', 'leaving']) {
      assert.equal(traitsOf(phase).pointerEvents, 'auto');
    }
    assert.equal(traitsOf('gone').render, false);
  }],
  ['signed-out intro is brief and reduced motion shortens it further', () => {
    assert.ok(full.exitAt <= 1500);
    assert.ok(reduced.exitAt < full.exitAt);
    assert.ok(reduced.end < full.exitAt);
  }],
  ['active coastal boat stays bounded through a long sign-in wait', () => {
    for (let t = 0; t <= 120000; t += 16) {
      const boat = coastalBoatMotion(t);
      assert.ok(Math.abs(boat.x) <= 7);
      assert.ok(Math.abs(boat.y) <= 1.7);
      assert.ok(Math.abs(boat.roll) <= 0.35);
    }
    assert.notDeepEqual(coastalBoatMotion(1000), coastalBoatMotion(3000));
  }],
  ['active coastal artwork preserves proportions across phone and tablet layouts', () => {
    for (const [width, height] of [[320, 568], [390, 844], [430, 932], [768, 1024], [1024, 768]]) {
      const frame = coastalFrame(width, height);
      assert.ok(Math.abs(frame.width / frame.height - COASTAL_ART.width / COASTAL_ART.height) < 1e-10);
      assert.equal(frame.left + frame.width / 2, width / 2);
      assert.ok(frame.top <= 0);
      assert.ok(frame.width <= 640);
    }
  }],
  ['exit remains opaque until its cue and reaches fully transparent', () => {
    assert.equal(progress(full.exitAt, full.exit), 0);
    assert.equal(progress(full.end, full.exit), 1);
    assert.equal(progress(full.end + 5000, full.exit), 1);
  }],
];

for (const [name, run] of checks) {
  run();
  console.log(`ok ${name}`);
}
console.log(`${checks.length}/${checks.length} passed`);
