import assert from 'node:assert/strict';
import test from 'node:test';
import { withVaultIdentity, vaultBuyingPower } from '../src/api/market-vault.ts';

const now = Date.parse('2026-10-11T00:00:00Z');

const context = { fund: { id: 'one', name: 'Harbor Alpha', status: 'ACTIVE', phase: 'ACTIVE', trialEnd: '2026-12-12T00:00:00Z' }, cashUsdc: '840.000000', navUsdc: '950.000000' };
test('selected artwork survives context refresh without overriding current trading state or crossing vaults', () => {
  const selected = { ...context.fund, status: 'FROZEN', phase: 'FUNDRAISING', avatarUrl: 'https://media.example/avatar', bannerUrl: 'https://media.example/banner' };
  const merged = withVaultIdentity(context, selected);
  assert.equal(merged.fund.avatarUrl, selected.avatarUrl);
  assert.equal(merged.fund.bannerUrl, selected.bannerUrl);
  assert.equal(merged.fund.phase, 'ACTIVE'); assert.equal(merged.fund.status, 'ACTIVE');
  assert.equal(withVaultIdentity(context, { ...selected, id: 'other' }), context);
  assert.equal(withVaultIdentity(merged, { ...selected, avatarUrl: null, bannerUrl: null }).fund.bannerUrl, null);
});
test('buying power uses cash, and becomes unavailable for fundraising, frozen, closed and expired vaults', () => {
  assert.equal(vaultBuyingPower(context, now), '840.000000');
  assert.equal(vaultBuyingPower({ ...context, cashUsdc: '0.000000' }, now), '0.000000');
  assert.equal(vaultBuyingPower(null, now), null);
  for (const change of [{ phase: 'FUNDRAISING' }, { status: 'FROZEN' }, { phase: 'COMPLETED' }, { phase: 'CANCELLED' }, { trialEnd: new Date(now).toISOString() }]) {
    assert.equal(vaultBuyingPower({ ...context, fund: { ...context.fund, ...change } }, now), null);
  }
});
