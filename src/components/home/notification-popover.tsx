import { useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDown, ChevronRight, Clock3, Compass, List, Users, Wallet } from 'lucide-react-native';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/shared/motion';
import type { HomeNotification } from '@/constants/home-notifications';
import { BrandFont, InterFont } from '@/constants/fonts';
import { Motion } from '@/constants/motion';
import { NotificationPalette as N } from '@/constants/theme';
import { NotificationBellIcon, useNotificationBellProgress } from './notification-bell-icon';
import { notificationPosition, type NotificationAnchor } from './notification-position';
import { CardSkeleton } from '@/components/shared/refresh/card-skeleton';

type InboxStatus = { status?: 'idle' | 'loading' | 'success' | 'error'; loading?: boolean; error?: string | null; hasMore?: boolean; onLoadMore?: () => void; onRetry?: () => void };
export type { NotificationAnchor } from './notification-position';

export function NotificationPopover({ anchor, bellProgress, notifications, readIds, hidden, onRead, onReadAll, onClose, onExitRequests, ...status }: {
  anchor: NotificationAnchor | null; notifications: readonly HomeNotification[]; readIds: ReadonlySet<string>; hidden: boolean;
  bellProgress?: SharedValue<number>;
  onRead: (id: string) => void; onReadAll: () => void; onClose: () => void; onExitRequests: (id: string) => void;
} & InboxStatus) {
  const pendingExit = useRef<string | null>(null);
  const localBellProgress = useNotificationBellProgress(anchor !== null);
  function openExitRequests(id: string) {
    // iOS must finish dismissing this native modal before presenting the vault
    // sheet. Android and web can switch their modal windows immediately.
    if (Platform.OS === 'ios') pendingExit.current = id;
    onClose();
    if (Platform.OS !== 'ios') onExitRequests(id);
  }
  return <Modal visible={anchor !== null} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}
    onDismiss={() => {
      const id = pendingExit.current;
      pendingExit.current = null;
      if (id) onExitRequests(id);
    }}>
    {anchor ? <PopoverPanel anchor={anchor} bellProgress={bellProgress ?? localBellProgress} notifications={notifications} readIds={readIds} hidden={hidden}
      onRead={onRead} onReadAll={onReadAll} onClose={onClose} onExitRequests={openExitRequests} {...status} /> : null}
  </Modal>;
}

