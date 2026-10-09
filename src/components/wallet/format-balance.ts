/** Compact display only: never round an available balance up or alter raw amounts. */
export function formatBalance(value: string | null | undefined): string {
  if (value == null || !/^\d+(\.\d+)?$/.test(value)) return '—';
  const [rawWhole, rawFraction = ''] = value.split('.');
  const whole = rawWhole.replace(/^0+(?=\d)/, '');
  const fraction = rawFraction.slice(0, 4).replace(/0+$/, '');
  if (whole === '0' && !fraction && /[1-9]/.test(rawFraction)) return '<0.0001';
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction ? `${grouped}.${fraction}` : grouped;
}
