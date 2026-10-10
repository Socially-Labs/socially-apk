import type { Token, TradingContext } from './markets.ts';
import { priceFreshness } from './markets.ts';

const explanations: Record<string, string> = {
  asset_not_allowed: 'This vault’s trading rules do not include this token. Select a vault that supports it.',
  dynamic_buys_paused: 'New buys for this market are temporarily paused.',
  asset_disabled: 'New buys for this token are unavailable.',
  quote_asset: 'USDC is your vault’s reserve. Select another token to buy or sell.',
  price_unavailable: 'Waiting for a fresh market price.',
  valuation_unavailable: 'Waiting for fresh prices for your vault’s holdings.',
  fund_not_tradable: 'This vault is not open for trading. Select an active vault.',
  buys_frozen: 'New buys are paused for this vault. You can still sell eligible positions.',
};

/** Explain the same eligibility used by the current UI's review and confirm. */
export function marketTradeAccess(token: Token, context: TradingContext | null, subject: string | null,
  side: 'BUY' | 'SELL', trackingError: string | null) {
  let reason: string | null = null;
  const limit = context?.limits.find(item => item.instrumentId === token.instrumentId);
  if (!subject) reason = 'Sign in to save markets and trade.';
  else if (!context) reason = 'Create or select an active vault to trade.';
  else if (context.fund.phase === 'CANCELLED') reason = 'This vault was cancelled and cannot trade. Create or select an active vault.';
  else if (context.fund.status === 'COMPLETED' || context.fund.phase && !['ACTIVE', 'FUNDRAISING'].includes(context.fund.phase)) reason = 'This vault is no longer open for trading. Select an active vault.';
  else if (context.fund.phase === 'FUNDRAISING') reason = 'Trading opens after this vault completes fundraising successfully.';
  else if (context.fund.status === 'FROZEN' && side === 'BUY') reason = explanations.buys_frozen;
  else if (!token.instrumentId || side === 'BUY' && !token.tradable) reason = trackingError ?? explanations[token.tradeReason ?? ''] ?? 'Preparing this market for paper trading…';
  else if (priceFreshness(token.price)?.status !== 'CURRENT' || token.price?.source === 'JUPITER_TOKENS_V2') reason = trackingError ?? explanations.price_unavailable;
  else if (!(side === 'BUY' ? limit?.canBuy : limit?.canSell)) reason = trackingError ?? explanations[limit?.reason ?? ''] ?? (side === 'SELL' && !context.holdings.some(holding => holding.instrumentId === token.instrumentId) ? 'This vault does not hold this token to sell.' : 'This action is unavailable for your vault.');
  return { allowed: reason === null, reason, limit };
}
