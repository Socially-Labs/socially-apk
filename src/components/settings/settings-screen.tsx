import Constants from 'expo-constants';
import { router } from 'expo-router';
import { BookOpen, ChartNoAxesColumn, ChevronRight, FileText, Gift, LifeBuoy, LogOut, Pencil, ShieldCheck, Users, Info, type LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useAuth } from '@/auth/session';
import { useTestAccess } from '@/auth/test-access';
import { DashboardShell } from '@/components/shared/dashboard/dashboard-shell';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { SettingsPalette as S } from '@/constants/theme';
import { ProfileAvatar } from './profile-avatar';
import { useAccountSettings } from './settings-provider';
import { LogoutSheet } from './settings-logout';

export const appVersion = Constants.expoConfig?.version ?? '1.0.0';

function SettingsRow({ icon: Icon, title, subtitle, section, last = false }: {
  icon: LucideIcon; title: string; subtitle?: string; section: string; last?: boolean;
}) {
  return <AuthButton accessibilityRole="button" accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
    testID={`settings-${section}`} onPress={() => router.push({ pathname: '/account/[section]', params: { section } })} style={styles.row}>
    <View style={styles.icon}><Icon size={21} color={S.ink} strokeWidth={1.7} /></View>
    <View style={[styles.rowBody, !last && styles.rowBorder]}>
      <View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text>{subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}</View>
      <ChevronRight size={20} color={S.secondary} strokeWidth={1.7} />
    </View>
  </AuthButton>;
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.group}>
    <Text style={styles.section} accessibilityRole="header">{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>;
}

export default function SettingsScreen() {
  const { email, isAuthenticated } = useAuth();
  const { hasTestAccess } = useTestAccess();
  const { settings, ready, error } = useAccountSettings();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { height } = useWindowDimensions();
  const previewing = hasTestAccess && !isAuthenticated;

  return <DashboardShell testID="settings-dashboard">
    <View style={[styles.heading, { marginTop: Math.min(46, height * 0.055) }]}>
      <Text style={styles.title} accessibilityRole="header">Settings</Text>
      <Text style={styles.copy}>Manage your account and preferences</Text>
    </View>
    <AuthButton accessibilityRole="button" accessibilityLabel="Edit profile" disabled={!ready}
      testID="settings-profile" onPress={() => router.push({ pathname: '/account/[section]', params: { section: 'profile' } })} style={styles.profile}>
      <View style={styles.avatarWrap}>
        <ProfileAvatar name={settings.name} avatar={settings.avatar} />
        <View style={styles.editBadge}><Pencil size={13} color={S.ink} strokeWidth={1.8} /></View>
      </View>
      <View style={styles.profileCopy}>
        <Text style={styles.name} numberOfLines={2}>{settings.name}</Text>
        <Text style={styles.email} numberOfLines={1}>{email ?? (previewing ? 'Preview account' : 'Social account')}</Text>
        <View style={styles.badge}><Users size={13} color={S.accent} strokeWidth={1.8} /><Text style={styles.badgeText}>Crew Member</Text></View>
      </View>
      <ChevronRight size={22} color={S.ink} strokeWidth={1.7} />
    </AuthButton>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <SettingsGroup title="Preferences">
      <SettingsRow icon={ChartNoAxesColumn} title="Display" subtitle="Balance visibility and appearance" section="display" last />
    </SettingsGroup>
    <SettingsGroup title="Your community">
      <SettingsRow icon={Gift} title="Refer a friend" subtitle="Invite someone aboard" section="referral" />
      <SettingsRow icon={LifeBuoy} title="Help & support" subtitle="We’re here to help" section="support" last />
    </SettingsGroup>
    <SettingsGroup title="Legal & about">
      <SettingsRow icon={FileText} title="Terms of Service" section="terms" />
      <SettingsRow icon={ShieldCheck} title="Privacy Policy" section="privacy" />
      <SettingsRow icon={Info} title="About Socially" subtitle={`Version ${appVersion}`} section="about" last />
    </SettingsGroup>
    <AuthButton testID="settings-sign-out" accessibilityRole="button" onPress={() => setLogoutOpen(true)} style={styles.logout}>
      <LogOut size={20} color={S.danger} strokeWidth={1.8} /><Text style={styles.logoutText}>{previewing ? 'Back to sign in' : 'Log out'}</Text>
    </AuthButton>
    <View style={styles.footer}><BookOpen size={12} color={S.secondary} /><Text style={styles.footerText}>Your next chapter starts here.</Text></View>
    <LogoutSheet visible={logoutOpen} onClose={() => setLogoutOpen(false)} />
  </DashboardShell>;
}

const styles = StyleSheet.create({
  heading: { paddingHorizontal: 7, marginBottom: 26 },
  title: { fontFamily: InterFont.semiBold, fontSize: S.titleSize, lineHeight: 36, letterSpacing: -0.8, color: S.ink },
  copy: { fontFamily: InterFont.regular, fontSize: S.bodySize, lineHeight: 19, color: S.secondary, marginTop: 7 },
  profile: { borderRadius: S.cardRadius, backgroundColor: S.surface, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 120 },
  avatarWrap: { position: 'relative' },
  editBadge: { position: 'absolute', bottom: 0, right: -1, width: 25, height: 25, borderRadius: 13, backgroundColor: S.field, alignItems: 'center', justifyContent: 'center' },
  profileCopy: { flex: 1, gap: 5 },
  name: { fontFamily: InterFont.semiBold, fontSize: 18, lineHeight: 24, color: S.ink },
  email: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 17, color: S.secondary },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 15, backgroundColor: S.badge, marginTop: 3 },
  badgeText: { fontFamily: InterFont.medium, fontSize: 11, lineHeight: 15, color: S.accent },
  group: { marginTop: 23 },
  section: { fontFamily: InterFont.medium, fontSize: 12, lineHeight: 17, color: S.secondary, marginLeft: 7, marginBottom: 9 },
  card: { borderRadius: S.cardRadius, backgroundColor: S.surface, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 72 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: S.iconWell, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, paddingRight: 3 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: S.line },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: InterFont.medium, fontSize: S.rowTitleSize, lineHeight: 21, color: S.ink },
  rowSubtitle: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 17, color: S.secondary },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 54, marginTop: 24, borderRadius: 20, backgroundColor: S.surface },
  logoutText: { fontFamily: InterFont.medium, fontSize: 14, color: S.danger },
  error: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 19, color: S.danger, marginTop: 12 },
  footer: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, marginTop: 19 },
  footerText: { fontFamily: InterFont.regular, fontSize: 10, lineHeight: 15, color: S.secondary },
});
