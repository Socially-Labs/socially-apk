import assert from 'node:assert/strict';
import test from 'node:test';
import { captainExperience } from '../src/api/captain-experience.ts';

test('experience uses recorded history with a precise 90-day boundary', () => {
  assert.equal(captainExperience({ recordedDays: 0 }).label, 'Rookie');
  assert.equal(captainExperience({ recordedDays: 89 }).label, 'Rookie');
  assert.equal(captainExperience({ recordedDays: 90 }).label, 'Veteran');
  assert.equal(captainExperience({ recordedDays: 365 }).days, 365);
});
test('missing history does not invent a rookie or veteran classification', () => {
  assert.equal(captainExperience(), null);
});
