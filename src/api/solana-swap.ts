import type { SwapQuote, SwapFees } from './swaps.ts';
import { Connection, PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { getBase58Decoder, getBase64Encoder } from '@solana/kit';
import { SOLANA_NETWORK as N } from '../constants/solana-network.ts';

export const MAX_PRICE_IMPACT = 5;
export const SOL_FEE_RESERVE = 10_000_000n;
const TOKEN = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ATA = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const RAYDIUM_ROUTER = 'DRaybByLpbUL57LJARs3j8BitTxVfzBg351EaMr5UTCd';
const allowedPrograms = new Set([RAYDIUM_ROUTER, 'DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb',
  'DRayAUgENGQBKVaX8owNhgzkEDyoHTGVEGHVJT1E9pfH', 'DRaya7Kj3aMWQSy19kSjvmuwq9docCHofyP9kanQGaav',
  'ComputeBudget111111111111111111111111111111', TOKEN.toBase58(), ATA.toBase58(), '11111111111111111111111111111111']);

export type { SwapQuote } from './swaps.ts';

export function toUnits(value: string, decimals: number): bigint {
  if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(value) || value.length > 30) throw new Error('Enter a valid amount.');
  const [whole, fraction = ''] = value.split('.');
  if (fraction.length > decimals) throw new Error(`Use no more than ${decimals} decimal places.`);
  const units = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0');
  if (units > 18_446_744_073_709_551_615n) throw new Error('Amount is too large.');
  return units;
}
export function fromUnits(units: string | bigint, decimals: number): string {
  const amount = BigInt(units), scale = 10n ** BigInt(decimals);
  const fraction = (amount % scale).toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${amount / scale}${fraction ? `.${fraction}` : ''}`;
}
export const quoteExpired = (quote: SwapQuote, now = Date.now()) => now >= Date.parse(quote.expiresAt);

async function timedFetch(input: Parameters<typeof fetch>[0], init?: RequestInit) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  init?.signal?.addEventListener('abort', abort);
  if (init?.signal?.aborted) controller.abort();
  const timer = setTimeout(abort, 15_000);
  try { return await fetch(input, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timer); init?.signal?.removeEventListener('abort', abort); }
}
export function swapConnection() { return new Connection(N.rpcUrl, { commitment: 'confirmed', disableRetryOnRateLimit: true, fetch: timedFetch }); }
export async function assertDevnet(connection: Connection) {
  if (await connection.getGenesisHash() !== N.genesisHash) throw new Error('Your RPC is not Solana Devnet. Check the devnet RPC configuration.');
}

export function circleTokenAccount(owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([owner.toBytes(), TOKEN.toBytes(), new PublicKey(N.usdcMint).toBytes()], ATA)[0];
}
export function tokenAccountUnits(data: Uint8Array | null, owner: PublicKey): bigint {
  if (!data) return 0n;
  if (data.length < 165 || new PublicKey(data.slice(0, 32)).toBase58() !== N.usdcMint || !new PublicKey(data.slice(32, 64)).equals(owner)) throw new Error('USDC account does not match your wallet and Circle mint.');
  return new DataView(data.buffer, data.byteOffset + 64, 8).getBigUint64(0, true);
}

export async function validateSwapTransaction(transaction: VersionedTransaction, wallet: string, connection: Connection) {
  if (transaction.message.header.numRequiredSignatures !== 1 || transaction.message.staticAccountKeys[0]?.toBase58() !== wallet) throw new Error('Swap transaction signer does not match your wallet.');
  const tables = await Promise.all(transaction.message.addressTableLookups.map(async item => {
    const result = await connection.getAddressLookupTable(item.accountKey);
    if (!result.value) throw new Error('Swap address lookup table is unavailable.');
    return result.value;
  }));
  const message = TransactionMessage.decompile(transaction.message, { addressLookupTableAccounts: tables });
  let hasSwap = false;
  for (const instruction of message.instructions) {
    const program = instruction.programId.toBase58();
    if (!allowedPrograms.has(program)) throw new Error('Swap contains an unsupported program.');
    if (program.startsWith('DRay')) hasSwap = true;
    if (program === TOKEN.toBase58() && ![1, 9, 16, 17, 18].includes(instruction.data[0])) throw new Error('Unexpected token instruction in swap.');
  }
  if (!hasSwap) throw new Error('The transaction does not contain a devnet swap.');
}

export async function verifyPreparedSwap(quote: SwapQuote, transaction: VersionedTransaction, wallet: string, connection = swapConnection(), fees?: SwapFees): Promise<void> {
  if (quote.priceImpact > MAX_PRICE_IMPACT) throw new Error('Price impact is too high.');
  await assertDevnet(connection);
  if (!(await connection.isBlockhashValid(transaction.message.recentBlockhash, { commitment: 'confirmed' })).value) throw new Error('The prepared transaction expired. Refresh your quote.');
  await validateSwapTransaction(transaction, wallet, connection);
  const owner = new PublicKey(wallet);
  const tokenAccount = circleTokenAccount(owner);
  // Resolve the actual USDC source from the prepared message rather than guessing another account.
  const tables = await Promise.all(transaction.message.addressTableLookups.map(async item => {
    const table = (await connection.getAddressLookupTable(item.accountKey)).value;
    if (!table) throw new Error('Swap lookup table is unavailable.');
    return table;
  }));
  const message = TransactionMessage.decompile(transaction.message, { addressLookupTableAccounts: tables });
  const swap = message.instructions.find(i => i.programId.toBase58().startsWith('DRay') && (i.programId.toBase58() !== RAYDIUM_ROUTER || i.data[0] === 0));
  if (!swap) throw new Error('The prepared transaction has no swap.');
  const program = swap.programId.toBase58();
  const sourceIndex = program === RAYDIUM_ROUTER ? 5 : program === 'DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb' ? 4 : program === 'DRayAUgENGQBKVaX8owNhgzkEDyoHTGVEGHVJT1E9pfH' ? 3 : swap.keys.length - 3;
  const inputAccount = swap.keys[sourceIndex]?.pubkey;
  if (quote.input === 'USDC' && !inputAccount) throw new Error('USDC source account is unavailable.');
  const usdcAccount = quote.input === 'USDC' ? inputAccount! : tokenAccount;
  const [solBefore, tokenBefore] = await Promise.all([connection.getBalance(owner), connection.getAccountInfo(usdcAccount)]);
  const requiredSol = (quote.input === 'SOL' ? BigInt(quote.amount) : 0n) + SOL_FEE_RESERVE;
  if (BigInt(solBefore) < requiredSol) throw new Error('Keep at least 0.01 SOL for network fees and token account rent.');
  const beforeUsdc = tokenAccountUnits(tokenBefore?.data ?? null, owner);
  const simulation = await connection.simulateTransaction(transaction, { sigVerify: false, accounts: { encoding: 'base64', addresses: [wallet, usdcAccount.toBase58()] } });
  if (simulation.value.err) throw new Error('Swap simulation failed. Refresh the quote or try a smaller amount.');
  const [solAfter, usdcAfter] = simulation.value.accounts ?? [];
  if (!solAfter || !usdcAfter) throw new Error('Couldn’t verify the swap output. Please retry.');
  const afterUsdc = tokenAccountUnits(new Uint8Array(getBase64Encoder().encode(usdcAfter.data[0])), owner);
  const solDelta = BigInt(solAfter.lamports) - BigInt(solBefore);
  const fee = (await connection.getFeeForMessage(transaction.message)).value;
  const rent = BigInt(fees?.accountRentLamports ?? '0');
  if (fee === null || fee > 1_000_000 || rent > SOL_FEE_RESERVE) throw new Error('Swap fees exceed the client limit.');
  if (quote.input === 'SOL') {
    if (afterUsdc - beforeUsdc < BigInt(quote.minimumOutput) || -solDelta > BigInt(quote.amount) + BigInt(fee) + rent) throw new Error('Simulated swap differs from the approved quote.');
  } else {
    if (beforeUsdc - afterUsdc !== BigInt(quote.amount) || solDelta + BigInt(fee) + rent < BigInt(quote.minimumOutput)) throw new Error('Simulated swap differs from the approved quote.');
  }

}

export function validateSignedSwap(unsigned: VersionedTransaction, signed: Uint8Array): { transaction: VersionedTransaction; signature: string } {
  const transaction = VersionedTransaction.deserialize(signed);
  const expected = unsigned.message.serialize(), actual = transaction.message.serialize();
  if (expected.length !== actual.length || expected.some((byte, i) => byte !== actual[i]) || transaction.signatures[0].every(byte => byte === 0)) throw new Error('The wallet returned a different or unsigned transaction.');
  return { transaction, signature: getBase58Decoder().decode(transaction.signatures[0]) };
}
