import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { SettingsPalette as S } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { About } from './about-section';
import { AccountSection } from './account-section';
import { SettingsSurface } from './settings-surface';
import { DisplayPreferences } from './display-preferences';
import { Policy } from './policy-section';
import { ProfileEditor } from './profile-editor';
import { Referral } from './referral-section';
import { titles } from './settings-detail-config';
import { sharedStyles } from './settings-detail-styles';
import { Action, Card } from './settings-detail-ui';
import { SettingsLoading } from './settings-loading';
import { useAccountSettings } from './settings-provider';
import { Support } from './support-section';
import { NetworkPreferences } from './network-preferences';

export default function SettingsDetailScreen() {
  const { section: param } = useLocalSearchParams<{ section: string }>();
  const section = typeof param === 'string' ? param : '';
  const { ready } = useAccountSettings();
  function goBack() { Keyboard.dismiss(); if (router.canGoBack()) router.back(); else router.replace('/settings'); }
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <SettingsSurface testID={`settings-detail-${section}`} keyboardAvoided>
      <View style={styles.header}><AuthButton accessibilityRole="button" accessibilityLabel="Back to Settings" onPress={goBack} style={styles.back}><ArrowLeft size={22} color={S.ink} /></AuthButton><Text accessibilityRole="header" style={styles.title}>{titles[section] ?? 'Settings'}</Text></View>
      {!ready && (section === 'profile' || section === 'display' || section === 'account') ? <SettingsLoading profile={section === 'profile'} /> :
        section === 'network' ? <NetworkPreferences /> : section === 'profile' ? <ProfileEditor /> : section === 'account' ? <AccountSection /> : section === 'display' ? <DisplayPreferences /> : section === 'referral' ? <Referral /> : section === 'support' ? <Support /> : section === 'terms' || section === 'privacy' ? <Policy kind={section} /> : section === 'about' ? <About /> : <Card><Text style={styles.copy}>This settings page isn’t available.</Text><Action label="Back to Settings" onPress={goBack} /></Card>}
    </SettingsSurface>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  ...sharedStyles,
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 26 },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: S.surface },
  title: { flex: 1, fontFamily: InterFont.semiBold, fontSize: 23, lineHeight: 31, color: S.ink, letterSpacing: -0.6 },
});
