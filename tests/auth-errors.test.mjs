import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage, validEmail, secondsUntilResend } from '../src/auth/auth-errors.ts';

test('email validation rejects spaces, missing domains, and overly long addresses', () => {
  for (const email of ['', 'not-an-email', 'a@', 'a@localhost', 'a b@example.com', `${'a'.repeat(255)}@example.com`]) {
    assert.equal(validEmail(email), false, email);
  }
  assert.equal(validEmail('first.last+tag@example.co.uk'), true);
});

test('resend cooldown catches up after the app has been backgrounded', () => {
  assert.equal(secondsUntilResend(30_000, 0), 30);
  assert.equal(secondsUntilResend(30_000, 29_001), 1);
  assert.equal(secondsUntilResend(30_000, 90_000), 0);
});

test('SDK errors never expose raw server details in the form', () => {
  assert.equal(authErrorMessage(new Error('internal tenant configuration: secret'), 'send'), 'We couldn’t send your code. Check your email address and try again.');
  assert.match(authErrorMessage({ code: 'rate_limit_exceeded' }, 'send'), /Too many attempts/);
  assert.match(authErrorMessage(new Error('Failed to fetch'), 'verify'), /connection/);
  assert.match(authErrorMessage(new Error('expired_code'), 'verify'), /invalid or has expired/);
  assert.match(authErrorMessage(new Error('AUTH_NOT_CONFIGURED'), 'send'), /temporarily unavailable/);
});
