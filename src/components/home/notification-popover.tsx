import { useEffect, useRef } from 'react';
import { Image } from 'expo-image';
import { ArrowDown, CheckCircle2, ChevronRight, Clock3, Compass, Users, Wallet } from 'lucide-react-native';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetSurface, sheetMaterialStyle } from '@/components/shared/dashboard/sheet-surface';
import { AuthButton } from '@/components/shared/motion';
import type { HomeNotification } from '@/constants/home-notifications';
import { InterFont } from '@/constants/fonts';
import { Motion } from '@/constants/motion';
import { NotificationPalette as N } from '@/constants/theme';

export type NotificationAnchor = { x: number; y: number; width: number; height: number };

export function NotificationPopover({ anchor, notifications, readIds, hidden, onRead, onReadAll, onClose, onExitRequests }: {
  anchor: NotificationAnchor | null; notifications: readonly HomeNotification[]; readIds: ReadonlySet<string>; hidden: boolean;
  onRead: (id: string) => void; onReadAll: () => void; onClose: () => void; onExitRequests: (id: string) => void;
}) {
  const pendingExit = useRef<string | null>(null);
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
    {anchor ? <PopoverPanel anchor={anchor} notifications={notifications} readIds={readIds} hidden={hidden}
      onRead={onRead} onReadAll={onReadAll} onClose={onClose} onExitRequests={openExitRequests} /> : null}
  </Modal>;
}

function PopoverPanel({ anchor, notifications, readIds, hidden, onRead, onReadAll, onClose, onExitRequests }: {
  anchor: NotificationAnchor; notifications: readonly HomeNotification[]; readIds: ReadonlySet<string>; hidden: boolean;
  onRead: (id: string) => void; onReadAll: () => void; onClose: () => void; onExitRequests: (id: string) => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  const unreadCount = notifications.filter(item => item.unread && !readIds.has(item.id)).length;
  const leftInset = Math.max(N.inset, insets.left);
  const rightInset = Math.max(N.inset, insets.right);
  const panelWidth = Math.min(N.maxWidth, width - leftInset - rightInset);
  const left = Math.max(leftInset, Math.min(anchor.x + anchor.width - panelWidth, width - rightInset - panelWidth));
  const top = anchor.y + anchor.height + 12;
  // The header stays fixed while only the updates scroll, including in landscape
  // and with large system text. Never let the panel reach the home indicator.
  const maxHeight = Math.max(0, Math.min(N.maxHeight, height - top - Math.max(insets.bottom, N.inset)));
  const pointerLeft = Math.max(20, Math.min(panelWidth - 36, anchor.x + anchor.width / 2 - left - 8));

  useEffect(() => {
    progress.set(reduceMotion ? 1 : withTiming(1, { duration: Motion.reveal }));
    return () => cancelAnimation(progress);
  }, [progress, reduceMotion]);
  const animated = useAnimatedStyle(() => ({ opacity: progress.get(), transform: [{ translateY: reduceMotion ? 0 : (1 - progress.get()) * -6 }] }));

  return <View style={styles.overlay} testID="notification-overlay">
    <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} accessibilityRole="button" accessibilityLabel="Close notifications"
      testID="notification-dismiss" onPress={onClose} />
    <Animated.View style={[styles.position, { left, top, width: panelWidth }, animated]} accessibilityViewIsModal
      onAccessibilityEscape={onClose} testID="notification-popover">
      <View style={[styles.pointer, { left: pointerLeft }]} pointerEvents="none" testID="notification-pointer" />
      <View style={[styles.panel, sheetMaterialStyle, { maxHeight }]}>
        <SheetSurface />
        <View style={styles.heading}>
          <View style={styles.headingText}>
            <Text accessibilityRole="header" style={styles.title}>Notifications</Text>
            <Text style={styles.caption}>Sample updates</Text>
          </View>
          <View style={styles.badge} testID="notification-unread-count">
            <Text style={styles.badgeText} accessibilityLiveRegion="polite">{unreadCount > 0 ? `${unreadCount} new` : 'All read'}</Text>
          </View>
          <AuthButton accessibilityRole="button" accessibilityLabel="Mark all notifications as read" disabled={unreadCount === 0}
            onPress={onReadAll} style={styles.readAll} testID="notification-read-all">
            <CheckCircle2 size={22} strokeWidth={1.7} color={unreadCount > 0 ? N.secondary : N.positive} />
          </AuthButton>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list} bounces={false} nestedScrollEnabled
          showsVerticalScrollIndicator keyboardShouldPersistTaps="handled" testID="notification-list">
          {notifications.map((item, index) => {
            const unread = !!item.unread && !readIds.has(item.id);
            const copy = hidden && item.privateCopy ? item.privateCopy : item.copy;
            return <AuthButton key={item.id} testID={`notification-${item.id}`} accessibilityRole="button"
              accessibilityLabel={`${unread ? 'Unread. ' : ''}${item.title}. ${copy} ${item.time}.`}
              accessibilityHint={item.exitVaultId ? 'Review exit requests' : unread ? 'Mark this notification as read' : undefined}
              onPress={() => {
                onRead(item.id);
                if (item.exitVaultId) onExitRequests(item.exitVaultId);
              }} style={[styles.row, index > 0 && styles.divider]}>
              <View style={[styles.icon, item.icon === 'allocation' && styles.positiveIcon, item.icon === 'exit' && styles.riskIcon]}>
                <NotificationIcon kind={item.icon} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, !unread && styles.readTitle]}>{item.title}</Text>
                <Text style={styles.copy}>{copy}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <View style={styles.indicators}>
                {unread ? <View style={styles.unread} testID={`notification-unread-${item.id}`} /> : null}
                {item.exitVaultId ? <ChevronRight size={16} color={N.secondary} /> : null}
              </View>
            </AuthButton>;
          })}
        </ScrollView>
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
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, paddingRight: 8, paddingTop: 12, paddingBottom: 10 },
  headingText: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontFamily: InterFont.semiBold, fontSize: 17, lineHeight: 23, color: N.ink },
  caption: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 15, color: N.secondary },
  badge: { backgroundColor: N.positiveSurface, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontFamily: InterFont.semiBold, fontSize: 11, lineHeight: 16, color: N.positive },
  readAll: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  scroll: { flexShrink: 1, minHeight: 0 },
  list: { paddingHorizontal: 16, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 16, minHeight: 100 },
  divider: { borderTopWidth: 1, borderColor: N.line },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: N.iconSurface, alignItems: 'center', justifyContent: 'center' },
  positiveIcon: { backgroundColor: N.positiveSurface },
  riskIcon: { backgroundColor: N.riskSurface },
  captain: { width: 34, height: 34 },
  rowText: { flex: 1, minWidth: 0, gap: 4 },
  rowTitle: { fontFamily: InterFont.semiBold, fontSize: 14, lineHeight: 20, color: N.ink },
  readTitle: { fontFamily: InterFont.medium },
  copy: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 18, color: N.secondary },
  time: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: N.secondary },
  indicators: { width: 12, alignItems: 'center', gap: 14, paddingTop: 5 },
  unread: { width: 6, height: 6, borderRadius: 3, backgroundColor: N.unread },
});
