import { ApiError, type createApiClient } from './client.ts';
import type { CaptainRange } from './captain-dashboard.ts';

export type PortfolioStatus = 'CURRENT' | 'STALE' | 'PARTIAL' | 'UNAVAILABLE';
export type PortfolioPoint = { at: string; netPnlUsdc: string | null; netReturnPercent: string | null; indexValue: string | null; hasGap: boolean; segment: string };
export type CaptainPortfolio = {
  schemaVersion: 1; mode: 'PAPER'; method: 'AGGREGATE_NAV_TWR_V1'; range: CaptainRange; revision: string;
  serverTime: string; asOf: string | null; valuationAsOf: string | null; requestedFrom: string; baselineAt: string | null;
  intervalSeconds: number; valuationStatus: PortfolioStatus; coverage: 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE';
  aumUsdc: string | null; netPnlUsdc: string | null; netFlowsUsdc: string | null; netReturnPercent: string | null;
  settledVaultPnlUsdc: string | null; openVaultPnlUsdc: string | null; activeVaults: number; openVaults: number; totalVaults: number;
  points: PortfolioPoint[]; methodology: string;
};
export type VaultPerformance = {
  vaultId: string; name: string; phase: string; aumUsdc: string | null; netPnlUsdc: string | null;
  lifetimePnlUsdc: string | null; netReturnPercent: string | null; baselineAt: string | null;
  valuationStatus: PortfolioStatus; valuationAsOf: string | null;
};
export type VaultPerformancePage = {
  schemaVersion: 1; mode: 'PAPER'; range: CaptainRange; revision: string; serverTime: string; asOf: string | null;
  vaults: VaultPerformance[]; nextCursor: string | null;
};
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const decimal = (v: unknown) => typeof v === 'string' && /^-?\d{1,24}(\.\d{1,18})?$/.test(v);
const natural = (v: unknown) => typeof v === 'string' && /^\d{1,24}$/.test(v);
const date = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v));
const optionalDate = (v: unknown) => v === null || date(v);
const optionalAmount = (v: unknown) => v === null || decimal(v);
const count = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0;
const status = (v: unknown) => ['CURRENT', 'STALE', 'PARTIAL', 'UNAVAILABLE'].includes(String(v));
const uuid = (v: unknown) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
function invalid(): never { throw new ApiError('invalid_response', 'Vault performance returned an unexpected response. Please retry.'); }

export function parseCaptainPortfolio(v: unknown, range: CaptainRange): CaptainPortfolio {
  if (!record(v) || v.schemaVersion !== 1 || v.mode !== 'PAPER' || v.method !== 'AGGREGATE_NAV_TWR_V1' || v.range !== range || !natural(v.revision)
    || !date(v.serverTime) || !optionalDate(v.asOf) || !optionalDate(v.valuationAsOf) || !date(v.requestedFrom) || !optionalDate(v.baselineAt)
    || !count(v.intervalSeconds) || Number(v.intervalSeconds) === 0 || !status(v.valuationStatus)
    || !['COMPLETE', 'PARTIAL', 'UNAVAILABLE'].includes(String(v.coverage)) || typeof v.methodology !== 'string'
    || !['aumUsdc', 'netPnlUsdc', 'netFlowsUsdc', 'netReturnPercent', 'settledVaultPnlUsdc', 'openVaultPnlUsdc'].every(k => optionalAmount(v[k]))
    || !['activeVaults', 'openVaults', 'totalVaults'].every(k => count(v[k])) || !Array.isArray(v.points) || v.points.length > 401) invalid();
  if (v.aumUsdc !== null && String(v.aumUsdc).startsWith('-') || Number(v.activeVaults) > Number(v.openVaults) || Number(v.openVaults) > Number(v.totalVaults)) invalid();
  let last = -Infinity;
  for (const p of v.points) {
    if (!record(p) || !date(p.at) || Date.parse(String(p.at)) <= last || !optionalAmount(p.netPnlUsdc) || !optionalAmount(p.netReturnPercent)
      || !optionalAmount(p.indexValue) || p.indexValue !== null && String(p.indexValue).startsWith('-') || typeof p.hasGap !== 'boolean' || !natural(p.segment)) invalid();
    last = Date.parse(String(p.at));
  }
  return v as CaptainPortfolio;
}
export function parseVaultPerformancePage(v: unknown, range: CaptainRange): VaultPerformancePage {
  if (!record(v) || v.schemaVersion !== 1 || v.mode !== 'PAPER' || v.range !== range || !natural(v.revision) || !date(v.serverTime)
    || !optionalDate(v.asOf) || !Array.isArray(v.vaults) || v.vaults.length > 50 || !(v.nextCursor === null || uuid(v.nextCursor))) invalid();
  const seen = new Set<string>();
  for (const row of v.vaults) {
    if (!record(row) || !uuid(row.vaultId) || seen.has(String(row.vaultId)) || typeof row.name !== 'string'
      || !['FUNDRAISING', 'ACTIVE', 'SETTLING', 'REFUNDING', 'COMPLETED', 'CANCELLED'].includes(String(row.phase))
      || !['aumUsdc', 'netPnlUsdc', 'lifetimePnlUsdc', 'netReturnPercent'].every(k => optionalAmount(row[k]))
      || row.aumUsdc !== null && String(row.aumUsdc).startsWith('-') || !optionalDate(row.baselineAt) || !optionalDate(row.valuationAsOf) || !status(row.valuationStatus)) invalid();
    seen.add(String(row.vaultId));
  }
  return v as VaultPerformancePage;
}
export function captainPortfolioApi(client: ReturnType<typeof createApiClient>) {
  return {
    async summary(range: CaptainRange, signal?: AbortSignal) {
      return parseCaptainPortfolio(await client.request(`/v1/me/captain/portfolio?range=${range}`, { signal }), range);
    },
    async vaults(range: CaptainRange, after?: string | null, signal?: AbortSignal) {
      return parseVaultPerformancePage(await client.request(`/v1/me/captain/portfolio/vaults?range=${range}${after ? `&after=${encodeURIComponent(after)}` : ''}`, { signal }), range);
    },
  };
}
