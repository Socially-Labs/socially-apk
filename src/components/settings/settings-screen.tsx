import { router } from 'expo-router';
import { ChevronRight, FileText, HeartHandshake, Info, LockKeyhole, LogOut, Monitor, Pencil, UserRound, UserRoundPlus, type LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { SettingsPalette as S } from '@/constants/theme';
import { ProfileAvatar } from './profile-avatar';
import { ProfileBanner } from './profile-banner';
import { appVersion } from './settings-detail-config';
import { useAccountSettings } from './settings-provider';
import { SettingsSurface } from './settings-surface';
import { LogoutSheet } from './settings-logout';

export { appVersion } from './settings-detail-config';
function openSection(section: string) { router.push({ pathname: '/account/[section]', params: { section } }); }
function SettingsRow({ icon: Icon, title, subtitle, section, last = false }: {
  icon: LucideIcon; title: string; subtitle?: string; section: string; last?: boolean;
}) {
  return <AuthButton accessibilityRole="button" accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
    testID={`settings-${section}`} onPress={() => openSection(section)} style={styles.row}>
    <View style={styles.icon}><Icon size={20} color={S.accent} strokeWidth={1.7} /></View>
    <View style={[styles.rowBody, !last && styles.rowBorder]}>
      <View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text>{subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}</View>
      <ChevronRight size={17} color={S.secondary} strokeWidth={1.7} />
    </View>
  </AuthButton>;
}
function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.group}><Text style={styles.section} accessibilityRole="header">{title}</Text><View style={styles.card}>{children}</View></View>;
}
export default function SettingsScreen() {
  const { settings, ready, error } = useAccountSettings();
  const [logoutOpen, setLogoutOpen] = useState(false);
  return <SettingsSurface testID="settings-dashboard">
    <View style={styles.heading}>
      <View style={styles.headingCopy}><Text style={styles.title} accessibilityRole="header">Make it yours.</Text><Text style={styles.copy}>Your profile, your preferences.</Text></View>
      <AuthButton testID="settings-header-logout" accessibilityRole="button" accessibilityLabel="Log out"
        accessibilityHint="Opens a confirmation before signing out" onPress={() => setLogoutOpen(true)} style={styles.logoutButton}>
        <LogOut size={21} color={S.danger} strokeWidth={1.7} />
      </AuthButton>
    </View>
    <View style={styles.profile}>
      <ProfileBanner uri={settings.bannerUri} />
      <View style={styles.profileBody}>
        <View style={styles.profileTop}>
          <View style={styles.avatarRing}><ProfileAvatar name={settings.name} avatar={settings.avatar} photoUri={settings.photoUri} size={68} /></View>
          <AuthButton testID="settings-profile" accessibilityRole="button" accessibilityLabel="Edit profile" accessibilityState={{ disabled: !ready }}
            disabled={!ready} onPress={() => openSection('profile')} style={styles.editProfile}>
            <Pencil size={13} color={S.accent} /><Text style={styles.editText}>Edit profile</Text>
          </AuthButton>
        </View>
        <Text style={styles.name} numberOfLines={2}>{settings.name}</Text>
        <Text style={styles.username} testID="settings-username">@{settings.username}</Text>
        {settings.bio ? <Text style={styles.bio} numberOfLines={2}>{settings.bio}</Text> : null}
      </View>
    </View>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <SettingsGroup title="Account & preferences">
      <SettingsRow icon={UserRound} title="Account" subtitle="Profile, username & sign-in" section="account" />
      <SettingsRow icon={Monitor} title="Display" subtitle="Balance visibility & appearance" section="display" last />
    </SettingsGroup>
    <SettingsGroup title="From one crew to another">
      <SettingsRow icon={UserRoundPlus} title="Invite a friend" subtitle="Good company. A shared horizon." section="referral" />
      <SettingsRow icon={HeartHandshake} title="Help & support" subtitle="A little help when you need it" section="support" last />
    </SettingsGroup>
    <View style={styles.about}>
      <AuthButton testID="settings-about" accessibilityRole="button" onPress={() => openSection('about')} style={styles.aboutLink}>
        <Info size={16} color={S.secondary} /><Text style={styles.footerText}>About Socially</Text><ChevronRight size={14} color={S.secondary} />
      </AuthButton>
      <View style={styles.legal}>
        <AuthButton testID="settings-terms" accessibilityRole="button" accessibilityLabel="Terms of Service" onPress={() => openSection('terms')} style={styles.legalLink}><FileText size={13} color={S.secondary} /><Text style={styles.legalText}>Terms</Text></AuthButton>
        <Text style={styles.legalText}>·</Text>
        <AuthButton testID="settings-privacy" accessibilityRole="button" accessibilityLabel="Privacy Policy" onPress={() => openSection('privacy')} style={styles.legalLink}><LockKeyhole size={13} color={S.secondary} /><Text style={styles.legalText}>Privacy</Text></AuthButton>
        <Text style={styles.version}>v{appVersion}</Text>
      </View>
    </View>
    <LogoutSheet visible={logoutOpen} onClose={() => setLogoutOpen(false)} />
  </SettingsSurface>;
}
const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  headingCopy: { flex: 1 },
  logoutButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: S.dangerTint, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: InterFont.semiBold, fontSize: S.titleSize, lineHeight: 36, letterSpacing: -1, color: S.ink },
  copy: { fontFamily: InterFont.regular, fontSize: S.bodySize, lineHeight: 20, color: S.secondary, marginTop: 5 },
  profile: { borderRadius: S.cardRadius, backgroundColor: S.solidSurface, overflow: 'hidden', borderWidth: 1, borderColor: S.border, boxShadow: S.shadow },
  profileBody: { paddingHorizontal: 20, paddingBottom: 20 },
  profileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: -29, marginBottom: 8 },
  avatarRing: { padding: 4, borderRadius: 40, backgroundColor: S.solidSurface },
  editProfile: { minHeight: 44, marginTop: 26, borderRadius: 22, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: S.iconWell },
  editText: { fontFamily: InterFont.medium, fontSize: 11, color: S.accent },
  name: { fontFamily: InterFont.semiBold, fontSize: 22, lineHeight: 28, letterSpacing: -0.6, color: S.ink },
  username: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 19, color: S.secondary, marginTop: 3 },
  bio: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 19, color: S.secondary, marginTop: 8 },
  group: { marginTop: 24 },
  section: { fontFamily: InterFont.medium, fontSize: 12, lineHeight: 17, color: S.secondary, marginLeft: 4, marginBottom: 10 },
  card: { borderRadius: 22, backgroundColor: S.solidSurface, paddingHorizontal: 14, borderWidth: 1, borderColor: S.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72 },
  icon: { width: 38, height: 38, borderRadius: 14, backgroundColor: S.iconWell, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: S.line },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: InterFont.medium, fontSize: S.rowTitleSize, lineHeight: 21, color: S.ink },
  rowSubtitle: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: S.secondary },
  about: { alignItems: 'center', marginTop: 20 },
  aboutLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7 },
  footerText: { fontFamily: InterFont.medium, fontSize: 12, color: S.secondary },
  legal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' },
  legalLink: { flexDirection: 'row', minHeight: 44, alignItems: 'center', gap: 5 },
  legalText: { fontFamily: InterFont.regular, fontSize: 11, color: S.secondary },
  version: { fontFamily: InterFont.regular, fontSize: 11, color: S.secondary, marginLeft: 4 },
  error: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 19, color: S.danger, marginTop: 12 },
});
