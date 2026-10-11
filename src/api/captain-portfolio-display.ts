import type { CaptainPortfolio, PortfolioPoint } from './captain-portfolio.ts';
import { formatUsdc } from './wallet.ts';

export const periodLabel = (period: string) => period === 'ALL' ? 'All time' : `${parseInt(period)} days`;
export function amountSign(value: string | null | undefined): -1 | 0 | 1 | null {
  if (value == null) return null;
  if (!/[1-9]/.test(value)) return 0;
  return value.startsWith('-') ? -1 : 1;
}
export function portfolioMoney(value: string | null | undefined, signed = false): string {
  if (value == null) return '—';
  const sign = amountSign(value), absolute = value.replace(/^-/, '');
  const tiny = sign !== 0 && /^0(?:\.0{2,}\d*)?$/.test(absolute);
  return `${sign === -1 ? '−' : signed && sign === 1 ? '+' : ''}${tiny ? '<' : ''}$${tiny ? '0.01' : formatUsdc(absolute)}`;
}
export function portfolioPercent(value: string | null | undefined): string {
  if (value == null) return '—';
  const sign = amountSign(value), absolute = value.replace(/^-/, '');
  const tiny = sign !== 0 && /^0(?:\.0{2,}\d*)?$/.test(absolute);
  return `${sign === -1 ? '−' : sign === 1 ? '+' : ''}${tiny ? '<0.01' : formatUsdc(absolute)}%`;
}
export function freshnessLabel(portfolio: CaptainPortfolio | null, now = Date.now()) {
  if (!portfolio) return 'Waiting for valuation';
  if (portfolio.valuationStatus === 'STALE') return 'Valuation delayed';
  if (portfolio.valuationStatus === 'PARTIAL') return 'Some valuations unavailable';
  if (portfolio.valuationStatus === 'UNAVAILABLE') return 'Valuation unavailable';
  const at = portfolio.valuationAsOf ?? portfolio.asOf;
  if (!at) return 'Waiting for valuation';
  const seconds = Math.max(0, Math.floor((now - Date.parse(at)) / 1000));
  if (seconds < 5) return 'Updated just now';
  if (seconds < 60) return `Valued ${seconds}s ago`;
  if (seconds < 3600) return `Valued ${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `Valued ${Math.floor(seconds / 3600)}h ago`;
  return `Valued ${new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export type ChartPoint = { at: string; value: number; percent: string; segment: string };
/** Convert only plotting coordinates to numbers; never calculate money totals here. */
export function portfolioChartSegments(points: PortfolioPoint[]): ChartPoint[][] {
  const result: ChartPoint[][] = [];
  let segment: ChartPoint[] = [];
  for (const point of points) {
    if (point.hasGap || point.netReturnPercent === null || !Number.isFinite(Number(point.netReturnPercent))) {
      if (segment.length) result.push(segment);
      segment = []; continue;
    }
    if (segment.length && segment[0].segment !== point.segment) { result.push(segment); segment = []; }
    segment.push({ at: point.at, value: Number(point.netReturnPercent), percent: point.netReturnPercent, segment: point.segment });
  }
  if (segment.length) result.push(segment);
  return result;
}
