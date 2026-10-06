import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from 'expo-crypto';
import { ApiError } from '@/api/client';
import type { marketsApi, Intent, Order } from '@/api/markets';
import { orderStorage } from '@/api/market-order-storage';

type Attempt = { subject: string; fundId: string; instrumentId: string; key: string; body: Intent; orderId?: string };
export function usePaperOrder(api: ReturnType<typeof marketsApi>, subject: string | null, fundId: string | null, instrumentId: string | null, active: boolean, onTerminal: () => void, pendingId?: string) {
  const [state, setState] = useState<{ order: Order | null; attempt: Attempt | null; busy: boolean; ready: boolean; error: string | null }>({ order: null, attempt: null, busy: false, ready: false, error: null });
  const epoch = useRef(0), locked = useRef(false), attempt = useRef<Attempt | null>(null), storageKey = useRef<string | null>(null);
  const requests = useRef<AbortController | null>(null);
  const notify = useRef(onTerminal); notify.current = onTerminal;
  useEffect(() => {
    const generation = ++epoch.current, controller = new AbortController();
    requests.current = controller;
    let stopped = false, polling = false, terminalId: string | null = null;
    const valid = () => !stopped && epoch.current === generation;
    locked.current = false; attempt.current = null; storageKey.current = null;
    setState({ order: null, attempt: null, busy: false, ready: false, error: null });
    if (!active || !subject || !fundId || !instrumentId) return () => { stopped = true; epoch.current = generation + 1; controller.abort(); };
    const recover = async () => {
      try {
        const hash = await digestStringAsync(CryptoDigestAlgorithm.SHA256, `${subject}:${fundId}:${instrumentId}`);
        const key = `market.order.${hash}`;
        const raw = await orderStorage.read(key);
        if (!valid()) return;
        storageKey.current = key;
        if (raw) {
          const value = JSON.parse(raw) as Attempt;
          if (value.subject !== subject || value.fundId !== fundId || value.instrumentId !== instrumentId ||
            typeof value.key !== 'string' || !/^[\da-f-]{36}$/i.test(value.key) || !value.body || value.body.instrumentId !== instrumentId ||
            !['BUY', 'SELL'].includes(value.body.side) || (value.body.side === 'BUY' ? !/^\d+(\.\d+)?$/.test(value.body.notionalUsdc) : !/^\d+(\.\d+)?$/.test(value.body.quantity)) ||
            value.orderId !== undefined && !/^[\da-f-]{36}$/i.test(value.orderId)) throw new Error('Could not restore this trade. Please check your pending orders.');
          attempt.current = value;
        }
        setState(current => ({ ...current, attempt: attempt.current, ready: true }));
      } catch (error) { if (valid()) setState(current => ({ ...current, error: error instanceof Error ? error.message : 'Trade recovery unavailable.' })); }
    };
    const poll = async () => {
      const id = attempt.current?.orderId ?? pendingId;
      if (!valid() || !id || polling || AppState.currentState && AppState.currentState !== 'active') return;
      polling = true;
      try {
        const order = await api.order(fundId, id, controller.signal);
        if (!valid()) return;
        setState(current => ({ ...current, order, error: null }));
        if (order.status !== 'PENDING' && terminalId !== order.id) {
          terminalId = order.id;
          if (storageKey.current) await orderStorage.remove(storageKey.current);
          if (!valid()) return;
          attempt.current = null; setState(current => ({ ...current, attempt: null })); notify.current();
        }
      } catch (error) { if (valid()) setState(current => ({ ...current, error: error instanceof Error ? error.message : 'Could not refresh this order.' })); }
      finally { polling = false; }
    };
    void recover().then(poll); const timer = setInterval(() => { void poll(); }, 2000);
    return () => { stopped = true; epoch.current = generation + 1; controller.abort(); clearInterval(timer); };
  }, [api, subject, fundId, instrumentId, active, pendingId]);
  const submit = async (body: Intent) => {
    if (!subject || !fundId || !instrumentId || !storageKey.current || !state.ready || locked.current) return;
    const generation = epoch.current, key = storageKey.current, signal = requests.current?.signal; locked.current = true;
    const own = attempt.current ?? { subject, fundId, instrumentId, key: randomUUID(), body };
    // The recorded body is authoritative during uncertain retries, even after a restart.
    attempt.current = own; setState(current => ({ ...current, busy: true, attempt: own, error: null }));
    try {
      await orderStorage.write(key, JSON.stringify(own));
      if (epoch.current !== generation) return;
      const orderId = own.orderId ?? await api.submit(fundId, own.body, own.key, signal);
      if (epoch.current !== generation) return;
      const submitted = { ...own, orderId }; attempt.current = submitted;
      await orderStorage.write(key, JSON.stringify(submitted));
      if (epoch.current === generation) setState(current => ({ ...current, attempt: submitted, order: { id: orderId, status: 'PENDING', reject_reason: null, quantity: null, fee_usdc: null, fill_price_usdc: null } }));
    } catch (error) {
      if (epoch.current !== generation) return;
      if (error instanceof ApiError && error.status >= 400 && error.status < 500 && ![408, 429].includes(error.status)) {
        // A storage failure must not turn a known rejection into an unhandled promise.
        try { await orderStorage.remove(key); } catch { /* Retrying this key returns the same rejection. */ }
        if (epoch.current !== generation) return;
        attempt.current = null;
      }
      setState(current => ({ ...current, attempt: attempt.current, error: error instanceof Error ? error.message : 'Submission could not be confirmed. Retry the same trade.' }));
    } finally { if (epoch.current === generation) { locked.current = false; setState(current => ({ ...current, busy: false })); } }
  };
  const cancel = async () => {
    if (!fundId || !state.order || state.order.status !== 'PENDING' || locked.current) return;
    const generation = epoch.current; locked.current = true; setState(current => ({ ...current, busy: true }));
    try { await api.cancel(fundId, state.order.id, requests.current?.signal); }
    catch (error) { if (epoch.current === generation) setState(current => ({ ...current, error: error instanceof Error ? error.message : 'Cancellation could not be confirmed.' })); }
    finally { if (epoch.current === generation) { locked.current = false; setState(current => ({ ...current, busy: false })); } }
  };
  return { ...state, submit, cancel };
}
