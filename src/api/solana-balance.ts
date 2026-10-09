import { SOLANA_NETWORK } from '../constants/solana-network.ts';
const addressPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
export const MAINNET_SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

export function isSolanaAddress(value: string | null | undefined): value is string {
  return typeof value === 'string' && addressPattern.test(value);
}

/** Preserve all nine SOL decimals instead of rounding through floating-point SOL. */
export function lamportsToSol(lamports: number): string {
  if (!Number.isSafeInteger(lamports) || lamports < 0) throw new Error('Invalid SOL balance');
  const raw = BigInt(lamports);
  return `${raw / 1_000_000_000n}.${(raw % 1_000_000_000n).toString().padStart(9, '0')}`;
}

export function formatSol(amount: string | null): string {
  if (amount === null) return '—';
  if (!/^\d+\.\d{9}$/.test(amount)) return '—';
  const [whole, fraction] = amount.split('.');
  const decimals = fraction.replace(/0+$/, '');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${decimals ? `.${decimals}` : ''}`;
}

export async function readSolBalance(address: string, signal?: AbortSignal, rpcUrl = SOLANA_NETWORK.rpcUrl, transport: typeof fetch = fetch): Promise<string> {
  if (!isSolanaAddress(address)) throw new Error('Invalid Solana wallet address');
  const response = await transport(rpcUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address, { commitment: 'confirmed' }] }),
  });
  if (!response.ok) throw new Error('Couldn’t refresh your SOL balance. Try again.');
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object' || !('jsonrpc' in body) || body.jsonrpc !== '2.0' || !('id' in body) || body.id !== 1 || 'error' in body ||
    !('result' in body) || !body.result || typeof body.result !== 'object' || !('value' in body.result) || typeof body.result.value !== 'number') {
    throw new Error('Couldn’t read your SOL balance. Try again.');
  }
  return lamportsToSol(body.result.value);
}

/** Sum only Circle's exact mint, including non-associated token accounts. */
export async function readCircleUsdcBalance(address: string, signal?: AbortSignal, rpcUrl: string = SOLANA_NETWORK.rpcUrl, transport: typeof fetch = fetch): Promise<string> {
  if (!isSolanaAddress(address)) throw new Error('Invalid Solana wallet address');
  const response = await transport(rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTokenAccountsByOwner', params: [address, { mint: SOLANA_NETWORK.usdcMint }, { encoding: 'jsonParsed', commitment: 'confirmed' }] }) });
  if (!response.ok) throw new Error('Couldn’t refresh your USDC balance.');
  const body = await response.json();
  if (body?.jsonrpc !== '2.0' || body.id !== 1 || body.error || !Array.isArray(body.result?.value)) throw new Error('Couldn’t read your USDC balance.');
  let units = 0n;
  for (const entry of body.result.value) {
    const info = entry?.account?.data?.parsed?.info;
    if (info?.mint !== SOLANA_NETWORK.usdcMint || info.owner !== address || info.tokenAmount?.decimals !== 6 || !/^\d+$/.test(info.tokenAmount?.amount ?? '')) throw new Error('Invalid USDC token account.');
    units += BigInt(info.tokenAmount.amount);
  }
  return `${units / 1_000_000n}.${(units % 1_000_000n).toString().padStart(6, '0')}`;
}
