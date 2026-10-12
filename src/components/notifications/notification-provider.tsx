import { publishWalletChange } from '@/api/wallet-changes';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth/session';
import { useAppAccess } from '@/hooks/use-app-access';
import { useAccountSettings } from '@/components/settings/settings-provider';
import { registerWalletDepositAlerts } from '@/api/wallet-notifications';
import { createApiClient } from '@/api/client';
import { observeNotificationPush, registerNotificationPush } from '@/api/notification-push';
import { subscribeNotificationChanges } from '@/api/notification-stream';
import { getApiOrigin } from '@/api/runtime-origin';
import { homeNotification, notificationApi, type InboxNotification } from '@/api/notifications';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { InterFont } from '@/constants/fonts';
import { NotificationPalette as C } from '@/constants/theme';
import type { HomeNotification } from '@/constants/home-notifications';
import { NotificationToast, type ToastNotice } from './notification-toast';

export type ToastPreviewKind = 'crew' | 'sol';

type InboxContext = { notifications: ReturnType<typeof homeNotification>[]; loading: boolean; status: 'idle' | 'loading' | 'success' | 'error'; error: string | null; hasMore: boolean;
  loadMore: () => void; retry: () => void; read: (id: string) => void; readAll: () => void;
  previewToast: (kind: ToastPreviewKind) => void; enablePush: () => Promise<boolean> };
