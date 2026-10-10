import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import type { Intent, Preview, marketsApi } from '@/api/markets';
import { tradeQuoteKey } from '@/api/trade-quote';

/** Debounced, abortable backend estimates. No client-side fabricated fills. */
export function useMarketTradeQuote(api: ReturnType<typeof marketsApi>, subject: string | null,
  fundId: string | null, intent: Intent | null, active: boolean) {
  const side = intent?.side, instrumentId = intent?.instrumentId;
  const amount = intent?.side === 'BUY' ? intent.notionalUsdc : intent?.quantity;
  const body = useMemo<Intent | null>(() => side && instrumentId && amount ? side === 'BUY'
    ? { side, instrumentId, notionalUsdc: amount } : { side, instrumentId, quantity: amount } : null,
  [side, instrumentId, amount]);
  const key = `${subject}:${tradeQuoteKey(fundId, body)}`;
  const [state, setState] = useState<{ key: string; quote: Preview | null; loading: boolean; error: string | null } | null>(null);
  useEffect(() => {
    if (!active || !subject || !fundId || !body) return;
    let stopped = false, busy = false;
    let request: AbortController | null = null;
    const refresh = async () => {
      if (stopped || busy || AppState.currentState && AppState.currentState !== 'active') return;
      busy = true; request = new AbortController();
      setState(previous => ({ key, quote: previous?.key === key ? previous.quote : null, loading: true, error: null }));
      try {
        const quote = await api.preview(fundId, body, request.signal);
        if (!stopped) setState({ key, quote, loading: false, error: null });
      } catch (error) {
        if (!stopped) setState({ key, quote: null, loading: false, error: error instanceof Error ? error.message : 'Estimate unavailable.' });
      } finally { busy = false; }
    };
    const debounce = setTimeout(() => { void refresh(); }, 400);
    const timer = setInterval(() => { void refresh(); }, 10_000);
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh();
    });
    return () => { stopped = true; clearTimeout(debounce); clearInterval(timer); listener.remove(); request?.abort(); };
  }, [api, key, subject, fundId, active, body]);
  return state?.key === key ? state : { quote: null, loading: active && !!intent, error: null };
}
