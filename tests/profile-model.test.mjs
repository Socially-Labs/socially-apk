import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultUsername, profileFromSettings, usernameError } from '../src/components/settings/profile-model.ts';

test('username validation catches invalid lengths and characters before profile persistence', () => {
  for (const username of ['', 'ab', 'a'.repeat(25), '9captain', 'my name', 'Captain', 'crew-name', 'naïve', '@captain']) {
    assert.ok(usernameError(username), username);
  }
  for (const username of ['abc', 'captain_42', 'a'.repeat(24)]) assert.equal(usernameError(username), null);
});

test('existing profiles get a valid username without losing their display name', () => {
  for (const name of ['Vikas Kumar', '9 lives', '', '李', 'A', '___', 'a'.repeat(40), 'Jane.Doe@example.com']) {
    assert.equal(usernameError(defaultUsername(name)), null, name);
  }
  assert.equal(defaultUsername('Vikas Kumar'), 'vikaskumar');
});

test('profile edits carry images but do not reset wallet privacy', () => {
  const settings = { name: 'Alex', username: 'alex', bio: '', avatar: 'captain', photoUri: 'photo.jpg', bannerUri: 'banner.jpg', hideBalances: true };
  const draft = profileFromSettings(settings);
  assert.equal('hideBalances' in draft, false);
  assert.equal(draft.photoUri, settings.photoUri);
  assert.equal(draft.bannerUri, settings.bannerUri);
  assert.equal(settings.hideBalances, true);
});