function PopoverPanel({ anchor, bellProgress, notifications, readIds, hidden, onRead, onReadAll, onClose, onExitRequests, ...status }: {
  anchor: NotificationAnchor; notifications: readonly HomeNotification[]; readIds: ReadonlySet<string>; hidden: boolean;
  bellProgress: SharedValue<number>;
  onRead: (id: string) => void; onReadAll: () => void; onClose: () => void; onExitRequests: (id: string) => void;
} & InboxStatus) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { width, height } = useWindowDimensions();
  const [viewport, setViewport] = useState({ width, height });
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  const unreadCount = notifications.filter(item => item.unread && !readIds.has(item.id)).length;
  const { left, top, panelWidth, maxHeight, pointerLeft, showPointer } = notificationPosition(anchor, viewport.width, viewport.height, insets, N);

  useEffect(() => {
    progress.set(reduceMotion ? 1 : withTiming(1, { duration: Motion.reveal }));
    return () => cancelAnimation(progress);
  }, [progress, reduceMotion]);
  const animated = useAnimatedStyle(() => ({ opacity: progress.get(), transform: [{ translateY: reduceMotion ? 0 : (1 - progress.get()) * -6 }] }));

  return <View style={styles.overlay} testID="notification-overlay" onLayout={({ nativeEvent: { layout } }) => {
    setViewport(current => current.width === layout.width && current.height === layout.height
      ? current : { width: layout.width, height: layout.height });
  }}>
    <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} accessibilityRole="button" accessibilityLabel="Close notifications"
      testID="notification-dismiss" onPress={onClose} />
    <Animated.View style={[styles.position, { left, top, width: panelWidth }, animated]} accessibilityViewIsModal
      onAccessibilityEscape={onClose} testID="notification-popover">
      {showPointer ? <View style={[styles.pointer, { left: pointerLeft }]} pointerEvents="none" testID="notification-pointer" /> : null}
      <View style={[styles.panel, { maxHeight }]}>
        <LinearGradient colors={N.surface} style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false} />
        <View style={styles.heading}>
          <View style={styles.headingText}>
            <Text accessibilityRole="header" style={[styles.title, width < 360 && styles.compactTitle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Notifications</Text>
          </View>
          <AuthButton accessibilityRole="button" accessibilityLabel="Close notifications" onPress={onClose} testID="notification-bell-close" style={styles.close}>
            <NotificationBellIcon progress={bellProgress} open />
          </AuthButton>
        </View>
        <View style={styles.subheading}>
          <View style={styles.captionGroup}><Text style={styles.caption}>Your vault activity</Text>
            <View style={styles.badge} testID="notification-unread-count">
              <Text style={styles.badgeText} accessibilityLiveRegion="polite">{unreadCount > 0 ? `${unreadCount} new` : status.loading && !notifications.length ? 'Loading…' : status.error ? 'Unavailable' : 'All read'}</Text>
            </View>
          </View>
          <AuthButton accessibilityRole="button" accessibilityLabel="Mark all notifications as read" disabled={unreadCount === 0} onPress={onReadAll} style={styles.readAll} testID="notification-read-all">
            <Text style={[styles.readAllText, unreadCount === 0 && styles.disabledText]}>Mark all read</Text>
          </AuthButton>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list} bounces={false} nestedScrollEnabled
          showsVerticalScrollIndicator keyboardShouldPersistTaps="handled" testID="notification-list">
          {status.error ? <View style={styles.status}><Text accessibilityRole="alert" style={styles.copy}>{status.error}</Text><AuthButton accessibilityRole="button" onPress={status.onRetry} style={styles.readAll}><Text style={styles.readAllText}>Retry notifications</Text></AuthButton></View> : null}
          {!notifications.length && !status.error ? <View style={styles.status}>{status.loading || status.status === 'idle' || status.status === 'loading' ? <CardSkeleton compact label="Loading notifications…" count={2} /> : (status.status ?? 'success') === 'success' ? <Text style={styles.copy}>You’re all caught up. Vault updates will appear here.</Text> : null}</View> : null}
          {notifications.map((item, index) => {
            const unread = !!item.unread && !readIds.has(item.id);
            const copy = hidden && item.privateCopy ? item.privateCopy : item.copy;
            return <AuthButton key={item.id} testID={`notification-${item.id}`} accessibilityRole="button"
              accessibilityLabel={`${unread ? 'Unread. ' : ''}${item.title}. ${copy} ${item.time}.`}
              accessibilityHint={item.exitVaultId ? 'Review exit requests' : unread ? 'Mark this notification as read' : undefined}
              onPress={() => {
                onRead(item.id);
                setExpandedId(current => current === item.id ? null : item.id);
                if (item.exitVaultId) onExitRequests(item.exitVaultId);
              }} style={[styles.row, index > 0 && styles.divider, !!item.exitVaultId && styles.actionRow]}>
              <View style={[styles.icon, item.icon === 'allocation' && styles.positiveIcon, item.icon === 'exit' && styles.riskIcon]}>
                <NotificationIcon kind={item.icon} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, !unread && styles.readTitle]}>{item.title}</Text>
                <Text style={styles.copy}>{copy}</Text>
                <Text style={styles.time}>{item.time}</Text>
                {item.exitVaultId ? <View style={styles.review}><Text style={styles.reviewText}>Review requests</Text><ChevronRight size={14} color={N.risk} /></View> : null}
                {expandedId === item.id && item.createdAt ? <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text> : null}
              </View>
              <View style={styles.indicators}>
                {unread ? <View style={styles.unread} testID={`notification-unread-${item.id}`} /> : null}
              </View>
            </AuthButton>;
          })}
        </ScrollView>
        {status.hasMore ? <AuthButton disabled={status.loading} accessibilityRole="button" accessibilityLabel="Load older notifications" onPress={status.onLoadMore} style={styles.footer} testID="notification-load-more"><List size={20} color={N.ink} /><Text style={styles.footerText}>{status.loading ? 'Loading…' : 'View older activity'}</Text><ChevronRight size={18} color={N.ink} /></AuthButton> : null}
      </View>
    </Animated.View>
  </View>;
}

