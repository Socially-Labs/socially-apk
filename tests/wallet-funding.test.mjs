import assert from 'node:assert/strict';
import test from 'node:test';
import { createApiClient } from '../src/api/client.ts';
import { formatUsdc, formatPaymentAmount, parseQrDeposit, parseWalletSummary, validDepositAmount, walletApi, walletTotals } from '../src/api/wallet.ts';
import { linkedSolanaAddress } from '../src/auth/solana-address.ts';

const address = '11111111111111111111111111111111';
const deposit = { canPay: true, id: '11111111-1111-4111-8111-111111111111', reference: address,
  amount: '10.000000', creditedAmount: '0.000000', status: 'WAITING', signature: null, lastError: null,
  expiresAt: '2026-10-07T12:30:00Z', createdAt: '2026-10-07T12:00:00Z',
  token: { label: 'Test USDC (devnet)', mint: address, decimals: 6, cluster: 'devnet' },
  paymentUrl: `solana:${address}?amount=10.000000&spl-token=${address}&reference=${address}` };
const summary = { mode: 'PAPER', enabled: true, token: deposit.token, available: { amount: '123.456789', asset: 'USDC' }, positions: [], deposits: [deposit] };
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
test('payment response must match its token, amount and unique reference', () => {
  assert.equal(parseQrDeposit(deposit).id, deposit.id);
  for (const invalid of [{ ...deposit, paymentUrl: 'https://example.com' }, { ...deposit, paymentUrl: deposit.paymentUrl.replace('10.000000', '20.000000') },
    { ...deposit, paymentUrl: `${deposit.paymentUrl}&reference=${address}` }, { ...deposit, token: { ...deposit.token, cluster: 'mainnet' } },
    { ...deposit, status: 'SUCCESS' }, { ...deposit, amount: '1e9' }, { ...deposit, expiresAt: 'invalid' }]) assert.throws(() => parseQrDeposit(invalid));
  assert.equal(parseWalletSummary(summary).available.amount, '123.456789');
  assert.throws(() => parseWalletSummary({ ...summary, available: { amount: 123, asset: 'USDC' } }));
});
test('totals preserve precision, count allocations once and hide stale valuations', () => {
  const positions = [{ fundId: deposit.id, name: 'Captain', shares: '1', estimatedValueUsdc: '10.000001', valuationStatus: 'CURRENT', pricedAt: deposit.createdAt }];
  assert.deepEqual(walletTotals({ ...summary, positions }), { available: '123.456789', vault: '10.000001000000000000', total: '133.456790000000000000' });
  assert.equal(walletTotals({ ...summary, positions: [{ ...positions[0], valuationStatus: 'UNAVAILABLE' }] }).total, null);
  assert.equal(formatUsdc('9999999999999999.123456'), '9,999,999,999,999,999.12');
  assert.equal(formatUsdc(null), '—');
  assert.equal(formatPaymentAmount('23.456789'), '23.456789');
  assert.equal(formatPaymentAmount('10.000000'), '10');
});
test('deposit amount accepts only supported fixed decimals and bounds', () => {
  for (const amount of ['1', '1.000001', '1000000.000000']) assert.equal(validDepositAmount(amount), true);
  for (const amount of ['', '0', '.5', '0.999999', '1.0000001', '1000000.000001', '1e3', '-1', '01', ' 1']) assert.equal(validDepositAmount(amount), false);
});
test('401 retries carry the same idempotency key and timeout remains bounded', async () => {
  const calls = [];
  const api = walletApi(createApiClient({ origin: 'http://localhost:3000', getAccessToken: async () => 'token', fetchImpl: async (url, options) => {
    calls.push({ url, options }); return calls.length === 1 ? Response.json({ error: 'unauthorized' }, { status: 401 }) : Response.json({ deposit });
  } }));
  await api.createDeposit('10', 'same-payment-key'); assert.equal(calls.length, 2);
  for (const call of calls) { assert.equal(call.options.headers['Idempotency-Key'], 'same-payment-key'); assert.equal(call.options.body, '{"amount":"10"}'); }
});
