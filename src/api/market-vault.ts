import type { Fund, TradingContext } from './markets.ts';

/** Artwork belongs to the selected vault; trading state stays authoritative. */
export function withVaultIdentity(context: TradingContext, selected: Fund): TradingContext {
  if (context.fund.id !== selected.id) return context;
  return { ...context, fund: { ...context.fund, phase: context.fund.phase ?? selected.phase,
    avatarUrl: selected.avatarUrl, bannerUrl: selected.bannerUrl } };
}

/** Cash is buying power only while buys are open; token limits still apply. */
export function vaultBuyingPower(context: TradingContext | null, now = Date.now()): string | null {
  if (!context || context.fund.status !== 'ACTIVE' || context.fund.phase && context.fund.phase !== 'ACTIVE' || Date.parse(context.fund.trialEnd) <= now) return null;
  return context.cashUsdc;
}
