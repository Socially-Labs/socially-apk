import assert from 'node:assert/strict';
import test from 'node:test';
import { createApiClient } from '../src/api/client.ts';
import { formatUsdc, parseWalletSummary, walletApi, walletTotals } from '../src/api/wallet.ts';
import { linkedSolanaAddress } from '../src/auth/solana-address.ts';

const address = '11111111111111111111111111111111';
const deposit = { id: '11111111-1111-4111-8111-111111111111', createdAt: '2026-10-07T12:00:00Z' };
const summary = { mode: 'PAPER', enabled: false, token: null, available: { amount: '123.456789', asset: 'USDC' }, positions: [], deposits: [] };
test('receive uses the user’s Solana wallet and never an EVM or malformed address', () => {
  const external = 'So11111111111111111111111111111111111111112';
  assert.equal(linkedSolanaAddress(undefined), null);
  assert.equal(linkedSolanaAddress([
    { type: 'email', address: 'crew@example.com' },
    { type: 'wallet', chainType: 'ethereum', address: '0x1234567890123456789012345678901234567890' },
    { type: 'wallet', chainType: 'solana', address: 'invalid' },
  ]), null);
  assert.equal(linkedSolanaAddress([{ type: 'wallet', chainType: 'solana', address: external }]), external);
  assert.equal(linkedSolanaAddress([
    { type: 'wallet', chainType: 'solana', walletClientType: 'phantom', address: external },
    { type: 'wallet', chainType: 'solana', walletClientType: 'privy', address },
  ]), address);
  assert.equal(linkedSolanaAddress([{ type: 'wallet', chain_type: 'solana', wallet_client_type: 'privy', address }]), address);
});
test('paper summary rejects custom token funding and invalid balances', () => {
  assert.equal(parseWalletSummary(summary).available.amount, '123.456789');
  for (const invalid of [{ ...summary, enabled: true }, { ...summary, token: { mint: address } },
    { ...summary, deposits: [deposit] }, { ...summary, available: { amount: 123, asset: 'USDC' } }]) {
    assert.throws(() => parseWalletSummary(invalid));
  }
});
test('totals preserve precision, count allocations once and hide stale valuations', () => {
  const positions = [{ fundId: deposit.id, name: 'Captain', shares: '1', estimatedValueUsdc: '10.000001', valuationStatus: 'CURRENT', pricedAt: deposit.createdAt }];
  assert.deepEqual(walletTotals({ ...summary, positions }), { available: '123.456789', vault: '10.000001000000000000', total: '133.456790000000000000' });
  assert.equal(walletTotals({ ...summary, positions: [{ ...positions[0], valuationStatus: 'UNAVAILABLE' }] }).total, null);
  assert.equal(formatUsdc('9999999999999999.123456'), '9,999,999,999,999,999.12');
  assert.equal(formatUsdc(null), '—');
});
test('wallet summary retries authentication and only reads paper balances', async () => {
  const calls = [];
  const api = walletApi(createApiClient({ origin: 'http://localhost:3000', getAccessToken: async () => 'token', fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1 ? Response.json({ error: 'unauthorized' }, { status: 401 }) : Response.json(summary);
  } }));
  assert.deepEqual(await api.summary(), summary);
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.url, 'http://localhost:3000/v0/me/wallet');
    assert.equal(call.options.body, undefined);
  }
});
