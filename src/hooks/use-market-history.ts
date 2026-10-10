import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { marketsApi, History, Period, Price } from '@/api/markets';

export function useMarketHistory(api: ReturnType<typeof marketsApi>, mint: string, tracked: boolean, range: Period, price: Price | null, active = true, backfill = false) {
  const [state, setState] = useState<{ key: string; history: History | null; error: string | null; loading: boolean }>({ key: '', history: null, error: null, loading: true });
  const key = `${mint}:${range}:${backfill}`;
  useEffect(() => {
    if (!active || !tracked) return;
    let stopped = false, busy = false, nextRead = 0;
    const controller = new AbortController();
    setState(current => ({ key, history: current.key === key ? current.history : null, error: null, loading: true }));
    const read = async () => {
      if (stopped || busy || Date.now() < nextRead || AppState.currentState && AppState.currentState !== 'active') return;
      busy = true;
      try { const history = await api.history(mint, range, controller.signal, backfill); nextRead = Date.now() + (history.points.length < 2 || ['PENDING','RUNNING'].includes(history.backfillStatus ?? '') ? 5000 : 30000); if (!stopped) setState({ key, history, error: null, loading: false }); }
      catch (e) { nextRead = Date.now() + 30000; if (!stopped) setState(current => ({ ...current, loading: false, error: e instanceof Error ? e.message : 'History unavailable.' })); }
      finally { busy = false; }
    };
    void read(); const timer = setInterval(() => { void read(); }, 5000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') { nextRead = 0; void read(); } });
    return () => { stopped = true; controller.abort(); clearInterval(timer); listener.remove(); };
  }, [api, mint, tracked, range, key, active, backfill]);
  const current = state.key === key ? state : { key, history: null, error: null, loading: true };
  let history = current.history;
  if (history && history.source !== 'BIRDEYE_TOKEN_USD' && price?.status === 'CURRENT' && price.priceUsd && price.sourceAt && Date.parse(price.sourceAt) > Date.parse(history.points.at(-1)?.at ?? history.from)) {
    history = { ...history, points: [...history.points.filter(point => Date.parse(point.at) >= Date.parse(price.receivedAt) - (Date.parse(history!.to) - Date.parse(history!.from))), { at: price.sourceAt, price: price.priceUsd }].slice(-721),
      coverage: { ...history.coverage, end: price.sourceAt } };
  }
  if (history?.source === 'BIRDEYE_TOKEN_USD' && price?.source === 'JUPITER_PRICE_V3' && price.status === 'CURRENT' && price.priceUsd && price.sourceAt && Date.parse(price.sourceAt) > Date.parse(history.points.at(-1)?.at ?? history.from)) {
    history = { ...history, livePoint: { at: price.sourceAt, price: price.priceUsd } };
  }
  return { ...current, history, loading: tracked && active && current.loading };
}
