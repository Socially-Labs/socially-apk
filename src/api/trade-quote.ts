import type { Intent, Preview } from './markets.ts';

export const TRADE_QUOTE_TTL_MS = 15_000;

export function tradeQuoteKey(fundId: string | null, intent: Intent | null) {
  return fundId && intent ? JSON.stringify([fundId, intent.instrumentId, intent.side,
    intent.side === 'BUY' ? intent.notionalUsdc : intent.quantity]) : null;
}

export function tradeQuoteFresh(quote: Preview | null, now = Date.now()) {
  if (!quote) return false;
  const age = now - Date.parse(quote.observedAt);
  return Number.isFinite(age) && age >= -5000 && age <= TRADE_QUOTE_TTL_MS;
}

/** Display only. Submission always keeps the original decimal strings. */
export function tradeQuoteReceive(quote: Preview, side: Intent['side']) {
  return side === 'BUY' ? quote.estimate.quantity : quote.estimate.cashChangeUsdc;
}

/** This is the fixed paper model's spread plus impact, not an editable tolerance. */
export function tradeQuoteSpread(quote: Preview | null) {
  if (!quote) return '—';
  const market = Number(quote.estimate.marketPriceUsdc), fill = Number(quote.estimate.fillPriceUsdc);
  return market > 0 && fill > 0 ? `${(Math.abs(fill / market - 1) * 100).toFixed(2)}%` : '—';
}

export function tradeAmountDisplay(value: string | null | undefined) {
  if (!value) return '—';
  const [whole, fraction = ''] = value.split('.');
  const trimmed = fraction.replace(/0+$/, '');
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (trimmed ? `.${trimmed}` : '');
}
