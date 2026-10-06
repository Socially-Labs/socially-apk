import type { Token, History, Period, TradingContext } from '@/api/markets';
import type { MarketFilters } from '@/constants/captain-markets';

export function periodChange(token: Token, period: Period, history?: History | null): string | null {
  if (period === '24H' && token.price?.status === 'CURRENT' && token.price.change24h != null) return token.price.change24h;
  if (history?.range === period && history.changePercent != null) return history.changePercent;
  return period === '1H' ? token.metrics.change1h : period === '24H' ? token.metrics.change24h : null;
}
export function filterTokens(tokens: Token[], context: TradingContext | null, filters: MarketFilters, invested: boolean, savedOnly: boolean, saved: string[], period: Period) {
  const numeric = (v: string | null) => v === null ? null : Number(v);
  const score = (t: Token) => filters.sort === 'Volume' ? numeric(t.metrics.volume24h) : numeric(periodChange(t, period));
  return tokens.filter(token => (!invested || context?.holdings.some(h => h.mint === token.mint)) &&
    (!savedOnly || saved.includes(token.mint)) && (filters.category === 'All' || token.category === filters.category) &&
    (filters.liquidity === 0 || token.metrics.liquidity !== null && Number(token.metrics.liquidity) >= filters.liquidity))
    .sort((a, b) => { const left = score(a), right = score(b); if (left === null) return right === null ? a.mint.localeCompare(b.mint) : 1;
      if (right === null) return -1; return filters.sort === 'Losers' ? left - right : right - left; });
}
export function validTradeAmount(input: string, decimals: number) {
  const pattern = decimals ? new RegExp(`^(0|[1-9]\\d{0,19})(\\.\\d{1,${decimals}})?$`) : /^(0|[1-9]\d{0,19})$/;
  return pattern.test(input) && /[1-9]/.test(input);
}
