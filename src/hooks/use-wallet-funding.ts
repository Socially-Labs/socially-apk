import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { createApiClient, ApiError } from '@/api/client';
import { walletApi, type WalletSummary } from '@/api/wallet';
import { useAuth } from '@/auth/session';

export function useWalletFunding() {
  const { accountId, isAuthenticated, getAccessToken } = useAuth();
  const subject = isAuthenticated ? accountId : null;
  const tokenGetter = useRef(getAccessToken);
  useEffect(() => { tokenGetter.current = getAccessToken; }, [getAccessToken]);
  const api = useMemo(() => walletApi(createApiClient({ origin: process.env.EXPO_PUBLIC_API_URL,
    getAccessToken: () => tokenGetter.current() })), []);
  const [state, setState] = useState<{ subject: string | null; summary: WalletSummary | null; error: string | null; creating: boolean }>(
    { subject: null, summary: null, error: null, creating: false });
  const [generation] = useState(() => ({ value: 0 }));
  const controllers = useRef(new Set<AbortController>());
  const refreshing = useRef(false);
  const creating = useRef(false);
  const retry = useRef<{ subject: string; amount: string; key: string } | null>(null);
  const refresh = useCallback(async () => {
    if (!subject || refreshing.current || creating.current) return;
    const epoch = generation.value;
    refreshing.current = true;
    const controller = new AbortController(); controllers.current.add(controller);
    try {
      const summary = await api.summary(controller.signal);
      if (epoch === generation.value) setState({ subject, summary, error: null, creating: false });
    } catch (error) {
      if (epoch === generation.value && !controller.signal.aborted) setState(current => ({ ...current, subject,
        error: error instanceof Error ? error.message : 'Couldn’t refresh your wallet.' }));
    } finally {
      controllers.current.delete(controller);
      if (epoch === generation.value) refreshing.current = false;
    }
  }, [api, subject, generation]);
  useEffect(() => {
    generation.value++; refreshing.current = false; creating.current = false; retry.current = null;
    setState({ subject, summary: null, error: null, creating: false });
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
  const createDeposit = async (amount: string) => {
    if (!subject || creating.current) throw new ApiError('request_pending', 'Please wait for the current request.');
    creating.current = true;
    // Cancel stale reads so a pre-deposit snapshot cannot replace the newly created request.
    generation.value++; refreshing.current = false;
    for (const controller of controllers.current) controller.abort(); controllers.current.clear();
    const epoch = generation.value;
    const controller = new AbortController(); controllers.current.add(controller);
    const canonical = amount.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    if (retry.current?.subject !== subject || retry.current.amount !== canonical) retry.current = { subject, amount: canonical, key: randomUUID() };
    setState(current => ({ ...current, creating: true, error: null }));
    try {
      const deposit = await api.createDeposit(canonical, retry.current.key, controller.signal);
      if (epoch !== generation.value) throw new ApiError('request_cancelled', 'The wallet session changed.');
      retry.current = null;
      setState(current => ({ ...current, summary: current.summary ? { ...current.summary,
        deposits: [deposit, ...current.summary.deposits.filter(p => p.id !== deposit.id)] } : null }));
      return deposit;
    } finally {
      controllers.current.delete(controller);
      if (epoch === generation.value) { creating.current = false; setState(current => ({ ...current, creating: false })); void refresh(); }
    }
  };
  const current = state.subject === subject ? state : { subject, summary: null, error: null, creating: false };
  return { ...current, error: !subject ? 'Sign in to view your wallet and add funds.' : current.error, refresh, createDeposit };
}
