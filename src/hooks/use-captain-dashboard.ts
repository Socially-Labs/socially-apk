import { getApiOrigin } from '@/api/runtime-origin';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/auth/session';
import { subscribeCaptainChanges } from '@/api/captain-stream';
import { createApiClient, apiOrigin } from '@/api/client';
import { captainDashboardApi, type CaptainDashboard, type CaptainRange, type CaptainMember, type CaptainEarning } from '@/api/captain-dashboard';
import { captainPortfolioApi, type CaptainPortfolio, type VaultPerformance } from '@/api/captain-portfolio';
import type { VaultSummary } from '@/api/vaults';
import { createPortfolioCache } from '@/api/captain-portfolio-cache';

type State = {
  subject: string | null; dashboard: CaptainDashboard | null; portfolio: CaptainPortfolio | null;
  vaults: VaultSummary[]; crew: CaptainMember[]; earnings: CaptainEarning[]; contributions: VaultPerformance[];
  vaultCursor: string | null; crewCursor: string | null; earningsCursor: string | null; contributionCursor: string | null;
  contributionRange: CaptainRange | null; contributionRevision: string | null;
  detailKey: string | null;
  loading: boolean; portfolioLoading: boolean; detailLoading: boolean; loadingMore: boolean;
  error: string | null; portfolioError: string | null; detailError: string | null;
  portfolioDelayed: boolean;
};
const empty: State = {
  subject: null, dashboard: null, portfolio: null, vaults: [], crew: [], earnings: [], contributions: [],
  vaultCursor: null, crewCursor: null, earningsCursor: null, contributionCursor: null, contributionRange: null, contributionRevision: null,
  loading: true, portfolioLoading: true, detailLoading: false, loadingMore: false, error: null, portfolioError: null, detailError: null,
  portfolioDelayed: false, detailKey: null,
};
const message = (e: unknown) => e instanceof Error ? e.message : 'Could not load your Captain dashboard.';