function NotificationIcon({ kind }: { kind: HomeNotification['icon'] }) {
  if (kind === 'captain') return <Image source={require('@/assets/images/splash-icon.png')} style={styles.captain} contentFit="contain" transition={0} />;
  const Icon = kind === 'allocation' ? ArrowDown : kind === 'wallet' ? Wallet : kind === 'crew' ? Users : kind === 'exit' ? Clock3 : Compass;
  return <Icon size={21} strokeWidth={1.7} color={kind === 'allocation' ? N.positive : kind === 'exit' ? N.risk : N.icon} />;
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  backdrop: { backgroundColor: N.backdrop },
  position: { position: 'absolute', boxShadow: N.shadow, borderRadius: N.radius },
  pointer: { position: 'absolute', top: -8, width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 9,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: N.pointer },
  panel: { borderRadius: N.radius, overflow: 'hidden', borderWidth: 1, borderColor: N.border },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, paddingRight: 12, paddingTop: 12 },
  headingText: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontFamily: BrandFont.editorial, fontSize: 32, lineHeight: 38, color: N.ink },
  compactTitle: { fontSize: 27, lineHeight: 34 },
  caption: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 19, color: N.secondary, flexShrink: 1 },
  badge: { backgroundColor: N.positiveSurface, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontFamily: InterFont.semiBold, fontSize: 11, lineHeight: 16, color: N.positive },
  close: { width: 44, height: 44, flexShrink: 0, borderRadius: 22, backgroundColor: N.bellSelected, alignItems: 'center', justifyContent: 'center' },
  captionGroup: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  subheading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingLeft: 16, paddingRight: 16, paddingBottom: 4 },
  readAll: { minHeight: 44, justifyContent: 'center' },
  readAllText: { fontFamily: InterFont.medium, fontSize: 12, lineHeight: 18, color: N.action, textDecorationLine: 'underline' },
  disabledText: { color: N.secondary, textDecorationLine: 'none' },
  scroll: { flexShrink: 1, minHeight: 0 },
  list: { paddingBottom: 8 },
  status: { paddingHorizontal: 16, paddingVertical: 24 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, minHeight: 96 },
  divider: { borderTopWidth: 1, borderColor: N.line },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: N.iconSurface, alignItems: 'center', justifyContent: 'center' },
  positiveIcon: { backgroundColor: N.positiveSurface },
  riskIcon: { backgroundColor: N.riskSurface },
  actionRow: { backgroundColor: N.riskSurface, borderRadius: 18 },
  review: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 4, borderWidth: 1, borderColor: N.riskBorder, borderRadius: 14, paddingHorizontal: 10, minHeight: 36, marginTop: 4 },
  reviewText: { fontFamily: InterFont.semiBold, fontSize: 12, lineHeight: 18, color: N.risk },
  footer: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: N.line, paddingHorizontal: 20 },
  footerText: { flex: 1, fontFamily: InterFont.medium, fontSize: 13, lineHeight: 19, color: N.ink },
  captain: { width: 34, height: 34 },
  rowText: { flex: 1, minWidth: 0, gap: 4 },
  rowTitle: { fontFamily: InterFont.semiBold, fontSize: 14, lineHeight: 20, color: N.ink },
  readTitle: { fontFamily: InterFont.medium },
  copy: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 18, color: N.secondary },
  time: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: N.secondary },
  indicators: { width: 12, alignItems: 'center', gap: 14, paddingTop: 5 },
  unread: { width: 6, height: 6, borderRadius: 3, backgroundColor: N.unread },
});
