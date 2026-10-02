import assert from 'node:assert/strict';
import {
  transition, traitsOf, progress, buildTimeline, sceneFrame,
  boatMotion, reflectionMotion, rippleMotion, SCENE, REFLECTION_BANDS, RIPPLE_PERIOD_MS,
} from '../src/components/auth/splash/splash-timeline.ts';

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
  ['the original composition stays still for 400 ms', () => {
    for (let t = 0; t <= 400; t += 20) {
      assert.deepEqual(boatMotion(t, full), { x: 0, y: 0, roll: 0 });
      assert.equal(progress(t, full.blend), 0);
      for (let band = 0; band < REFLECTION_BANDS; band++) {
        const ripple = reflectionMotion(t, full, band);
        assert.equal(ripple.x, 0);
        assert.equal(ripple.y, 0);
      }
    }
  }],
  ['the boat drifts slowly within its plate, including a long sign-in wait', () => {
    let last = boatMotion(0, full);
    for (let t = 0; t <= 60000; t += 16) {
      const motion = boatMotion(t, full);
      assert.ok(motion.x >= 0 && motion.x <= 5);
      assert.ok(motion.y >= -2.4 && motion.y <= 0);
      assert.ok(Math.abs(motion.roll) <= 0.18);
      assert.ok(Math.abs(motion.x - last.x) < 0.011, 'horizontal speed stays below 0.7 px/s');
      last = motion;
    }
    assert.ok(boatMotion(full.exitAt, full).x < 0.6, 'boat does not rush across the intro');
    assert.notDeepEqual(boatMotion(full.end + 1000, full), boatMotion(full.end + 3000, full));
  }],
  ['reflection starts 120 ms behind the boat and stays close to it', () => {
    for (let band = 0; band < REFLECTION_BANDS; band++) {
      assert.equal(reflectionMotion(520, full, band).x, 0);
      for (let t = 521; t <= full.end; t += 50) {
        const reflection = reflectionMotion(t, full, band);
        assert.ok(Math.abs(reflection.x - boatMotion(t - 120, full).x) <= 2.8);
      }
    }
  }],
  ['ripples expand, fade seamlessly and continue after the intro clock stops', () => {
    const origin = full.voyage.from;
    assert.ok(rippleMotion(origin + 3500, full, 0).rx > rippleMotion(origin + 1500, full, 0).rx);
    for (let t = origin + 1000; t <= 60000; t += 32) {
      const ripples = [0, 1, 2].map(index => rippleMotion(t, full, index));
      assert.ok(ripples.some(ripple => ripple.opacity >= 0.3), 'at least one ripple stays visible');
      assert.ok(ripples.every(ripple => ripple.opacity >= 0 && ripple.opacity <= 0.42));
    }
    assert.ok(rippleMotion(origin + RIPPLE_PERIOD_MS - 1, full, 0).opacity < 0.00001);
    assert.ok(rippleMotion(origin + RIPPLE_PERIOD_MS + 1, full, 0).opacity < 0.00001);
    assert.notDeepEqual(rippleMotion(full.end + 1000, full, 0), rippleMotion(full.end + 2500, full, 0));
    assert.notDeepEqual(reflectionMotion(full.end + 1000, full, 10), reflectionMotion(full.end + 2500, full, 10));
  }],
  ['reduced motion disables boat movement and all ripple distortion', () => {
    assert.ok(reduced.end < full.exitAt);
    for (let t = 0; t <= 4000; t += 10) {
      assert.deepEqual(boatMotion(t, reduced), { x: 0, y: 0, roll: 0 });
      assert.deepEqual(reflectionMotion(t, reduced, 8), { x: 0, y: 0 });
      assert.equal(rippleMotion(t, reduced, 1).opacity, 0);
    }
  }],
  ['image and layers stay aligned on narrow phones, wide phones and tablets', () => {
    for (const [width, height] of [[320, 568], [390, 844], [430, 932], [768, 1024], [1024, 768]]) {
      const frame = sceneFrame(width, height);
      assert.ok(frame.width >= width - 0.001 && frame.height >= height - 0.001);
      assert.equal(frame.left + frame.width / 2, width / 2);
      assert.equal(frame.top + frame.height / 2, height / 2);
      assert.ok(Math.abs(frame.width / frame.height - SCENE.width / SCENE.height) < 1e-10);
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
