import test from 'node:test';
import assert from 'node:assert/strict';
import { formatSol, lamportsToSol, MAINNET_SOLANA_RPC, readCircleUsdcBalance, readSolBalance } from '../src/api/solana-balance.ts';
import { SOLANA_NETWORK as N } from '../src/constants/solana-network.ts';
const address = '2xv2aWMUEesXsbTwFwQcxNrJn4HebPVBCrYihQ8K3Zvg';

test('SOL balances preserve lamport precision, including zero and tiny deposits', () => {
  for (const [lamports, exact, display] of [[0, '0.000000000', '0'], [1, '0.000000001', '0.000000001'], [1250000001, '1.250000001', '1.250000001'], [1234000000000, '1234.000000000', '1,234']]) {
    assert.equal(lamportsToSol(lamports), exact); assert.equal(formatSol(exact), display);
  }
  for (const invalid of [-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => lamportsToSol(invalid));
  assert.equal(formatSol(null), '—');
});

test('balance read supports an explicit cluster without auth credentials', async () => {
  let requested;
  const amount = await readSolBalance(address, undefined, MAINNET_SOLANA_RPC, async (url, options) => {
    requested = { url, ...options };
    return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: { context: { slot: 123 }, value: 1250000001 } }) };
  });
  assert.equal(amount, '1.250000001');
  assert.equal(requested.url, 'https://api.mainnet-beta.solana.com');
  assert.deepEqual(JSON.parse(requested.body).params, [address, { commitment: 'confirmed' }]);
  assert.deepEqual(requested.headers, { 'Content-Type': 'application/json' });
});

test('Circle USDC balances sum exact-mint accounts with six decimals and reject other tokens', async () => {
  const account = amount => ({ account: { data: { parsed: { info: { mint: N.usdcMint, owner: address, tokenAmount: { amount, decimals: 6 } } } } } });
  let requested;
  const transport = async (url, options) => { requested = { url, body: JSON.parse(options.body) }; return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: { value: [account('1234567'), account('1')] } }) }; };
  assert.equal(await readCircleUsdcBalance(address, undefined, undefined, transport), '1.234568');
  assert.equal(requested.url, 'https://api.devnet.solana.com'); assert.deepEqual(requested.body.params[1], { mint: N.usdcMint });
  assert.equal(await readSolBalance(address, undefined, undefined, async url => { assert.equal(url, N.rpcUrl); return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: { value: 1 } }) }; }), '0.000000001');
  const invalid = account('1'); invalid.account.data.parsed.info.mint = MAINNET_SOLANA_RPC;
  await assert.rejects(readCircleUsdcBalance(address, undefined, undefined, async () => ({ ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: { value: [invalid] } }) })));
  await assert.rejects(readCircleUsdcBalance(address, undefined, undefined, async () => ({ ok: false })));
});

test('failed or malformed RPC responses never become a zero balance', async () => {
  for (const value of [{ ok: false }, { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, error: { code: -32602 } }) },
    ...[null, '0', -1, 0.5, Number.MAX_SAFE_INTEGER + 1].map(value => ({ ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: { value } }) }))]) {
    await assert.rejects(readSolBalance(address, undefined, MAINNET_SOLANA_RPC, async () => value));
  }
  await assert.rejects(readSolBalance('0xInvalid', undefined, MAINNET_SOLANA_RPC, async () => { throw new Error('must not fetch'); }), /Invalid Solana/);
});
