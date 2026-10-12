import type { CaptainPortfolio } from './captain-portfolio.ts';
import type { CaptainRange } from './captain-dashboard.ts';

export const PORTFOLIO_GRACE_MS = 5 * 60_000;
/** Retain whole confirmed snapshots, never combine money from different revisions.
 * Scope by owner and period; changing vault count invalidates the fallback.
 */
export function createPortfolioCache() {
  const entries = new Map<string, { portfolio: CaptainPortfolio; receivedAt: number }>();
  const key = (subject: string, range: CaptainRange) => `${subject}:${range}`;
  function read(subject: string, range: CaptainRange, now = Date.now()) {
    const id = key(subject, range), entry = entries.get(id);
    if (!entry) return null;
    if (now - entry.receivedAt > PORTFOLIO_GRACE_MS) { entries.delete(id); return null; }
    return entry.portfolio;
  }
  function accept(subject: string, portfolio: CaptainPortfolio, now = Date.now()) {
    const id = key(subject, portfolio.range);
    const previous = read(subject, portfolio.range, now);
    if (previous && previous.totalVaults !== portfolio.totalVaults) entries.delete(id);
    if (portfolio.valuationStatus === 'CURRENT' && portfolio.aumUsdc !== null && portfolio.netPnlUsdc !== null) {
      entries.set(id, { portfolio, receivedAt: now });
      if (entries.size > 20) entries.delete(entries.keys().next().value!);
      return { portfolio, portfolioDelayed: false };
    }
    const cached = read(subject, portfolio.range, now);
    return { portfolio: cached ?? portfolio, portfolioDelayed: cached !== null };
  }
  return { read, accept, clear: () => entries.clear() };
}
