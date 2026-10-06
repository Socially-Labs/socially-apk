import { ApiError, type createApiClient } from './client.ts';

export type QrDeposit = {
  canPay: boolean; id: string; reference: string; amount: string; creditedAmount: string;
  status: 'WAITING' | 'CONFIRMING' | 'CONFIRMED' | 'EXPIRED'; signature: string | null;
  lastError: string | null; expiresAt: string; createdAt: string; paymentUrl: string;
  token: { label: string; mint: string; decimals: 6; cluster: 'devnet' };
};
export type CaptainPosition = { fundId: string; name: string; shares: string; estimatedValueUsdc: string | null;
  valuationStatus: string; pricedAt: string | null };
export type WalletSummary = { enabled: boolean; mode: 'PAPER'; token: QrDeposit['token'] | null;
  available: { amount: string; asset: 'USDC' }; positions: CaptainPosition[]; deposits: QrDeposit[] };
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const decimal = (value: unknown): value is string => typeof value === 'string' && /^\d{1,24}(\.\d{1,18})?$/.test(value);
const address = (value: unknown): value is string => typeof value === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const token = (value: unknown) => record(value) && typeof value.label === 'string' && address(value.mint) && value.decimals === 6 && value.cluster === 'devnet';
function invalid(): never { throw new ApiError('invalid_response', 'The wallet service returned an unexpected response. Please retry.'); }
export function parseQrDeposit(value: unknown): QrDeposit {
  if (!record(value) || typeof value.canPay !== 'boolean' || !uuid(value.id) || !address(value.reference) || !decimal(value.amount) || !decimal(value.creditedAmount) ||
    !['WAITING', 'CONFIRMING', 'CONFIRMED', 'EXPIRED'].includes(String(value.status)) || !token(value.token) ||
    !(value.signature === null || typeof value.signature === 'string' && /^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(value.signature)) ||
    !(value.lastError === null || typeof value.lastError === 'string') || !date(value.expiresAt) || !date(value.createdAt) || typeof value.paymentUrl !== 'string') invalid();
  const url = new URL(value.paymentUrl);
  const mint = (value.token as QrDeposit['token']).mint;
  if (url.protocol !== 'solana:' || !address(url.pathname) || url.hash || url.searchParams.get('reference') !== value.reference ||
    url.searchParams.getAll('reference').length !== 1 || url.searchParams.get('spl-token') !== mint || url.searchParams.get('amount') !== value.amount) invalid();
  return value as QrDeposit;
}
export function parseWalletSummary(value: unknown): WalletSummary {
  if (!record(value) || value.mode !== 'PAPER' || typeof value.enabled !== 'boolean' ||
    !(value.token === null || token(value.token)) || (value.enabled && value.token === null) ||
    !record(value.available) || value.available.asset !== 'USDC' || !decimal(value.available.amount) ||
    !Array.isArray(value.deposits) || !Array.isArray(value.positions)) invalid();
  value.deposits.forEach(parseQrDeposit);
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
    async createDeposit(amount: string, idempotencyKey: string, signal?: AbortSignal) {
      const result = await client.request('/v0/me/qr-deposits', { method: 'POST', body: { amount }, idempotencyKey, signal });
      if (!record(result)) invalid();
      return parseQrDeposit(result.deposit);
    },
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
export function formatPaymentAmount(value: string): string {
  const [whole, fraction = ''] = value.split('.');
  const exact = fraction.slice(0, 6).replace(/0+$/, '');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${exact ? `.${exact}` : ''}`;
}
export function validDepositAmount(value: string): boolean {
  if (!/^(0|[1-9]\d{0,6})(\.\d{1,6})?$/.test(value)) return false;
  return units(value) >= scale && units(value) <= 1_000_000n * scale;
}
