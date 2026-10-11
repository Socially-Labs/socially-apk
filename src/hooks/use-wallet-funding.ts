import { getApiOrigin } from '@/api/runtime-origin';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { createApiClient } from '@/api/client';
import { walletApi, type WalletSummary } from '@/api/wallet';
import { useAuth } from '@/auth/session';

export function useWalletFunding() {
  const { accountId, isAuthenticated, getAccessToken } = useAuth();
  const subject = isAuthenticated ? accountId : null;
  const tokenGetter = useRef(getAccessToken);
  useEffect(() => { tokenGetter.current = getAccessToken; }, [getAccessToken]);
  const api = useMemo(() => walletApi(createApiClient({ origin: getApiOrigin(),
    getAccessToken: () => tokenGetter.current() })), []);
  const [state, setState] = useState<{ subject: string | null; summary: WalletSummary | null; error: string | null }>(
    { subject: null, summary: null, error: null });
  const [generation] = useState(() => ({ value: 0 }));
  const controllers = useRef(new Set<AbortController>());
  const refreshing = useRef<Promise<void> | null>(null);
  const refresh = useCallback(async () => {
    if (!subject) return;
    if (refreshing.current) return refreshing.current;
    const epoch = generation.value;
    const controller = new AbortController(); controllers.current.add(controller);
    const pending = (async () => {
      try {
        const summary = await api.summary(controller.signal);
        if (epoch === generation.value) setState({ subject, summary, error: null });
      } catch (error) {
        if (epoch === generation.value && !controller.signal.aborted) setState(current => ({ ...current, subject,
          error: error instanceof Error ? error.message : 'Couldn’t refresh your wallet.' }));
      } finally {
        controllers.current.delete(controller);
        if (epoch === generation.value) refreshing.current = null;
      }
    })();
    refreshing.current = pending;
    return pending;
  }, [api, subject, generation]);
  useEffect(() => {
    generation.value++; refreshing.current = null;
    setState({ subject, summary: null, error: null });
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (AppState.currentState === 'active' || AppState.currentState === null) await refresh();
      if (!stopped) timer = setTimeout(() => { void poll(); }, 5_000);
    };
    void poll();
    const listener = AppState.addEventListener('change', next => { if (next === 'active') void refresh(); });
    const activeControllers = controllers.current;
    return () => {
      stopped = true; clearTimeout(timer); listener.remove(); generation.value++;
      for (const controller of activeControllers) controller.abort(); activeControllers.clear();
    };
  }, [subject, refresh, generation]);
  const current = state.subject === subject ? state : { subject, summary: null, error: null };
  return { ...current, error: !subject ? 'Sign in to view your trading balances.' : current.error, refresh };
}
