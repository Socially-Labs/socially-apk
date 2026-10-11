import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

type Source = { refresh: () => void; busy: boolean };
type HomeRefresh = { refresh: () => void; refreshing: boolean; register: (key: symbol, source: Source) => () => void };
const Context = createContext<HomeRefresh | null>(null);

/** Coordinate the independently loaded Home sections without remounting them. */
export function HomeRefreshProvider({ children }: PropsWithChildren) {
  const sources = useRef(new Map<symbol, Source>());
  const [refreshing, setRefreshing] = useState(false);
  const register = useCallback((key: symbol, source: Source) => {
    sources.current.set(key, source);
    setRefreshing([...sources.current.values()].some(s => s.busy));
    return () => { sources.current.delete(key); setRefreshing([...sources.current.values()].some(s => s.busy)); };
  }, []);
  const refresh = useCallback(() => { for (const source of sources.current.values()) source.refresh(); }, []);
  const value = useMemo(() => ({ refreshing, register, refresh }), [refreshing, register, refresh]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useHomeRefresh() { return useContext(Context); }
export function useHomeRefreshSource(refresh: () => void, busy: boolean) {
  const context = useHomeRefresh();
  const register = context?.register;
  const [key] = useState(() => Symbol('home-refresh-source'));
  useEffect(() => register?.(key, { refresh, busy }), [register, key, refresh, busy]);
}
