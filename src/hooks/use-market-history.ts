import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { marketsApi, History, Period, Price } from '@/api/markets';

export function useMarketHistory(api: ReturnType<typeof marketsApi>, mint: string, tracked: boolean, range: Period, price: Price | null, active = true) {
  const [state, setState] = useState<{ key: string; history: History | null; error: string | null; loading: boolean }>({ key: '', history: null, error: null, loading: true });
  const key = `${mint}:${range}`;
  useEffect(() => {
    if (!active || !tracked) return;
    let stopped = false, busy = false;
    const controller = new AbortController();
    setState(current => ({ key, history: current.key === key ? current.history : null, error: null, loading: true }));
    const read = async () => {
      if (stopped || busy || AppState.currentState && AppState.currentState !== 'active') return;
      busy = true;
      try { const history = await api.history(mint, range, controller.signal); if (!stopped) setState({ key, history, error: null, loading: false }); }
      catch (e) { if (!stopped) setState(current => ({ ...current, loading: false, error: e instanceof Error ? e.message : 'History unavailable.' })); }
      finally { busy = false; }
    };
    void read(); const timer = setInterval(() => { void read(); }, 30_000);
    return () => { stopped = true; controller.abort(); clearInterval(timer); };
  }, [api, mint, tracked, range, key, active]);
  const current = state.key === key ? state : { key, history: null, error: null, loading: true };
  let history = current.history;
  if (history && price?.status === 'CURRENT' && price.priceUsd && price.sourceAt && Date.parse(price.sourceAt) > Date.parse(history.points.at(-1)?.at ?? history.from)) {
    history = { ...history, points: [...history.points.filter(point => Date.parse(point.at) >= Date.parse(price.receivedAt) - (Date.parse(history!.to) - Date.parse(history!.from))), { at: price.sourceAt, price: price.priceUsd }].slice(-721),
      coverage: { ...history.coverage, end: price.sourceAt } };
  }
  return { ...current, history, loading: tracked && active && current.loading };
}
