import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth/session';
import { useAppAccess } from '@/hooks/use-app-access';
import { useAccountSettings } from '@/components/settings/settings-provider';
import { createApiClient } from '@/api/client';
import { getApiOrigin } from '@/api/runtime-origin';
import { homeNotification, notificationApi, type InboxNotification } from '@/api/notifications';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { InterFont } from '@/constants/fonts';
import { NotificationPalette as C } from '@/constants/theme';

type InboxContext = { notifications: ReturnType<typeof homeNotification>[]; loading: boolean; error: string | null; hasMore: boolean;
  loadMore: () => void; retry: () => void; read: (id: string) => void; readAll: () => void };
const Context = createContext<InboxContext | null>(null);
export function useNotifications() { const value = useContext(Context); if (!value) throw new Error('NotificationProvider is required'); return value; }
export function NotificationProvider({ children }: PropsWithChildren) {
  const auth = useAuth();
  const { canEnterApp } = useAppAccess();
  const subject = canEnterApp && auth.isAuthenticated ? auth.accountId : null;
  return <AccountNotifications key={subject ?? 'signed-out'} subject={subject} getAccessToken={auth.getAccessToken}>{children}</AccountNotifications>;
}
function AccountNotifications({ children, subject, getAccessToken }: PropsWithChildren<{ subject: string | null; getAccessToken: () => Promise<string | null> }>) {
  const api = useMemo(() => notificationApi(createApiClient({ origin: getApiOrigin(), getAccessToken })), [getAccessToken]);
  const { settings } = useAccountSettings();
  const [items, setItems] = useState<InboxNotification[]>([]), [queue, setQueue] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(false), [error, setError] = useState<string | null>(null);
  const [before, setBefore] = useState<string | null>(null), [revision, setRevision] = useState(0);
  const [expanded, setExpanded] = useState<InboxNotification | null>(null);
  const [clock, setClock] = useState(0);
  const latest = useRef<string | null>(null), paging = useRef(false), alive = useRef(true);
  const confirmedReads = useRef(new Set<string>());
  const merge = useCallback((rows: InboxNotification[]) => setItems(old => {
    const map = new Map(old.map(n => [n.id, n]));
    for (const n of rows) map.set(n.id, confirmedReads.current.has(n.id) ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n);
    return [...map.values()].sort((a, b) => BigInt(a.id) > BigInt(b.id) ? -1 : 1);
  }), []);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (!subject) return;
    const controller = new AbortController(); let busy = false;
    async function refresh() {
      if (busy || controller.signal.aborted || AppState.currentState === 'background' || AppState.currentState === 'inactive') return;
      busy = true; setLoading(true);
      try {
        const initial = latest.current === null;
        let more = true;
        while (more && !controller.signal.aborted) {
          const page = await api.list(latest.current ? { after: latest.current } : {}, controller.signal);
          if (controller.signal.aborted) return;
          merge(page.notifications);
          if (initial) setBefore(page.nextCursor);
          if (!initial && settings.role === 'captain') setQueue(q => [...q, ...page.notifications.filter(n => n.readAt === null)]);
          for (const n of page.notifications) if (!latest.current || BigInt(n.id) > BigInt(latest.current)) latest.current = n.id;
          // An empty initial inbox still establishes the cursor for future events.
          latest.current ??= '0';
          more = !initial && page.hasMore;
        }
        setError(null); setClock(c => c + 1);
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Could not load notifications.'); }
      finally { busy = false; if (!controller.signal.aborted) setLoading(false); }
    }
    void refresh(); const timer = setInterval(() => { void refresh(); }, 5000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { controller.abort(); clearInterval(timer); listener.remove(); };
  }, [api, subject, revision, merge, settings.role]);
  const toast = queue[0];
  const dismiss = () => setQueue(q => q.slice(1));
  useEffect(() => { if (!toast || expanded) return; const timer = setTimeout(() => setQueue(q => q.slice(1)), 10000); return () => clearTimeout(timer); }, [toast, expanded]);
  async function read(id: string) {
    try { await api.read(id); if (!alive.current) return; confirmedReads.current.add(id); setItems(old => old.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n)); }
    catch (e) { if (alive.current) setError(e instanceof Error ? e.message : 'Could not mark notification as read.'); }
  }
  async function loadMore() {
    if (!before || paging.current) return; paging.current = true; setLoading(true);
    try { const page = await api.list({ before }); if (alive.current) { merge(page.notifications); setBefore(page.nextCursor); setError(null); } }
    catch (e) { if (alive.current) setError(e instanceof Error ? e.message : 'Could not load history.'); }
    finally { paging.current = false; if (alive.current) setLoading(false); }
  }
  const retry = useCallback(() => setRevision(r => r + 1), []);
  void clock;
  const display = toast ? homeNotification(toast) : null;
  const detail = expanded ? homeNotification(expanded) : null;
  return <Context.Provider value={{ notifications: items.map(homeNotification), loading, error, hasMore: before !== null,
    loadMore: () => { void loadMore(); }, retry, read: id => { void read(id); },
    readAll: () => { for (const n of items) if (!n.readAt) void read(n.id); } }}>
    {children}
    {display ? <View style={s.toast} testID="captain-notification-toast" accessibilityLiveRegion="polite">
      <Pressable accessibilityRole="button" accessibilityLabel="Expand notification" onPress={() => { setExpanded(toast); void read(toast.id); dismiss(); }} style={s.body}>
        <Text style={s.title}>{display.title}</Text><Text numberOfLines={2} style={s.copy}>{settings.hideBalances ? display.privateCopy ?? display.copy : display.copy}</Text><Text style={s.time}>{display.time} · Tap to expand</Text>
      </Pressable><Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={dismiss} style={s.close}><Text style={s.title}>×</Text></Pressable>
    </View> : null}
    <DashboardSheet visible={!!detail} title={detail?.title ?? 'Notification'} onClose={() => setExpanded(null)}>
      {detail ? <View style={s.detail}><Text style={s.copy}>{settings.hideBalances ? detail.privateCopy ?? detail.copy : detail.copy}</Text><Text style={s.time}>{detail.time} · {new Date(detail.createdAt!).toLocaleString()}</Text><Text style={s.copy}>Saved in your Home notifications.</Text></View> : null}
    </DashboardSheet>
  </Context.Provider>;
}
const s = StyleSheet.create({ toast: { position: 'absolute', bottom: 100, left: 16, right: 16, maxWidth: 480, alignSelf: 'center', backgroundColor: C.pointer, borderColor: C.border, borderWidth: 1, borderRadius: 20, flexDirection: 'row', boxShadow: C.shadow, zIndex: 100 }, body: { flex: 1, padding: 16, gap: 4 }, close: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, title: { fontFamily: InterFont.semiBold, color: C.ink, fontSize: 14 }, copy: { fontFamily: InterFont.regular, color: C.secondary, fontSize: 13, lineHeight: 19 }, time: { fontFamily: InterFont.regular, color: C.secondary, fontSize: 11, lineHeight: 16 }, detail: { gap: 12 } });
