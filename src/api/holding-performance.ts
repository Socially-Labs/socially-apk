import type { TradingContext } from './markets.ts';

/** Display-only calculations; orders and accounting retain server decimal arithmetic. */
export function holdingPerformance(holding: TradingContext['holdings'][number] | undefined) {
  if (!holding || holding.valueUsdc === null) return null;
  const value=Number(holding.valueUsdc),basis=Number(holding.costBasisUsdc);
  if (!Number.isFinite(value)||!Number.isFinite(basis)||value<0||basis<0) return null;
  const pnl=value-basis;
  return { costBasisUsdc:basis, pnlUsdc:pnl, pnlPercent:basis>0?pnl/basis*100:null };
}
