import { ApiError, type createApiClient } from './client.ts';

export type CaptainPosition = { fundId: string; name: string; shares: string; estimatedValueUsdc: string | null;
  valuationStatus: string; pricedAt: string | null };
export type WalletSummary = { enabled: boolean; mode: 'PAPER'; token: null;
  available: { amount: string; asset: 'USDC' }; positions: CaptainPosition[]; deposits: [] };
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const decimal = (value: unknown): value is string => typeof value === 'string' && /^\d{1,24}(\.\d{1,18})?$/.test(value);
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
function invalid(): never { throw new ApiError('invalid_response', 'The wallet service returned an unexpected response. Please retry.'); }
export function parseWalletSummary(value: unknown): WalletSummary {
  if (!record(value) || value.mode !== 'PAPER' || typeof value.enabled !== 'boolean' ||
    value.token !== null || value.enabled !== false ||
    !record(value.available) || value.available.asset !== 'USDC' || !decimal(value.available.amount) ||
    !Array.isArray(value.deposits) || value.deposits.length !== 0 || !Array.isArray(value.positions)) invalid();
  for (const p of value.positions) {
    if (!record(p) || !uuid(p.fundId) || typeof p.name !== 'string' || !decimal(p.shares) ||
      !(p.estimatedValueUsdc === null || decimal(p.estimatedValueUsdc)) || typeof p.valuationStatus !== 'string' ||
      !(p.pricedAt === null || date(p.pricedAt))) invalid();
  }
  return value as WalletSummary;
}
export function walletApi(client: ReturnType<typeof createApiClient>) {
  return {
    async summary(signal?: AbortSignal) { return parseWalletSummary(await client.request('/v0/me/wallet', { signal })); },
  };
}
// Keep totals as exact decimal strings; Captain allocations never enter the available amount.
const scale = 10n ** 18n;
const units = (value: string) => { const [whole, fraction = ''] = value.split('.'); return BigInt(whole) * scale + BigInt(fraction.padEnd(18, '0')); };
export function walletTotals(summary: WalletSummary) {
  const unavailable = summary.positions.some(p => p.valuationStatus !== 'CURRENT' || p.estimatedValueUsdc === null);
  const vault = summary.positions.reduce((sum, p) => sum + (p.estimatedValueUsdc !== null && p.valuationStatus === 'CURRENT' ? units(p.estimatedValueUsdc) : 0n), 0n);
  const text = (raw: bigint) => `${raw / scale}.${(raw % scale).toString().padStart(18, '0')}`;
  return { available: summary.available.amount, vault: unavailable ? null : text(vault), total: unavailable ? null : text(units(summary.available.amount) + vault) };
}
export function formatUsdc(value: string | null | undefined): string {
  if (value == null) return '—';
  const [whole, fraction = ''] = value.split('.');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction.padEnd(2, '0').slice(0, 2)}`;
}
