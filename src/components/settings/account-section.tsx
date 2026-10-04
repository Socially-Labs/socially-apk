import { router } from 'expo-router';
import { ChevronRight, LogOut, Mail, Pencil, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth/session';
import { useTestAccess } from '@/auth/test-access';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { SettingsPalette as S } from '@/constants/theme';
import { ProfileAvatar } from './profile-avatar';
import { Card } from './settings-detail-ui';
import { sharedStyles } from './settings-detail-styles';
import { LogoutSheet } from './settings-logout';
import { useAccountSettings } from './settings-provider';

export function AccountSection() {
  const { email, isAuthenticated } = useAuth();
  const { hasTestAccess } = useTestAccess();
  const { settings } = useAccountSettings();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const previewing = hasTestAccess && !isAuthenticated;
  return <>
    <Card>
      <View style={styles.identity}><ProfileAvatar name={settings.name} avatar={settings.avatar} photoUri={settings.photoUri} size={58} /><View style={styles.flex}><Text style={styles.name}>{settings.name}</Text><Text style={styles.copy}>@{settings.username}</Text></View></View>
      <View style={styles.divider} />
      <AuthButton testID="account-edit-profile" accessibilityRole="button" accessibilityLabel="Edit profile and username" onPress={() => router.push({ pathname: '/account/[section]', params: { section: 'profile' } })} style={styles.row}>
        <View style={styles.icon}><Pencil size={19} color={S.accent} /></View><View style={styles.flex}><Text style={styles.itemTitle}>Edit profile</Text><Text style={styles.note}>Username, photo & banner</Text></View><ChevronRight size={18} color={S.secondary} />
      </AuthButton>
    </Card>
    <Card>
      <View style={styles.sectionTitle}><ShieldCheck size={19} color={S.accent} /><Text style={styles.heading}>Sign-in & session</Text></View>
      <View style={styles.account}><Mail size={18} color={S.secondary} /><Text selectable style={styles.copy}>{email ?? (previewing ? 'Preview account' : 'Signed in with a social account')}</Text></View>
      <Text style={styles.note}>{previewing ? 'You’re exploring Socially in preview mode.' : 'Your sign-in details are managed by your login provider.'}</Text>
      <View style={styles.divider} />
      <AuthButton testID="settings-sign-out" accessibilityRole="button" accessibilityLabel={previewing ? 'Back to sign in' : 'Log out'} onPress={() => setLogoutOpen(true)} style={styles.row}>
        <View style={styles.logoutIcon}><LogOut size={19} color={S.danger} strokeWidth={1.7} /></View><View style={styles.flex}><Text style={styles.logoutText}>{previewing ? 'Back to sign in' : 'Log out'}</Text><Text style={styles.note}>{previewing ? 'Leave your preview session' : 'Sign out of this device'}</Text></View><ChevronRight size={18} color={S.secondary} />
      </AuthButton>
    </Card>
    <LogoutSheet visible={logoutOpen} onClose={() => setLogoutOpen(false)} />
  </>;
}
const styles = StyleSheet.create({
  ...sharedStyles,
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontFamily: InterFont.semiBold, fontSize: 20, lineHeight: 27, color: S.ink },
  heading: { fontFamily: InterFont.semiBold, fontSize: 16, lineHeight: 22, color: S.ink },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  row: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 14, backgroundColor: S.iconWell, justifyContent: 'center', alignItems: 'center' },
  logoutIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: S.dangerTint, justifyContent: 'center', alignItems: 'center' },
  logoutText: { fontFamily: InterFont.medium, fontSize: 15, lineHeight: 22, color: S.danger },
  account: { flexDirection: 'row', gap: 10, alignItems: 'center' },
});
