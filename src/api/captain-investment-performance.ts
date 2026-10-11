import type { TradingReturns } from './generated/paper-trading-contracts.ts';

/** Display the server's capital-adjusted return series without inventing history. */
export function captainInvestmentPerformance(returns?: TradingReturns) {
  const points = returns?.points ?? [];
  const hasGaps = points.some(point => point.hasGap || point.indexValue === null);
  const validHistory = points.length >= 2 && !hasGaps;
  const percent = returns?.netReturnPercent == null ? null : Number(returns.netReturnPercent);
  const rounded = percent === null ? null : Number(percent.toFixed(2));
  return {
    values: validHistory ? points.map(point => Number(point.indexValue)) : [],
    timestamps: validHistory ? points.map(point => point.at) : undefined,
    hasGaps,
    validHistory,
    positive: percent === null || percent >= 0,
    change: rounded === null ? '—' : `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded).toFixed(2)}%`,
  };
}
