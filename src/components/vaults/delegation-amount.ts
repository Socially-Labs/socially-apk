/** USDC calculations stay in six-decimal integers; only progress uses Number. */
export function usdcUnits(value: string): bigint | null {
  if (!/^(0|[1-9]\d{0,23})(\.\d{1,6})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole!) * 1_000_000n + BigInt(fraction.padEnd(6, '0'));
}
export function usdcDecimal(units: bigint): string {
  return `${units / 1_000_000n}.${(units % 1_000_000n).toString().padStart(6, '0')}`;
}
export function delegationLimit(available: string, capacity: string): string {
  const balance = usdcUnits(available) ?? 0n, remaining = usdcUnits(capacity) ?? 0n;
  return usdcDecimal(balance < remaining ? balance : remaining);
}
export function delegationError(value: string, available: string, capacity: string, minimum = '50.000000'): string | null {
  const units = usdcUnits(value);
  if (units === null) return 'Enter an amount with up to 6 decimal places.';
  if (units < (usdcUnits(minimum) ?? 50_000_000n) || units === 0n) return `Minimum delegation: ${minimum.replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1')} USDC.`;
  if (units > (usdcUnits(available) ?? 0n)) return 'Amount exceeds your available balance.';
  if (units > (usdcUnits(capacity) ?? 0n)) return 'Amount exceeds the vault’s remaining capacity.';
  return null;
}
