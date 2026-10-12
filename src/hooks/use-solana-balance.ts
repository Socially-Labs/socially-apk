import { useFocusEffect } from 'expo-router';
import { subscribeWalletChanges } from '@/api/wallet-changes';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/auth/session';
import { isSolanaAddress, readCircleUsdcBalance, readSolBalance } from '@/api/solana-balance';
import { SOLANA_NETWORK } from '@/constants/solana-network';

export function useSolanaBalance() {
  const { accountId, isReady, isAuthenticated, solanaAddress } = useAuth();
  const address = isReady && isAuthenticated && isSolanaAddress(solanaAddress) ? solanaAddress : null;
  const key = address ? `${SOLANA_NETWORK.id}:${accountId}:${address}` : null;
  const [state, setState] = useState<{ key: string | null; amount: string | null; usdcAmount: string | null; loading: boolean; error: string | null }>({ key: null, amount: null, usdcAmount: null, loading: false, error: null });
  const reader = useRef<{ key: string; run: () => Promise<void> } | null>(null);
  // Await the actual read, including a poll already in progress, so pull-to-refresh
  // and post-swap refreshes share one request rather than restarting each other.
  const refresh = useCallback(() => reader.current?.key === key ? reader.current.run() : Promise.resolve(), [key]);
  useFocusEffect(useCallback(() => {
    if (!address || !key) return;
    let stopped = false;
    let dirty = false;
    let request: AbortController | null = null;
    let pending: Promise<void> | null = null;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    function poll(): Promise<void> {
      if (pending) return pending;
      clearTimeout(pollTimer);
      if (stopped || AppState.currentState === 'background' || AppState.currentState === 'inactive') return Promise.resolve();
      const controller = new AbortController(); request = controller;
      const timeout = setTimeout(() => controller.abort(), 10_000);
      setState(current => ({ key, amount: current.key === key ? current.amount : null, usdcAmount: current.key === key ? current.usdcAmount : null, loading: true, error: null }));
      pending = (async () => {
        try {
          const [amount, usdcAmount] = await Promise.all([readSolBalance(address!, controller.signal), readCircleUsdcBalance(address!, controller.signal)]);
          if (!stopped && !controller.signal.aborted) setState({ key, amount, usdcAmount, loading: false, error: null });
        } catch {
          if (!stopped) setState(current => ({ key, amount: current.key === key ? current.amount : null, usdcAmount: current.key === key ? current.usdcAmount : null, loading: false, error: 'Couldn’t refresh your devnet wallet balances. Try again.' }));
        } finally {
          clearTimeout(timeout); request = null; pending = null;
          if (!stopped) {
            if (dirty) { dirty = false; queueMicrotask(() => { void poll(); }); }
            else pollTimer = setTimeout(() => { void poll(); }, 60_000);
          }
        }
      })();
      return pending;
    }
    reader.current = { key, run: poll };
    void poll();
    const unsubscribe = accountId ? subscribeWalletChanges(accountId, () => {
      if (pending) dirty = true; else void poll();
    }) : () => {};
    const listener = AppState.addEventListener('change', next => {
      if (next === 'active') void poll();
      else { clearTimeout(pollTimer); request?.abort(); }
    });
    return () => {
      stopped = true; clearTimeout(pollTimer); request?.abort(); listener.remove(); unsubscribe();
      if (reader.current?.key === key) reader.current = null;
    };
  }, [accountId, address, key]));
  const current = key && state.key === key ? state : { amount: null, usdcAmount: null, loading: !!address, error: null };
  return { address, ...current, refresh };
}
