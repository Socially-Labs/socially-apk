import type { Fund, TradingContext } from './markets.ts';

/** Artwork belongs to the selected vault; trading state stays authoritative. */
export function withVaultIdentity(context: TradingContext, selected: Fund): TradingContext {
  if (context.fund.id !== selected.id) return context;
  return { ...context, fund: { ...context.fund, phase: context.fund.phase ?? selected.phase,
    avatarUrl: selected.avatarUrl, bannerUrl: selected.bannerUrl } };
}
