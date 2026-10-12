import { getApiOrigin } from '@/api/runtime-origin';
import type { MarketList } from '@/api/generated/market-contracts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { createApiClient, apiOrigin } from '@/api/client';
import { marketsApi, parsePrice, priceFreshness, type DiscoveryRequest, type Fund, type History, type Price, type Token, type TradingContext } from '@/api/markets';
import { useAuth } from '@/auth/session';
import { withVaultIdentity } from '@/api/market-vault';

const message = (e: unknown) => e instanceof Error ? e.message : 'Could not refresh markets.';
export function useMarkets(query: string, requestedVaultId: string | null = null, discovery?: DiscoveryRequest, includeSaved = false, investedOnly = false) {
  const discoveryKey = JSON.stringify(discovery ?? null);
  const { accountId, isAuthenticated, getAccessToken } = useAuth();
  const subject = isAuthenticated ? accountId : null;
  const getter = useRef(getAccessToken); useEffect(() => { getter.current = getAccessToken; }, [getAccessToken]);
  const api = useMemo(() => marketsApi(createApiClient({ origin: getApiOrigin(), getAccessToken: () => getter.current() })), []);
  const [selection, setSelection] = useState<{ subject: string | null; requestedVaultId: string | null; id: string } | null>(null);
  const fundId = selection?.subject === subject && selection.requestedVaultId === requestedVaultId ? selection.id : requestedVaultId;
  const [state, setState] = useState<{ subject: string | null; query: string; discoveryKey: string; feed: MarketList | null; histories: Record<string, History | null>; requestedId: string | null; tokens: Token[]; savedTokens: Token[]; holdingTokens: Token[] | null; funds: Fund[]; saved: string[]; context: TradingContext | null; error: string | null; privateError: string | null; privateSettled: boolean; loading: boolean }>(
    { subject, query, discoveryKey, feed: null, histories: {}, requestedId: fundId, tokens: [], savedTokens: [], holdingTokens: null, funds: [], saved: [], context: null, error: null, privateError: null, privateSettled: false, loading: true });
  const paging = useRef<{ scope: string; expanded: boolean; busy: boolean; controller: AbortController | null }>({ scope: '', expanded: false, busy: false, controller: null });
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [marks, setMarks] = useState<Record<string, Price>>({});
  const [now, setNow] = useState(() => Date.now());
  const [refreshVersion, setRefreshVersion] = useState(0);
  const activeEpoch = useRef(0), saving = useRef(false);
  const watchlistVersion = useRef(0);
  useFocusEffect(useCallback(() => {
    void refreshVersion;
    const epoch = ++activeEpoch.current, controller = new AbortController();
    const scope = JSON.stringify([subject, query, discoveryKey]);
    if (paging.current.scope !== scope) { paging.current.controller?.abort(); paging.current = { scope, expanded: false, busy: false, controller: null }; }
    setLoadingMore(false);
    setRefreshing(true);
    let stopped = false, busy = false, socket: WebSocket | undefined, retry: ReturnType<typeof setTimeout> | undefined;
    let cursor: string | undefined, nextCatalog = 0,nextPrivate=0,nextMembership=0;
    let privateReady=false,authenticated=false,privateDirty=false,selectedVault:string|undefined;
    let cachedFunds:Fund[]=[];let priceSelection="";
    let privateRevision:bigint|undefined;
    const subscribePrivate=()=>{if(authenticated && selectedVault && socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type:'subscribe',channel:'vault.context',vaultId:selectedVault}));};
    const valid = () => !stopped && activeEpoch.current === epoch && !controller.signal.aborted;
    setState(current => ({ ...current, subject, query, discoveryKey, feed: current.discoveryKey === discoveryKey ? current.feed : null, requestedId: fundId, context: current.subject === subject && current.requestedId === fundId ? current.context : null, tokens: current.query === query && current.discoveryKey === discoveryKey ? current.tokens : [],
      ...(current.subject !== subject ? { funds: [], saved: [], savedTokens: [], context: null } : {}),
      ...(current.subject !== subject || current.requestedId !== fundId ? { privateSettled: false, privateError: null } : {}),
      holdingTokens: current.subject === subject && current.requestedId === fundId ? current.holdingTokens : null, histories: current.query === query && current.discoveryKey === discoveryKey ? current.histories : {}, loading: !(current.query === query && current.discoveryKey === discoveryKey && current.tokens.length), error: current.query === query && current.discoveryKey === discoveryKey ? current.error : null }));
    const poll = async () => {
      if (!valid() || busy || AppState.currentState && AppState.currentState !== 'active') return;
      busy = true;
      try {
      // A closing stream must not prevent the public catalog request or leave
      // this polling cycle locked. HTTP discovery remains independently usable.
      try {
        const instruments = api.priceInstruments();
        const selection = JSON.stringify(instruments);
        if (socket?.readyState === WebSocket.OPEN && selection !== priceSelection) {
          socket.send(JSON.stringify({ type: 'subscribe', channel: 'market.prices', instruments }));
          priceSelection = selection;
        }
      } catch { socket?.close(); }
      await Promise.allSettled([(async () => { try {
        if (!investedOnly && Date.now() >= nextCatalog && !paging.current.expanded && !paging.current.busy) {
          const options = JSON.parse(discoveryKey) as DiscoveryRequest | null;
          const publishCatalog = (page: { tokens: Token[]; list: MarketList | null }) => {
            if (valid() && !paging.current.expanded && !paging.current.busy) {
              setState(current => valid() ? { ...current, tokens: page.tokens, feed: page.list, loading: false, error: null } : current);
            }
          };
          const result = options ? await api.discoveryPage(options, query, controller.signal, undefined, publishCatalog, false) : null;
          const tokens = result?.tokens ?? await api.tokens(query, controller.signal);
          const histories = result?.histories ?? {};
          if (!result) {
            publishCatalog({ tokens, list: null });

          }
          if (!valid() || paging.current.expanded || paging.current.busy) return;
          setState(current => valid() ? { ...current, tokens, histories: { ...current.histories, ...histories }, feed: result?.list ?? null, loading: false, error: null } : current);
          nextCatalog = Math.max(Date.now()+15_000,result ? Date.parse(result.list.refreshAfter) : Date.now()+60_000);
        }
      } catch (e) { nextCatalog = Date.now() + 30000; if (valid()) setState(current => ({ ...current, loading: false, error: message(e) })); } })(),
      (async () => { try {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          const prices = await api.prices(controller.signal,api.priceInstruments());
          if (valid()) setMarks(prior => {
            const next = { ...prior };
            for (const price of prices) next[price.mint] = price;
            return next;
          });
        }
      } catch { /* Existing marks age into STALE while the server is unreachable. */ } })(),
      (async () => { try {
        if (subject && (Date.now()>=nextPrivate || privateDirty)) {
          privateDirty=false;
          const savedVersion = watchlistVersion.current;
          const membershipDue=Date.now()>=nextMembership;
          const [funds,saved]=membershipDue?await Promise.all([api.funds(controller.signal),api.savedMarkets(controller.signal)]):[cachedFunds,null];
          if(membershipDue){cachedFunds=funds;nextMembership=Date.now()+60_000;}
          nextPrivate=Date.now()+(privateReady?60_000:15_000+Math.random()*5000);
          const selected = fundId ? funds.find(fund => fund.id === fundId) : funds.find(fund => fund.status === 'ACTIVE' && (!fund.phase || fund.phase === 'ACTIVE')) ?? funds.find(fund => fund.phase === 'FUNDRAISING') ?? funds[0];
          if(selected?.id!==selectedVault){selectedVault=selected?.id;privateRevision=undefined;privateReady=false;subscribePrivate();}
          const context = selected ? await api.context(selected.id, controller.signal) : null;
          const holdingTokens = investedOnly && context ? await api.tokensByMints(context.holdings.flatMap(holding => holding.mint ? [holding.mint] : []), controller.signal) : [];
          if (valid()) setState(current => ({ ...current, funds, holdingTokens, privateSettled: true,
            ...(!saved || saving.current || savedVersion !== watchlistVersion.current ? {} : { saved: saved.mints, savedTokens: saved.tokens }), context: context && selected ? withVaultIdentity(context, selected) : null, privateError: fundId && !selected ? 'This vault is unavailable or belongs to another Captain. Select one of your vaults.' : null }));
        }
      } catch (e) { if (valid()) setState(current => ({ ...current, context: null, privateSettled: true, privateError: message(e) })); } })()]);
      }
      finally { busy = false; if (valid()) setRefreshing(false); if(privateDirty && valid())void poll(); }
    };
    const connect = () => {
      if (!valid() || AppState.currentState && AppState.currentState !== 'active') return;
      try {
        const origin = apiOrigin(getApiOrigin()).replace(/^http/, 'ws');
        const ws = new WebSocket(`${origin}/v0/ws`); socket = ws;
        ws.onmessage = event => {
          if (!valid() || socket !== ws) return;
          try {
            const data = JSON.parse(String(event.data));
            if (data.type === 'hello') {
              priceSelection=JSON.stringify(api.priceInstruments());
              ws.send(JSON.stringify({ type: 'subscribe', channel: 'market.prices',instruments:api.priceInstruments(), ...(cursor ? { after: cursor } : {}) }));
              if(subject && process.env.EXPO_PUBLIC_PAPER_PRIVATE_UPDATES_ENABLED==='true' && data.channels?.includes('vault.context'))void getter.current().then(token=>{if(valid()&&socket===ws&&token&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'authenticate',accessToken:token}));}).catch(()=>undefined);
            }
            if(data.type==='authenticated'){authenticated=true;subscribePrivate();}
            if(data.type==='authentication_required'){authenticated=false;privateReady=false;ws.close();return;}
            if(data.channel==='vault.context') {
              if(data.type==='stream_unavailable'||data.type==='error'){privateReady=false;nextPrivate=0;}
              if(data.vaultId===selectedVault && (data.type==='vault.updated'||data.type==='resync_required') && typeof data.accountingRevision==='string' && /^(0|[1-9]\d*)$/.test(data.accountingRevision)){
                const revision=BigInt(data.accountingRevision);
                if(data.type==='resync_required'||privateRevision===undefined||revision>privateRevision){privateRevision=revision;privateReady=true;privateDirty=true;nextPrivate=0;void poll();}
              }
              return;
            }
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
        ws.onclose = () => { if (socket === ws) { socket = undefined;privateReady=false;authenticated=false;nextPrivate=0; } if (valid()) retry = setTimeout(connect, 3000); };
      } catch { if (valid()) retry = setTimeout(connect, 5000); }
    };
    void poll(); connect();
    const tick = setInterval(() => { setNow(Date.now()); }, 1000);
    const timer = setInterval(() => { void poll(); }, 5000);
    const listener = AppState.addEventListener('change', next => {
      if (next === 'active') { nextCatalog = 0;nextPrivate=0;nextMembership=0; void poll(); if (!socket) connect(); }
      else { clearTimeout(retry); socket?.close(); }
    });
    return () => { paging.current.controller?.abort(); paging.current.busy = false; stopped = true; activeEpoch.current++; controller.abort(); clearInterval(tick); clearInterval(timer); clearTimeout(retry); listener.remove(); socket?.close(); };
  }, [api, subject, query, fundId, refreshVersion, discoveryKey, investedOnly]));
  const current = state.subject === subject && state.query === query && state.discoveryKey === discoveryKey && state.requestedId === fundId ? state : { ...state, subject, query, feed: null, histories: {}, tokens: [], savedTokens: [], holdingTokens: null, funds: [], saved: [], context: null, privateSettled: false, privateError: null, error: null, loading: true };
  const tokens = useMemo(() => (investedOnly ? (current.holdingTokens ?? []).filter(token => !query || token.name.toLowerCase().includes(query.toLowerCase()) || token.symbol.toLowerCase().includes(query.toLowerCase()) || token.mint.includes(query)) : [...current.tokens, ...(!query && (!discovery || includeSaved) ? current.savedTokens.filter(saved => !current.tokens.some(token => token.mint === saved.mint)) : [])]).map(token => {
    const live = marks[token.mint], snapshot = token.price;
    const newest = live && (!snapshot?.sourceAt || !!live.sourceAt && Date.parse(live.sourceAt) >= Date.parse(snapshot.sourceAt)) ? live : snapshot;
    return { ...token, price: priceFreshness(newest, now) };
  }), [current.tokens, current.savedTokens, current.holdingTokens, query, marks, now, discovery, includeSaved, investedOnly]);
  const refresh = useCallback(() => { api.invalidateDiscovery(); paging.current.expanded = false; paging.current.controller?.abort(); paging.current.busy = false; setRefreshVersion(version => version + 1); }, [api]);
  const toggleSaved = async (mint: string) => {
    if (!subject || saving.current) return;
    const epoch = activeEpoch.current; saving.current = true; watchlistVersion.current++;
    try {
      const saved = !current.saved.includes(mint); await api.save(mint, saved);
      if (epoch === activeEpoch.current) setState(prior => ({ ...prior, saved: saved ? [...prior.saved, mint] : prior.saved.filter(value => value !== mint) }));
    } catch (e) { if (epoch === activeEpoch.current) setState(prior => ({ ...prior, privateError: message(e) })); }
    finally { watchlistVersion.current++; saving.current = false; }
  };
  const loadMore = async () => {
    if (investedOnly || !current.feed?.nextCursor || !discovery || paging.current.busy || current.loading) return;
    const epoch = activeEpoch.current, controller = new AbortController(), cursor = current.feed.nextCursor;
    paging.current.busy = true; paging.current.controller = controller;
    setLoadingMore(true);
    try {
      const result = await api.discoveryPage(discovery, query, controller.signal, cursor, undefined, false);
      if (epoch === activeEpoch.current && !controller.signal.aborted) {
        paging.current.expanded = true;
        setState(prior => ({ ...prior, feed: result.list, error: null, histories: { ...prior.histories, ...result.histories },
          tokens: [...prior.tokens, ...result.tokens.filter(t => !prior.tokens.some(p => p.mint === t.mint))] }));
      }
    } catch (e) {
      if (epoch === activeEpoch.current && !controller.signal.aborted) {
        setState(prior => ({ ...prior, error: message(e) }));
      }
    } finally {
      if (paging.current.controller === controller) { paging.current.busy = false; paging.current.controller = null; }
      if (epoch === activeEpoch.current) setLoadingMore(false);
    }
  };
  return { ...current, error: investedOnly ? null : current.error, loading: investedOnly ? !!subject && current.holdingTokens === null && !current.privateError : current.loading, feed: !investedOnly && current.feed ? { ...current.feed, status: now > Date.parse(current.feed.refreshAfter) ? 'STALE' as const : current.feed.status } : null, now, tokens, api, loadMore, loadingMore, refreshing, subject, selectFund: (id: string) => setSelection({ subject, requestedVaultId, id }), refresh, toggleSaved };
}
