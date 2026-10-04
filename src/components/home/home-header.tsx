import { ProfileAvatar } from '@/components/settings/profile-avatar';
import type { ProfileAvatarKind } from '@/components/settings/settings-provider';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { Dashboard } from '@/constants/theme';
import { Bell } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

export function HomeHeader({ name, avatar, photoUri, greeting, onProfile, onNotifications }: {
  name: string; avatar: ProfileAvatarKind; photoUri?: string | null; greeting: string; onProfile: () => void; onNotifications: () => void;
}) {
  return (
    <View style={styles.header}>
      <AuthButton accessibilityRole="button" accessibilityLabel="Open your profile" onPress={onProfile} style={styles.avatar}>
        <ProfileAvatar name={name} avatar={avatar} photoUri={photoUri} size={47} />
      </AuthButton>
      <View style={styles.greeting}>
        <Text style={styles.hello} accessibilityRole="header">Hello, {greeting}</Text>
        <Text style={styles.subtitle}>Captain mode active.</Text>
      </View>
      <AuthButton testID="home-notifications" accessibilityRole="button" accessibilityLabel="Notifications, unread update"
        onPress={onNotifications} style={styles.notification}>
        <Bell size={21} color={Dashboard.ink} strokeWidth={1.7} />
        <View style={styles.notificationDot} />
      </AuthButton>
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
  notificationDot: { position: 'absolute', right: 10, top: 10, width: 7, height: 7, backgroundColor: Dashboard.negative, borderRadius: 4, borderWidth: 1.5, borderColor: '#FFFFFF' },
});
