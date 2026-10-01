import assert from 'node:assert/strict';
import {
  transition, traitsOf, progress, buildTimeline, sceneFrame,
  boatMotion, reflectionMotion, SCENE, REFLECTION_BANDS,
} from '../src/components/splash-timeline.ts';

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
  ['the boat moves in one direction without a loop or large bob', () => {
    let lastX = 0;
    for (let t = 0; t <= full.end; t++) {
      const motion = boatMotion(t, full);
      assert.ok(motion.x >= lastX && motion.x <= 18);
      assert.ok(motion.y >= -3 && motion.y <= 0);
      assert.ok(Math.abs(motion.roll) <= 0.12);
      lastX = motion.x;
    }
    assert.equal(boatMotion(full.end, full).x, 18);
  }],
  ['reflection starts 120 ms behind the boat and stays close to it', () => {
    for (let band = 0; band < REFLECTION_BANDS; band++) {
      assert.equal(reflectionMotion(520, full, band).x, 0);
      for (let t = 521; t <= full.end; t += 50) {
        const reflection = reflectionMotion(t, full, band);
        assert.ok(Math.abs(reflection.x - boatMotion(t - 120, full).x) <= 0.9);
      }
    }
  }],
  ['reduced motion disables boat movement and all ripple distortion', () => {
    assert.ok(reduced.end < full.exitAt);
    for (let t = 0; t <= 4000; t += 10) {
      assert.deepEqual(boatMotion(t, reduced), { x: 0, y: 0, roll: 0 });
      assert.deepEqual(reflectionMotion(t, reduced, 8), { x: 0, y: 0 });
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