export function useCaptainDashboard(range: CaptainRange, panel: string | null) {
  const auth = useAuth(), subject = auth.isReady && auth.isAuthenticated ? auth.accountId : null;
  const getter = useRef(auth.getAccessToken);
  useEffect(() => { getter.current = auth.getAccessToken; }, [auth.getAccessToken]);
  const apis = useMemo(() => {
    const client = createApiClient({ origin: getApiOrigin(), getAccessToken: () => getter.current() });
    return { dashboard: captainDashboardApi(client), portfolio: captainPortfolioApi(client) };
  }, []);
  const [state, setState] = useState<State>(empty), [revision, setRevision] = useState(0);
  const portfolioCache = useMemo(createPortfolioCache, []);
  const controller = useRef<AbortController | null>(null), pageController = useRef<AbortController | null>(null), paging = useRef(false);
  const refresh = useCallback(() => setRevision(v => v + 1), []);
  const detail = ['overview', 'manage', 'crew', 'earnings'].includes(panel ?? '') ? panel : null;

  useFocusEffect(useCallback(() => {
    void revision;
    const request = new AbortController(); controller.current = request; paging.current = false;
    let timer: ReturnType<typeof setTimeout> | undefined, reading = false, dirty = false;
    let stopStream: (() => void) | undefined, activeRead: AbortController | undefined;
    const valid = () => !request.signal.aborted;
    if (!subject) portfolioCache.clear();
    const cached = subject ? portfolioCache.read(subject, range) : null;
    setState(s => s.subject === subject ? { ...s, portfolio: cached ?? (s.portfolio?.range === range ? s.portfolio : null),
      loading: true, portfolioLoading: true, portfolioError: null,
      detailKey: detail === 'overview' ? `${detail}:${range}` : detail, detailLoading: !!detail, detailError: null, loadingMore: false } : { ...empty, subject, detailKey: detail === 'overview' ? `${detail}:${range}` : detail, detailLoading: !!detail });
    const schedule = (delay: number) => { clearTimeout(timer); if (valid()) timer = setTimeout(() => void read(), delay); };
    const invalidate = () => { if (!valid()) return; if (reading) { dirty = true; return; } schedule(250); };
    const startStream = () => {
      if (stopStream || !subject || process.env.EXPO_PUBLIC_PAPER_PRIVATE_UPDATES_ENABLED !== 'true') return;
      stopStream = subscribeCaptainChanges({ origin: apiOrigin(getApiOrigin()), getAccessToken: () => getter.current(), onRevision: invalidate, onConnection: () => {} });
    };
    async function read() {
      if (!subject || reading || !valid() || AppState.currentState === 'background' || AppState.currentState === 'inactive') return;
      reading = true;
      const current = new AbortController(); activeRead = current;
      const commit = (patch: Partial<State>) => { if (valid() && !current.signal.aborted) setState(s => ({ ...s, ...patch, subject })); };
      // Commit independently: delayed detail requests do not block the card.
      const tasks: Promise<unknown>[] = [
        apis.dashboard.dashboard(current.signal).then(dashboard => commit({ dashboard, loading: false, error: null }))
          .catch(e => commit({ loading: false, error: message(e) })),
        apis.portfolio.summary(range, current.signal).then(portfolio => {
          if (valid() && !current.signal.aborted) commit({ ...portfolioCache.accept(subject, portfolio), portfolioLoading: false, portfolioError: null });
        })
          .catch(e => commit({ portfolio: portfolioCache.read(subject, range), portfolioDelayed: true,
            portfolioLoading: false, portfolioError: message(e) })),
      ];
      if (detail) {
        commit({ detailLoading: true });
        const readDetail = async () => {
          if (detail === 'overview') {
            const page = await apis.portfolio.vaults(range, null, current.signal);
            commit({ contributions: page.vaults, contributionCursor: page.nextCursor, contributionRange: page.range,
              contributionRevision: page.revision, detailLoading: false, detailError: null });
          } else if (detail === 'manage') {
            const page = await apis.dashboard.vaults(null, current.signal);
            commit({ vaults: page.items, vaultCursor: page.nextCursor, detailLoading: false, detailError: null });
          } else if (detail === 'crew') {
            const page = await apis.dashboard.crew(null, current.signal);
            commit({ crew: page.items, crewCursor: page.nextCursor, detailLoading: false, detailError: null });
          } else {
            const page = await apis.dashboard.earnings(null, current.signal);
            commit({ earnings: page.items, earningsCursor: page.nextCursor, detailLoading: false, detailError: null });
          }
        };
        tasks.push(readDetail().catch(e => commit({ detailLoading: false, detailError: message(e) })));
      }
      await Promise.allSettled(tasks);
      reading = false; activeRead = undefined;
      if (valid() && (!AppState.currentState || AppState.currentState === 'active')) {
        const delay = dirty ? 250 : 15000; dirty = false; schedule(delay);
      }
    }
    if (subject) { void read(); if (!AppState.currentState || AppState.currentState === 'active') startStream(); }
    else setState({ ...empty, subject, loading: !auth.isReady, portfolioLoading: !auth.isReady, error: auth.isReady ? 'Sign in to view your Captain dashboard.' : null });
    const listener = AppState.addEventListener('change', next => {
      if (next === 'active') { startStream(); invalidate(); }
      else { activeRead?.abort(); pageController.current?.abort(); stopStream?.(); stopStream = undefined; clearTimeout(timer); }
    });
    return () => { request.abort(); activeRead?.abort(); pageController.current?.abort(); clearTimeout(timer); stopStream?.(); listener.remove(); };
  }, [apis, subject, range, detail, revision, auth.isReady, portfolioCache]));

  const loadMore = async (kind: 'vaults' | 'crew' | 'earnings' | 'contributions') => {
    const request = controller.current;
    if (!request || request.signal.aborted || paging.current || state.subject !== subject) return;
    const cursor = kind === 'vaults' ? state.vaultCursor : kind === 'crew' ? state.crewCursor : kind === 'earnings' ? state.earningsCursor : state.contributionCursor;
    if (!cursor) return;
    const pageRequest = new AbortController(); pageController.current = pageRequest;
    const abortPage = () => pageRequest.abort();
    request.signal.addEventListener('abort', abortPage, { once: true });
    const validPage = () => !request.signal.aborted && !pageRequest.signal.aborted;
    paging.current = true; setState(s => ({ ...s, loadingMore: true, detailError: null }));
    try {
      if (kind === 'contributions') {
        const page = await apis.portfolio.vaults(range, cursor, pageRequest.signal);
        if (validPage()) setState(s => ({ ...s, contributions: [...s.contributions, ...page.vaults.filter(v => !s.contributions.some(old => old.vaultId === v.vaultId))],
          contributionCursor: page.nextCursor, contributionRevision: page.revision, contributionRange: range }));
      } else {
        const page = await apis.dashboard[kind](cursor, pageRequest.signal);
        if (validPage()) setState(s => kind === 'vaults' ? { ...s, vaults: [...s.vaults, ...page.items as VaultSummary[]], vaultCursor: page.nextCursor }
          : kind === 'crew' ? { ...s, crew: [...s.crew, ...page.items as CaptainMember[]], crewCursor: page.nextCursor }
            : { ...s, earnings: [...s.earnings, ...page.items as CaptainEarning[]], earningsCursor: page.nextCursor });
      }
    } catch (e) { if (validPage()) setState(s => ({ ...s, detailError: message(e) })); }
    finally {
      request.signal.removeEventListener('abort', abortPage);
      if (pageController.current === pageRequest) pageController.current = null;
      if (!request.signal.aborted) { paging.current = false; setState(s => ({ ...s, loadingMore: false })); }
    }
  };
  const scoped = state.subject === subject ? state : empty;
  const detailKey = detail === 'overview' ? `${detail}:${range}` : detail;
  return { ...scoped, detailLoading: !!subject && !!detail && (scoped.detailKey !== detailKey || scoped.detailLoading),
    portfolio: scoped.portfolio?.range === range ? scoped.portfolio : null,
    portfolioLoading: scoped.portfolioLoading || !!subject && scoped.portfolio?.range !== range && !scoped.portfolioError,
    contributions: scoped.contributionRange === range ? scoped.contributions : [],
    contributionCursor: scoped.contributionRange === range ? scoped.contributionCursor : null, refresh, loadMore };
}
