import assert from 'node:assert/strict';
import test from 'node:test';
import { withVaultIdentity } from '../src/api/market-vault.ts';

const context = { fund: { id: 'one', name: 'Harbor Alpha', status: 'ACTIVE', phase: 'ACTIVE', trialEnd: '2026-12-12T00:00:00Z' } };
test('selected artwork survives context refresh without overriding current trading state or crossing vaults', () => {
  const selected = { ...context.fund, status: 'FROZEN', phase: 'FUNDRAISING', avatarUrl: 'https://media.example/avatar', bannerUrl: 'https://media.example/banner' };
  const merged = withVaultIdentity(context, selected);
  assert.equal(merged.fund.avatarUrl, selected.avatarUrl);
  assert.equal(merged.fund.bannerUrl, selected.bannerUrl);
  assert.equal(merged.fund.phase, 'ACTIVE'); assert.equal(merged.fund.status, 'ACTIVE');
  assert.equal(withVaultIdentity(context, { ...selected, id: 'other' }), context);
  assert.equal(withVaultIdentity(merged, { ...selected, avatarUrl: null, bannerUrl: null }).fund.bannerUrl, null);
});
