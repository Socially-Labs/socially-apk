// Illustrative quote only. Live quotes must supply NAV, share supply, fees and
// available wallet funds together before a transaction can be reviewed/signed.
export const PREVIEW_SHARE_PRICE = 1.02644;
export const investmentPresets = [100, 250, 500, 1000] as const;

export function amountInCents(input: string): number | null {
  const value = input.trim().replace(',', '.');
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(value)) return null;
  const [whole = '0', fraction = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function investmentError(input: string, balanceCents: number): string | null {
  if (!input.trim()) return 'Enter an amount to continue.';
  const cents = amountInCents(input);
  if (cents === null) return 'Use a number with up to two decimal places.';
  if (cents <= 0) return 'Enter an amount greater than zero.';
  if (cents > balanceCents) return 'This amount exceeds your sample USDC balance.';
  return null;
}

export function estimateShares(cents: number): number { return cents / 100 / PREVIEW_SHARE_PRICE; }
export function formatInvestmentAmount(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
}
