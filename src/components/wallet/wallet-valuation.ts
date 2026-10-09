import type { Price } from '@/api/markets';

export const WALLET_PRICE_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
} as const;
const scale = 10n ** 18n;
function decimal(value: string | null): bigint | null {
  if (value === null || !/^\d{1,24}(\.\d{1,18})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * scale + BigInt(fraction.padEnd(18, '0'));
}
/** Indicative USD valuation of test balances, never a spendable/funding balance. */
export function walletValueUsd(sol: string | null, usdc: string | null, prices: Price[], now = Date.now()): string | null {
  let total = 0n;
  for (const [symbol, balance] of [['SOL', sol], ['USDC', usdc]] as const) {
    const units = decimal(balance);
    if (units === null) return null;
    if (units === 0n) continue;
    const price = prices.find(item => item.mint === WALLET_PRICE_MINTS[symbol]);
    const at = price?.sourceAt ? Date.parse(price.sourceAt) : NaN;
    const mark = decimal(price?.priceUsd ?? null);
    if (!price || price.status !== 'CURRENT' || !Number.isFinite(at) || now - at > 90_000 || at - now > 5_000 || mark === null || mark <= 0n) return null;
    total += units * mark / scale;
  }
  return `${total / scale}.${(total % scale).toString().padStart(18, '0')}`;
}
