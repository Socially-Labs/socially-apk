import { ProfileAvatar } from '@/components/settings/profile-avatar';
import type { ProfileAvatarKind } from '@/components/settings/settings-provider';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { Dashboard, DiscoverPalette, NotificationPalette as N } from '@/constants/theme';
import type { SharedValue } from 'react-native-reanimated';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NotificationAnchor } from './notification-popover';
import { NotificationBellIcon, useNotificationBellProgress } from './notification-bell-icon';

export function HomeHeader({ name, avatar, photoUri, fallbackId, greeting, role = 'crew', onProfile, onNotifications, unreadCount, notificationsOpen, notificationProgress }: {
  name: string; avatar: ProfileAvatarKind; photoUri?: string | null; fallbackId: number; greeting: string; onProfile: () => void;
  onNotifications: (anchor: NotificationAnchor | null) => void; unreadCount: number; notificationsOpen: boolean; notificationProgress?: SharedValue<number>;
  role?: 'crew' | 'captain';
}) {
  const bell = useRef<View>(null);
  const localProgress = useNotificationBellProgress(notificationsOpen);
  const copy = role === 'captain'
    ? { hello: `Hello, ${greeting}`, subtitle: 'Your fleet at a glance' }
    : { hello: `Hey, ${greeting}`, subtitle: 'Where your money sails' };
  function openNotifications() {
    // Window coordinates place the native Modal under the bell even after Home
    // has scrolled. Keep a native view here so Fabric can measure this anchor.
    bell.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) onNotifications({ x, y, width, height });
    });
  }
  return (
    <View style={styles.header}>
      <AuthButton accessibilityRole="button" accessibilityLabel="Open your profile" onPress={onProfile} style={styles.avatar}>
        <ProfileAvatar name={name} avatar={avatar} photoUri={photoUri} fallbackId={fallbackId} size={47} />
      </AuthButton>
      <View style={styles.greeting}>
        <Text style={styles.hello} accessibilityRole="header">{copy.hello}</Text>
        <Text style={[styles.subtitle, { color: DiscoverPalette.secondary }]}>{copy.subtitle}</Text>
      </View>
      <View ref={bell} collapsable={false} onLayout={() => { if (notificationsOpen) openNotifications(); }}>
        <AuthButton testID="home-notifications" accessibilityRole="button" accessibilityLabel={notificationsOpen ? 'Close notifications' : `Notifications, ${unreadCount} unread updates`}
          accessibilityState={{ expanded: notificationsOpen }} aria-expanded={notificationsOpen} onPress={() => notificationsOpen ? onNotifications(null) : openNotifications()}
          style={[styles.notification, notificationsOpen && styles.notificationSelected]}>
          <NotificationBellIcon progress={notificationProgress ?? localProgress} open={notificationsOpen} />
          {unreadCount > 0 && !notificationsOpen ? <View style={styles.notificationDot} testID="home-notification-dot" /> : null}
        </AuthButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingHorizontal: 3 },
  avatar: { width: 47, height: 47, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(215,223,236,0.72)' },
  greeting: { flex: 1, marginLeft: 11, gap: 3 },
  hello: { fontFamily: InterFont.semiBold, fontSize: 18, lineHeight: 23, color: Dashboard.ink },
  subtitle: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 17, color: Dashboard.secondary },
  notification: { width: 44, height: 44, borderRadius: 22, backgroundColor: Dashboard.softGlass, alignItems: 'center', justifyContent: 'center' },
  notificationSelected: { backgroundColor: N.bellSelected },
  notificationDot: { position: 'absolute', right: 10, top: 10, width: 7, height: 7, backgroundColor: Dashboard.negative, borderRadius: 4, borderWidth: 1.5, borderColor: '#FFFFFF' },
});
