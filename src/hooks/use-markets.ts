import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { createApiClient, apiOrigin } from '@/api/client';
import { marketsApi, parsePrice, priceFreshness, type Fund, type Price, type Token, type TradingContext } from '@/api/markets';
import { useAuth } from '@/auth/session';

const message = (e: unknown) => e instanceof Error ? e.message : 'Could not refresh markets.';
export function useMarkets(query: string, requestedVaultId: string | null = null) {
  const { accountId, isAuthenticated, getAccessToken } = useAuth();
  const subject = isAuthenticated ? accountId : null;
  const getter = useRef(getAccessToken); useEffect(() => { getter.current = getAccessToken; }, [getAccessToken]);
  const api = useMemo(() => marketsApi(createApiClient({ origin: process.env.EXPO_PUBLIC_API_URL, getAccessToken: () => getter.current() })), []);
  const [selection, setSelection] = useState<{ subject: string | null; requestedVaultId: string | null; id: string } | null>(null);
  const fundId = selection?.subject === subject && selection.requestedVaultId === requestedVaultId ? selection.id : requestedVaultId;
  const [state, setState] = useState<{ subject: string | null; query: string; requestedId: string | null; tokens: Token[]; savedTokens: Token[]; funds: Fund[]; saved: string[]; context: TradingContext | null; error: string | null; privateError: string | null; loading: boolean }>(
    { subject, query, requestedId: fundId, tokens: [], savedTokens: [], funds: [], saved: [], context: null, error: null, privateError: null, loading: true });
  const [marks, setMarks] = useState<Record<string, Price>>({});
  const [now, setNow] = useState(() => Date.now());
  const [refreshVersion, setRefreshVersion] = useState(0);
  const activeEpoch = useRef(0), saving = useRef(false);
  const watchlistVersion = useRef(0);
  useFocusEffect(useCallback(() => {
    void refreshVersion;
    const epoch = ++activeEpoch.current, controller = new AbortController();
    let stopped = false, busy = false, socket: WebSocket | undefined, retry: ReturnType<typeof setTimeout> | undefined;
    let cursor: string | undefined, nextCatalog = 0;
    const valid = () => !stopped && activeEpoch.current === epoch && !controller.signal.aborted;
    setState(current => ({ ...current, subject, query, requestedId: fundId, context: current.subject === subject && current.requestedId === fundId ? current.context : null, tokens: current.query === query ? current.tokens : [],
      ...(current.subject !== subject ? { funds: [], saved: [], savedTokens: [], context: null } : {}), loading: true }));
    const poll = async () => {
      if (!valid() || busy || AppState.currentState && AppState.currentState !== 'active') return;
      busy = true;
      try {
        if (Date.now() >= nextCatalog) {
          const tokens = await api.tokens(query, controller.signal);
          if (!valid()) return;
          setState(current => ({ ...current, tokens, loading: false, error: null }));
          nextCatalog = Date.now() + 30_000;
        }
      } catch (e) { if (valid()) setState(current => ({ ...current, loading: false, error: message(e) })); }
      try {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          const prices = await api.prices(controller.signal);
          if (valid()) setMarks(prior => {
            const next = { ...prior };
            for (const price of prices) next[price.mint] = price;
            return next;
          });
        }
      } catch { /* Existing marks age into STALE while the server is unreachable. */ }
      try {
        if (subject) {
          const savedVersion = watchlistVersion.current;
          const [funds, saved] = await Promise.all([api.funds(controller.signal), api.savedMarkets(controller.signal)]);
          const selected = fundId ? funds.find(fund => fund.id === fundId) : funds.find(fund => fund.status === 'ACTIVE' && (!fund.phase || fund.phase === 'ACTIVE')) ?? funds.find(fund => fund.phase === 'FUNDRAISING') ?? funds[0];
          const context = selected ? await api.context(selected.id, controller.signal) : null;
          if (valid()) setState(current => ({ ...current, funds,
            ...(saving.current || savedVersion !== watchlistVersion.current ? {} : { saved: saved.mints, savedTokens: saved.tokens }), context: context && selected ? { ...context, fund: { ...context.fund, phase: selected.phase } } : null, privateError: fundId && !selected ? 'This vault is unavailable or belongs to another Captain. Select one of your vaults.' : null }));
        }
      } catch (e) { if (valid()) setState(current => ({ ...current, context: null, privateError: message(e) })); }
      finally { busy = false; }
    };
    const connect = () => {
      if (!valid() || AppState.currentState && AppState.currentState !== 'active') return;
      try {
        const origin = apiOrigin(process.env.EXPO_PUBLIC_API_URL).replace(/^http/, 'ws');
        const ws = new WebSocket(`${origin}/v0/ws`); socket = ws;
        ws.onmessage = event => {
          if (!valid() || socket !== ws) return;
          try {
            const data = JSON.parse(String(event.data));
            if (data.type === 'hello') ws.send(JSON.stringify({ type: 'subscribe', channel: 'market.prices', ...(cursor ? { after: cursor } : {}) }));
            if (data.channel !== 'market.prices') return;
            if (data.type === 'resync_required') { cursor = undefined; setMarks({}); }
            if (data.type === 'stream_unavailable' || data.type === 'error') { ws.close(); return; }
            const incoming: Price[] = Array.isArray(data.prices) ? data.prices.map(parsePrice) : data.price ? [parsePrice(data.price)] : [];
            if (incoming.length) setMarks(prior => {
              const next = data.type === 'snapshot' ? {} as Record<string, Price> : { ...prior };
              for (const mark of incoming) {
                const old = next[mark.mint];
                if (!old || !old.sourceAt || !mark.sourceAt || Date.parse(mark.sourceAt) >= Date.parse(old.sourceAt)) next[mark.mint] = mark;
              }
              return next;
            });
            if (typeof data.cursor === 'string' && /^(0|[1-9]\d{0,18})-0$/.test(data.cursor)) cursor = data.cursor;
          } catch { ws.close(); }
        };
        ws.onerror = () => ws.close();
        ws.onclose = () => { if (socket === ws) socket = undefined; if (valid()) retry = setTimeout(connect, 3000); };
      } catch { if (valid()) retry = setTimeout(connect, 5000); }
    };
    void poll(); connect();
    const tick = setInterval(() => { setNow(Date.now()); }, 1000);
    const timer = setInterval(() => { void poll(); }, 5000);
    const listener = AppState.addEventListener('change', next => {
      if (next === 'active') { nextCatalog = 0; void poll(); if (!socket) connect(); }
      else { clearTimeout(retry); socket?.close(); }
    });
    return () => { stopped = true; activeEpoch.current++; controller.abort(); clearInterval(tick); clearInterval(timer); clearTimeout(retry); listener.remove(); socket?.close(); };
  }, [api, subject, query, fundId, refreshVersion]));
  const current = state.subject === subject && state.query === query && state.requestedId === fundId ? state : { ...state, subject, query, tokens: [], savedTokens: [], funds: [], saved: [], context: null, loading: true };
  const tokens = useMemo(() => [...current.tokens, ...(!query ? current.savedTokens.filter(saved => !current.tokens.some(token => token.mint === saved.mint)) : [])].map(token => {
    const live = marks[token.mint], snapshot = token.price;
    const newest = live && (!snapshot?.sourceAt || !!live.sourceAt && Date.parse(live.sourceAt) >= Date.parse(snapshot.sourceAt)) ? live : snapshot;
    return { ...token, price: priceFreshness(newest, now) };
  }), [current.tokens, current.savedTokens, query, marks, now]);
  const refresh = useCallback(() => setRefreshVersion(version => version + 1), []);
  const toggleSaved = async (mint: string) => {
    if (!subject || saving.current) return;
    const epoch = activeEpoch.current; saving.current = true; watchlistVersion.current++;
    try {
      const saved = !current.saved.includes(mint); await api.save(mint, saved);
      if (epoch === activeEpoch.current) setState(prior => ({ ...prior, saved: saved ? [...prior.saved, mint] : prior.saved.filter(value => value !== mint) }));
    } catch (e) { if (epoch === activeEpoch.current) setState(prior => ({ ...prior, privateError: message(e) })); }
    finally { watchlistVersion.current++; saving.current = false; }
  };
  return { ...current, tokens, api, subject, selectFund: (id: string) => setSelection({ subject, requestedVaultId, id }), refresh, toggleSaved };
}
