import { ApiError, type createApiClient } from './client.ts';
import type { HomeNotification } from '../constants/home-notifications.ts';

export type InboxNotification = { id: string; cursor?: string; fundId: string | null; type: string; payload: Record<string, unknown>; createdAt: string; readAt: string | null };
export type NotificationPage = { notifications: InboxNotification[]; nextCursor: string | null; hasMore: boolean };
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const cursor = (v: unknown): v is string => typeof v === 'string' && /^[1-9]\d*$/.test(v);
export function parseNotifications(value: unknown): NotificationPage {
  if (!record(value) || !Array.isArray(value.notifications) || !(value.nextCursor === null || cursor(value.nextCursor)) || typeof value.hasMore !== 'boolean' || value.notifications.some(n =>
    !record(n) || !cursor(n.id) || !(n.fundId === null || typeof n.fundId === 'string') || !(n.cursor === undefined || cursor(n.cursor)) || typeof n.type !== 'string' || !record(n.payload) ||
    typeof n.createdAt !== 'string' || !Number.isFinite(Date.parse(n.createdAt)) || !(n.readAt === null || typeof n.readAt === 'string' && Number.isFinite(Date.parse(n.readAt))))) {
    throw new ApiError('invalid_response', 'Notifications could not be loaded. Please retry.');
  }
  return value as NotificationPage;
}
export function notificationApi(client: ReturnType<typeof createApiClient>) {
  return {
    async list(query: { after?: string; before?: string; afterCursor?: string } = {}, signal?: AbortSignal) {
      const params = new URLSearchParams({cursorVersion:'2',...query});
      if(query.before){params.delete('before');params.set('beforeCursor',query.before);}
      return parseNotifications(await client.request(`/v0/me/notifications${params.size ? `?${params}` : ''}`, { signal }));
    },
    async get(id: string) {
      const notification = await client.request(`/v0/me/notifications/${id}`);
      return parseNotifications({notifications:[notification],nextCursor:null,hasMore:false}).notifications[0]!;
    },
    async read(id: string, signal?: AbortSignal) { await client.request(`/v0/me/notifications/${id}/read`, { method: 'POST', signal }); },
  };
}
export function relativeNotificationTime(at: string, now = Date.now()) {
  const seconds = Math.max(0, (now - Date.parse(at)) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 172800) return `${Math.floor(seconds / 3600)} hrs ago`;
  if (seconds < 30 * 86400) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
export function homeNotification(n: InboxNotification): HomeNotification {
  const name = typeof n.payload.username === 'string' ? `@${n.payload.username}` : typeof n.payload.displayName === 'string' ? n.payload.displayName : 'A Crew member';
  const vault = typeof n.payload.vaultName === 'string' ? n.payload.vaultName : 'your vault';
  const amount = typeof n.payload.amountUsdc === 'string' && /^\d+(\.\d+)?$/.test(n.payload.amountUsdc)
    ? Number(n.payload.amountUsdc).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : null;
  if (n.type === 'wallet_received') {
    const token = n.payload.token === 'USDC' ? 'USDC' : 'SOL';
    const decimals = token === 'SOL' ? 9 : 6;
    const raw = typeof n.payload.amountAtomic === 'string' && /^\d{1,40}$/.test(n.payload.amountAtomic) ? n.payload.amountAtomic.padStart(decimals + 1, '0') : null;
    const amount = raw ? `${raw.slice(0, -decimals)}.${raw.slice(-decimals)}`.replace(/\.?0+$/, '') : null;
    return { id:n.id,icon:'wallet',title:'Added to your wallet',copy:`${amount ? `${amount} ` : ''}${token} received${n.payload.network === 'devnet' ? ' on devnet' : ''}`,
      privateCopy:`${token} received in your wallet${n.payload.network === 'devnet' ? ' on devnet' : ''}`, time:relativeNotificationTime(n.createdAt),createdAt:n.createdAt,unread:n.readAt===null };
  }
  const investment = n.type === 'vault_contributed';
  if (n.type === 'crew_joined') return {
    id: n.id, icon: 'crew', title: 'Welcome aboard', copy: `${name} joined your fleet`,
    time: relativeNotificationTime(n.createdAt), createdAt: n.createdAt, vaultId: n.fundId ?? undefined, unread: n.readAt === null,
  };
  const titles: Record<string, string> = { order_submitted: 'Order submitted', order_filled: 'Order filled', order_rejected: 'Order rejected', order_cancelled: 'Order cancelled', drawdown_breaker: 'Risk limit reached', fee_assessed: 'Performance fee assessed', trial_completed: 'Round completed', policy_changed: 'Vault policy updated', trade_note_posted: 'A new Captain update' };
  return { id: n.id, icon: investment ? 'allocation' : 'captain', title: investment ? 'New vault investment' : titles[n.type] ?? 'Vault update',
    copy: investment ? `${name} invested ${amount ? `$${amount} USDC` : 'USDC'} in ${vault}.` : `An update is available for ${vault}.`,
    privateCopy: investment ? `${name} invested in ${vault}.` : undefined,
    time: relativeNotificationTime(n.createdAt), createdAt: n.createdAt, vaultId: n.fundId ?? undefined, unread: n.readAt === null };
}
