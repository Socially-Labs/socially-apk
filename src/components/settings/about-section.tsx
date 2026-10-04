import { policyUrls } from '@/auth/config';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont } from '@/constants/fonts';
import { SettingsPalette as S } from '@/constants/theme';
import { ExternalLink } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { ProfileAvatar } from './profile-avatar';
import { openSettingsLink } from './settings-actions';
import { appVersion } from './settings-detail-config';
import { sharedStyles } from './settings-detail-styles';
import { Card, ErrorCopy } from './settings-detail-ui';

export function About() {
  const [error, setError] = useState<string | null>(null);
  async function openSite() {
    try { await openSettingsLink(policyUrls.site); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The website couldn’t be opened.'); }
  }
  return <Card><View style={styles.aboutBrand}><ProfileAvatar name="Socially" avatar="captain" size={88} /><Text style={styles.wordmark}>SOCIALLY</Text></View>
    <Text style={styles.heroTitle}>Pick a Captain. Join the Crew.</Text><Text style={styles.copy}>Socially is designed for shared trading funds on Solana. Crew members own fund shares. Captains get permission to trade within fund rules, without permission to withdraw Crew funds. This app currently shows sample funds.</Text>
    <View style={styles.divider} /><View style={styles.meta}><Text style={styles.copy}>Version</Text><Text style={styles.itemTitle}>{appVersion}</Text></View>
    <View style={styles.meta}><Text style={styles.copy}>Platform</Text><Text style={styles.itemTitle}>{Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'}</Text></View>
    <ErrorCopy>{error}</ErrorCopy><AuthButton accessibilityRole="button" onPress={() => { void openSite(); }} style={styles.inlineAction}><ExternalLink size={17} color={S.accent} /><Text style={styles.inlineActionText}>Visit Socially</Text></AuthButton>
  </Card>;
}

const styles = StyleSheet.create({
  ...sharedStyles,
  aboutBrand: { alignItems: 'center', gap: 12, paddingVertical: 12 },
  wordmark: { fontFamily: BrandFont.wordmark, fontSize: 32, lineHeight: 39, letterSpacing: 5, color: S.ink },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
