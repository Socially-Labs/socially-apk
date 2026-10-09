import { useCallback, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { createApiClient } from '@/api/client';
import { marketsApi, type Price } from '@/api/markets';
import { walletValueUsd } from '@/components/wallet/wallet-valuation';

export function useWalletValuation(sol: string | null, usdc: string | null) {
  const api = useMemo(() => marketsApi(createApiClient({ origin: process.env.EXPO_PUBLIC_API_URL, getAccessToken: async () => null, timeoutMs: 10_000 })), []);
  const [prices, setPrices] = useState<Price[]>([]);
  const [now, setNow] = useState(Date.now);
  const [loading, setLoading] = useState(true);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  useFocusEffect(useCallback(() => {
    let stopped = false, pending: Promise<void> | null = null;
    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function refresh(): Promise<void> {
      if (pending) return pending;
      clearTimeout(timer);
      if (stopped || AppState.currentState !== 'active') return Promise.resolve();
      const request = new AbortController(); controller = request;
      setNow(Date.now()); setLoading(true);
      pending = (async () => {
        try {
          const next = await api.prices(request.signal);
          if (!stopped && !request.signal.aborted) setPrices(next);
        } catch { /* Last marks age out; never substitute a $1 USDC peg or stale SOL price. */ }
        finally {
          pending = null; controller = null;
          if (!stopped) { setNow(Date.now()); setLoading(false); timer = setTimeout(() => { void refresh(); }, 10_000); }
        }
      })();
      return pending;
    }
    refreshRef.current = refresh;
    void refresh();
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh();
      else { clearTimeout(timer); controller?.abort(); }
    });
    return () => { stopped = true; clearTimeout(timer); controller?.abort(); listener.remove(); refreshRef.current = null; };
  }, [api]));
  const totalUsd = walletValueUsd(sol, usdc, prices, now);
  return { totalUsd, loading, refresh: useCallback(() => refreshRef.current?.() ?? Promise.resolve(), []) };
}
