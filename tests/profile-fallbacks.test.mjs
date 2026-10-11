import assert from 'node:assert/strict';
import test from 'node:test';
import { PROFILE_FALLBACKS, profileFallback, profileMediaUri } from '../src/components/settings/profile-fallbacks.ts';

test('accounts keep one matching pair independent of profile edits or device', () => {
  const seen = new Set();
  for (let account = 0; account < 100; account++) {
    const identity = `did:privy:account-${account}`;
    const pair = profileFallback(identity);
    assert.deepEqual(pair, profileFallback(identity));
    assert.ok(pair.id >= 1 && pair.id <= 5);
    assert.ok(pair.name.length > 0);
    seen.add(pair.id);
  }
  assert.equal(seen.size, 5);
  assert.equal(PROFILE_FALLBACKS.length, 5);
});

test('uploads override fallbacks and removing or failing an upload restores the default', () => {
  const upload = 'https://cdn.example.com/alice/avatar.webp';
  assert.equal(profileMediaUri(upload, null), upload);
  assert.equal(profileMediaUri(null, null), null);
  assert.equal(profileMediaUri(upload, upload), null);
  assert.equal(profileMediaUri(undefined, null), null);
  assert.equal(profileMediaUri('https://cdn.example.com/replacement.webp', upload), 'https://cdn.example.com/replacement.webp');
});
