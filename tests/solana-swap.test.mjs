import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, PublicKey, TransactionMessage, TransactionInstruction, VersionedTransaction } from '@solana/web3.js';
import { parseSwapQuote } from '../src/api/swaps.ts';
import { SOLANA_NETWORK as N } from '../src/constants/solana-network.ts';
import { assertDevnet, circleTokenAccount, fromUnits, quoteExpired, toUnits, tokenAccountUnits, validateSignedSwap, validateSwapTransaction, verifyPreparedSwap } from '../src/api/solana-swap.ts';

const wallet = Keypair.generate();
const quoteResponse = () => ({ id: '00000000-0000-4000-8000-000000000001', wallet: wallet.publicKey.toBase58(), cluster: 'devnet', input: 'SOL', output: 'USDC',
  amount: '1000000', outputAmount: '20000', minimumOutput: '19800', slippageBps: 100, priceImpact: 1.2, hops: 1, venueFees: null, expiresAt: new Date(Date.now()+30000).toISOString() });
function tx(program = 'DRaybByLpbUL57LJARs3j8BitTxVfzBg351EaMr5UTCd', signer = wallet.publicKey, data = new Uint8Array([0])) {
  return new VersionedTransaction(new TransactionMessage({ payerKey: signer, recentBlockhash: N.solMint,
    instructions: [new TransactionInstruction({ programId: new PublicKey(program), keys: [], data: Buffer.from(data) })] }).compileToV0Message());
}
test('token amounts retain all SOL and USDC decimals without floating point rounding', () => {
  assert.equal(toUnits('1.000000001', 9), 1000000001n);
  assert.equal(toUnits('0.000001', 6), 1n);
  assert.equal(fromUnits('1234567890', 6), '1234.56789');
  for (const invalid of ['1e3', '-1', '01', '.1', '1.', '0.0000001', 'Infinity', ' 1', '99999999999999999999999999999']) assert.throws(() => toUnits(invalid, 6));
});
test('backend quotes enforce slippage and expiry before preparation', () => {
  const q = parseSwapQuote({ ...quoteResponse(), expiresAt: new Date(31000).toISOString() });
  assert.equal(q.output, 'USDC'); assert.equal(q.minimumOutput, '19800');
  for (const patch of [{ amount: '-1' }, { slippageBps: 1000 }, { minimumOutput: '1' }, { outputAmount: '0' }, { priceImpact: NaN }, { hops: 0 }]) assert.throws(() => parseSwapQuote({ ...q, ...patch }));
  assert.equal(quoteExpired(q, 30999), false); assert.equal(quoteExpired(q, 31000), true);
});
test('mainnet RPC, expired blockhash and high impact fail before signing', async () => {
  await assert.rejects(assertDevnet({ getGenesisHash: async () => 'mainnet' }), /not Solana Devnet/);
  const q = parseSwapQuote(quoteResponse());
  await assert.rejects(verifyPreparedSwap({ ...q, priceImpact: 6 }, tx(), wallet.publicKey.toBase58(), {}), /Price impact/);
  await assert.rejects(verifyPreparedSwap(q, tx(), wallet.publicKey.toBase58(), { getGenesisHash: async () => N.genesisHash, isBlockhashValid: async () => ({value: false}) }), /expired/);
});
test('transaction validation rejects other signers, unknown programs, and token approvals', async () => {
  const owner = wallet.publicKey.toBase58();
  await assert.doesNotReject(validateSwapTransaction(tx(), owner, {}));
  await assert.rejects(validateSwapTransaction(tx(undefined, Keypair.generate().publicKey), owner, {}), /signer/);
  await assert.rejects(validateSwapTransaction(tx(Keypair.generate().publicKey.toBase58()), owner, {}), /unsupported program/);
  await assert.rejects(validateSwapTransaction(tx('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', wallet.publicKey, new Uint8Array([4])), owner, {}), /Unexpected token instruction/);
});
test('wallet signatures cannot change the approved transaction', () => {
  const unsigned = tx(), signed = VersionedTransaction.deserialize(unsigned.serialize()); signed.sign([wallet]);
  assert.ok(validateSignedSwap(unsigned, signed.serialize()).signature.length > 50);
  assert.throws(() => validateSignedSwap(unsigned, unsigned.serialize()), /unsigned/);
  signed.message.recentBlockhash = Keypair.generate().publicKey.toBase58(); signed.sign([wallet]);
  assert.throws(() => validateSignedSwap(unsigned, signed.serialize()), /different/);
});
test('simulated token accounts must belong to this wallet and Circle mint', () => {
  const data = new Uint8Array(165); data.set(new PublicKey(N.usdcMint).toBytes()); data.set(wallet.publicKey.toBytes(), 32);
  new DataView(data.buffer).setBigUint64(64, 19800n, true);
  assert.equal(tokenAccountUnits(data, wallet.publicKey), 19800n);
  assert.equal(tokenAccountUnits(null, wallet.publicKey), 0n);
  assert.throws(() => tokenAccountUnits(data, Keypair.generate().publicKey));
  data.set(Keypair.generate().publicKey.toBytes(), 0); assert.throws(() => tokenAccountUnits(data, wallet.publicKey));
  assert.ok(circleTokenAccount(wallet.publicKey).toBase58());
});
test('client simulation verifies backend-prepared output in both directions without calling the venue', async () => {
  let direction = 'SOL', failOutput = false;
  function tokenData(units) {
    const data = Buffer.alloc(165); new PublicKey(N.usdcMint).toBuffer().copy(data); wallet.publicKey.toBuffer().copy(data, 32); data.writeBigUInt64LE(units, 64); return data;
  }
  const connection = {
    getGenesisHash: async () => 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG',
    isBlockhashValid: async () => ({ value: true }), getMultipleAccountsInfo: async () => [], getBalance: async () => 1000000000,
    getAccountInfo: async () => ({ data: tokenData(2500000n) }),
    getParsedTokenAccountsByOwner: async () => ({ value: [{ pubkey: circleTokenAccount(wallet.publicKey), account: { data: { parsed: { info: { tokenAmount: { amount: '2500000' } } } } } }] }),
    getFeeForMessage: async () => ({ value: 5000 }),
    simulateTransaction: async () => ({ value: { err: null, accounts: [
      { lamports: direction === 'SOL' ? 998995000 : 1000495000 },
      { data: [tokenData(failOutput ? 0n : direction === 'SOL' ? 2520000n : 1500000n).toString('base64'), 'base64'] },
    ] } }),
  };
  const forward = parseSwapQuote(quoteResponse());
  await assert.doesNotReject(verifyPreparedSwap(forward, tx(), wallet.publicKey.toBase58(), connection));
  direction = 'USDC';
  const reverse = parseSwapQuote({ ...quoteResponse(), input: 'USDC', output: 'SOL', outputAmount: '500000', minimumOutput: '495000' });
  const source = circleTokenAccount(wallet.publicKey);
  const reverseTx = new VersionedTransaction(new TransactionMessage({ payerKey: wallet.publicKey, recentBlockhash: N.solMint,
    instructions: [new TransactionInstruction({ programId: new PublicKey('DRaybByLpbUL57LJARs3j8BitTxVfzBg351EaMr5UTCd'), keys: Array.from({ length: 6 }, () => ({ pubkey: source, isSigner: false, isWritable: true })), data: Buffer.from([0]) })] }).compileToV0Message());
  connection.getMultipleAccountsInfo = async () => [{ owner: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), data: tokenData(2500000n) }];
  await assert.doesNotReject(verifyPreparedSwap(reverse, reverseTx, wallet.publicKey.toBase58(), connection));
  failOutput = true; await assert.rejects(verifyPreparedSwap(reverse, reverseTx, wallet.publicKey.toBase58(), connection), /differs from/);
});
