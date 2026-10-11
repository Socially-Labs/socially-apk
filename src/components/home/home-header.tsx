import { ProfileAvatar } from '@/components/settings/profile-avatar';
import type { ProfileAvatarKind } from '@/components/settings/settings-provider';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { Dashboard, DiscoverPalette, NotificationPalette as N } from '@/constants/theme';
import { Bell } from 'lucide-react-native';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NotificationAnchor } from './notification-popover';

export function HomeHeader({ name, avatar, photoUri, fallbackId, greeting, role = 'crew', onProfile, onNotifications, unreadCount, notificationsOpen }: {
  name: string; avatar: ProfileAvatarKind; photoUri?: string | null; fallbackId: number; greeting: string; onProfile: () => void;
  onNotifications: (anchor: NotificationAnchor) => void; unreadCount: number; notificationsOpen: boolean;
  role?: 'crew' | 'captain';
}) {
  const bell = useRef<View>(null);
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
        <Text style={styles.hello} accessibilityRole="header">Hello, {greeting}</Text>
        <Text style={[styles.subtitle, { color: DiscoverPalette.secondary }]}>{role === 'captain' ? 'Your Captain dashboard' : 'Your Crew portfolio'}</Text>
      </View>
      <View ref={bell} collapsable={false} onLayout={() => { if (notificationsOpen) openNotifications(); }}>
        <AuthButton testID="home-notifications" accessibilityRole="button" accessibilityLabel={`Notifications, ${unreadCount} unread updates`}
          accessibilityState={{ expanded: notificationsOpen }} aria-expanded={notificationsOpen} onPress={openNotifications}
          style={[styles.notification, notificationsOpen && styles.notificationSelected]}>
          <Bell size={21} color={Dashboard.ink} strokeWidth={1.7} />
          {unreadCount > 0 ? <View style={styles.notificationDot} testID="home-notification-dot" /> : null}
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
