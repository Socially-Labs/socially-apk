import type { marketsApi, Token, TradingContext } from './markets.ts';

/** One visible trade sheet owns one renewable lease and instrument identity. */
export function activeMarketSession(api: ReturnType<typeof marketsApi>, initialToken: Token,
  onToken: (token: Token) => void, now = Date.now) {
  let instrumentId = initialToken.instrumentId, nextLease = 0;
  let release: (() => void) | undefined;
  return {
    async refresh(context: TradingContext | null, signal: AbortSignal) {
      if (now() >= nextLease) {
        const tracking = await api.track(initialToken.mint, signal);
        if (signal.aborted) return null;
        if (!release || instrumentId !== tracking.instrumentId) {
          release?.(); release = api.watchInstrument(tracking.instrumentId);
        }
        instrumentId = tracking.instrumentId;
        nextLease = now() + 15000;
      }
      const token = await api.token(initialToken.mint, signal);
      if (signal.aborted) return null;
      // Never promote a discovery metadata price into an executable price.
      onToken(token);
      const selectedId = token.instrumentId ?? instrumentId;
      // Fetch selected-token limits each detail refresh. A limit previously
      // denied while warming must recover without waiting a full minute.
      const selected = context && selectedId ? await api.context(context.fund.id, signal, selectedId) : context;
      if (signal.aborted) return null;
      return { token, context: selected ? { ...selected, fund: { ...selected.fund, phase: selected.fund.phase ?? context?.fund.phase } } : null };
    },
    renew() { nextLease = 0; },
    dispose() { release?.(); release = undefined; },
  };
}