const Context = createContext<InboxContext | null>(null);
export function useNotifications() { const value = useContext(Context); if (!value) throw new Error('NotificationProvider is required'); return value; }
export function NotificationProvider({ children }: PropsWithChildren) {
  const auth = useAuth();
  const { canEnterApp } = useAppAccess();
  const subject = canEnterApp && auth.isAuthenticated ? auth.accountId : null;
  return <AccountNotifications key={subject ?? 'signed-out'} subject={subject} wallet={auth.solanaAddress ?? null} getAccessToken={auth.getAccessToken}>{children}</AccountNotifications>;
}
function AccountNotifications({ children, subject, wallet, getAccessToken }: PropsWithChildren<{ subject: string | null; wallet: string | null; getAccessToken: () => Promise<string | null> }>) {
  const client = useMemo(() => createApiClient({ origin: getApiOrigin(), getAccessToken }), [getAccessToken]);
  const api = useMemo(() => notificationApi(client), [client]);
  const { settings, ready } = useAccountSettings();
  const [items, setItems] = useState<InboxNotification[]>([]), [queue, setQueue] = useState<ToastNotice[]>([]);
  const [loading, setLoading] = useState(false), [error, setError] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [status, setStatus] = useState<InboxContext['status']>('idle');
  const [before, setBefore] = useState<string | null>(null), [revision, setRevision] = useState(0);
  const [expanded, setExpanded] = useState<ToastNotice | null>(null);
  const [clock, setClock] = useState(0);
  const latest = useRef<string | null>(null), paging = useRef(false), alive = useRef(true);
  const announced = useRef(new Set<string>());
  const confirmedReads = useRef(new Set<string>());
  const merge = useCallback((rows: InboxNotification[]) => setItems(old => {
    const map = new Map(old.map(n => [n.id, n]));
    for (const n of rows) map.set(n.id, confirmedReads.current.has(n.id) ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n);
    return [...map.values()].sort((a, b) => BigInt(a.cursor ?? a.id) > BigInt(b.cursor ?? b.id) ? -1 : 1);
  }), []);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (!subject) return;
    const controller = new AbortController();
    let busy = false, dirty = false, connected = false;
    let stopStream: (() => void) | undefined;
    let streamStarted = false;
    const active = () => AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
    async function refresh() {
      if (controller.signal.aborted || !active()) return;
      if (busy) { dirty = true; return; }
      busy = true; setLoading(true); setStatus(previous => previous === 'idle' || previous === 'error' ? 'loading' : previous);
      try {
        const initial = latest.current === null;
        let more = true;
        while (more && !controller.signal.aborted) {
          const page = await api.list(latest.current ? { afterCursor: latest.current } : {}, controller.signal);
          if (controller.signal.aborted) return;
          merge(page.notifications);
          if (initial) setBefore(page.nextCursor);
          const arrivals: ToastNotice[] = [];
          for (const n of [...page.notifications].sort((a,b) => BigInt(a.cursor ?? a.id) < BigInt(b.cursor ?? b.id) ? -1 : 1)) {
            if (!initial && n.readAt === null && !announced.current.has(n.id)) arrivals.push({ notification:homeNotification(n),token:n.type==='wallet_received' ? n.payload.token==='USDC'?'USDC':'SOL':undefined });
            announced.current.add(n.id);
            const cursor = n.cursor ?? n.id;
            if (!latest.current || BigInt(cursor)>BigInt(latest.current)) latest.current=cursor;
          }
          if (!initial && page.notifications.length) publishWalletChange(subject!);
          if (arrivals.length) setQueue(q => [...q,...arrivals].slice(0,20));
          while(announced.current.size>2000)announced.current.delete(announced.current.values().next().value!);
          latest.current ??= '0';
          more = !initial && page.hasMore;
        }
        setError(null); setStatus('success'); setClock(c => c + 1);
        startStream();
      } catch (e) { if (!controller.signal.aborted) { setStatus('error'); setError(e instanceof Error ? e.message : 'Could not load notifications.'); } }
      finally {
        busy = false;
        if (!controller.signal.aborted) { setLoading(false); if (dirty) { dirty=false; void refresh(); } }
      }
    }
    function startStream() {
      const origin=getApiOrigin();
      if(streamStarted || !origin || !active() || controller.signal.aborted)return;
      streamStarted=true;
      stopStream=subscribeNotificationChanges({origin,getAccessToken,cursor:()=>latest.current??'0',onChange:()=>{void refresh();},onWalletChange:()=>publishWalletChange(subject!),onConnection:value=>{connected=value;if(value)publishWalletChange(subject!);}});
    }
    void refresh();
    // Only poll when streaming is unavailable. Foreground resume always catches up.
    const timer=setInterval(()=>{if(!connected)void refresh();},25000);
    const listener=AppState.addEventListener('change',state=>{
      if(state==='active'){void refresh();}
      else {stopStream?.();stopStream=undefined;streamStarted=false;connected=false;}
    });
    return()=>{controller.abort();clearInterval(timer);listener.remove();stopStream?.();};
  }, [api, subject, revision, merge, getAccessToken]);
  useEffect(() => {
    if (!subject) return;
    let stopped = false;
    const register = () => { void registerNotificationPush(client).catch(() => undefined); };
    register();
    const listener = AppState.addEventListener('change',state => {if(state==='active')register();});
    const unobserve = observeNotificationPush(client,()=>setRevision(r=>r+1),id=>{
      void api.get(id).then(notification=>{if(!stopped){merge([notification]);setExpanded({notification:homeNotification(notification)});void api.read(id).then(()=>{if(!stopped){confirmedReads.current.add(id);setItems(old=>old.map(n=>n.id===id?{...n,readAt:new Date().toISOString()}:n));}}).catch(()=>undefined);}}).catch(()=>undefined);
    });
    return()=>{stopped=true;listener.remove();unobserve();};
  },[subject,client,api,merge]);
  useEffect(() => {
    if(!subject || !wallet)return;
    const address=wallet;
    const controller=new AbortController();
    let busy=false,registered=false;
    const active=()=>AppState.currentState!=='background'&&AppState.currentState!=='inactive';
    async function register(){
      if(busy || controller.signal.aborted || !active())return;
      busy=true;
      try{
        // Ownership and finalized baseline are verified by the server.
        await registerWalletDepositAlerts(client,address,controller.signal);
        if(!controller.signal.aborted){registered=true;setWalletError(null);}
      }catch(cause){
        if(!controller.signal.aborted){registered=false;setWalletError(
          cause instanceof Error && 'code' in cause && cause.code==='wallet_notifications_disabled'
            ? 'Wallet deposit alerts are disabled on this server. Retrying automatically.'
            : 'Wallet deposit alerts could not connect. Retrying automatically.');}
      }finally{busy=false;}
    }
    void register();
    const timer=setInterval(()=>{if(!registered)void register();},15000);
    const listener=AppState.addEventListener('change',state=>{if(state==='active')void register();});
    return()=>{controller.abort();clearInterval(timer);listener.remove();};
  },[subject,wallet,client,revision]);
  const enablePush = useCallback(async()=>{if(!subject)throw new Error('Sign in to enable notifications.');return registerNotificationPush(client,true);},[subject,client]);
  const toast = queue[0];
  const dismiss = useCallback(() => setQueue(q => q.slice(1)), []);
  const previewToast = useCallback((kind: ToastPreviewKind) => {
    if (!__DEV__) return;
    const notification: HomeNotification = {
      id: `preview-${Date.now()}-${kind}`, icon: kind === 'crew' ? 'crew' : 'wallet',
      title: kind === 'crew' ? 'Welcome aboard' : 'Added to your wallet',
      copy: kind === 'crew' ? '@poteto joined your fleet' : '$234 worth of SOL added',
      privateCopy: kind === 'sol' ? 'SOL added to your wallet' : undefined,
      time: 'Just now', createdAt: new Date().toISOString(),
    };
    setQueue(q => [...q, { notification, preview: true, token: kind === 'sol' ? 'SOL' : undefined }]);
  }, []);
  const read = useCallback(async (id: string) => {
    try { await api.read(id); if (!alive.current) return; confirmedReads.current.add(id); setItems(old => old.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n)); }
    catch (e) { if (alive.current) setError(e instanceof Error ? e.message : 'Could not mark notification as read.'); }
  }, [api]);
  async function loadMore() {
    if (!before || paging.current) return; paging.current = true; setLoading(true);
    try { const page = await api.list({ before }); if (alive.current) { merge(page.notifications); setBefore(page.nextCursor); setError(null); } }
    catch (e) { if (alive.current) setError(e instanceof Error ? e.message : 'Could not load history.'); }
    finally { paging.current = false; if (alive.current) setLoading(false); }
  }
  const retry = useCallback(() => setRevision(r => r + 1), []);
  void clock;
  const detail = expanded?.notification;
  const openToast = useCallback(() => {
    if (!toast) return;
    setExpanded(toast);
    if (!toast.preview) void read(toast.notification.id);
    dismiss();
  }, [toast, read, dismiss]);
  return <Context.Provider value={{ notifications: items.map(homeNotification), loading: loading || !!subject && status === 'idle', status, error: error ?? walletError, hasMore: before !== null,
    loadMore: () => { void loadMore(); }, retry, read: id => { void read(id); },
    readAll: () => { for (const n of items) if (!n.readAt) void read(n.id); }, previewToast, enablePush }}>
    {children}
    {toast && !expanded ? <NotificationToast key={toast.notification.id} notice={toast} hidden={!ready || settings.hideBalances}
      onDismiss={dismiss} onOpen={openToast} /> : null}
    <DashboardSheet visible={!!detail} title={detail?.title ?? 'Notification'} onClose={() => setExpanded(null)}>
      {detail ? <View style={s.detail}><Text style={s.copy}>{!ready || settings.hideBalances ? detail.privateCopy ?? detail.copy : detail.copy}</Text><Text style={s.time}>{detail.time} · {new Date(detail.createdAt!).toLocaleString()}</Text><Text style={s.copy}>{expanded?.preview ? 'Preview notification. No wallet or fleet activity occurred.' : 'Saved in your Home notifications.'}</Text></View> : null}
    </DashboardSheet>
  </Context.Provider>;
}
const s = StyleSheet.create({ copy: { fontFamily: InterFont.regular, color: C.secondary, fontSize: 13, lineHeight: 19 }, time: { fontFamily: InterFont.regular, color: C.secondary, fontSize: 11, lineHeight: 16 }, detail: { gap: 12 } });
