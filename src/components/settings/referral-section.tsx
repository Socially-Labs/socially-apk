import { policyUrls } from '@/auth/config';
import { SettingsPalette as S } from '@/constants/theme';
import { UserRoundPlus } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { shareSettingsText } from './settings-actions';
import { sharedStyles } from './settings-detail-styles';
import { Action, Card, ErrorCopy } from './settings-detail-ui';

export function Referral() {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function share() {
    setError(null); setStatus(null); setPending(true);
    try {
      const result = await shareSettingsText('Join me on Socially', `Pick a Captain. Join the Crew. Explore trader-managed funds on Socially: ${policyUrls.site}`);
      if (result !== 'cancelled') setStatus(result === 'copied' ? 'Invite copied. Paste it into a message to your friend.' : 'Invite shared.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Your invite couldn’t be shared. Please try again.'); }
    finally { setPending(false); }
  }
  return <Card>
    <View style={styles.heroIcon}><UserRoundPlus size={30} color={S.accent} strokeWidth={1.5} /></View>
    <Text style={styles.heroTitle}>Invite a friend to join the Crew.</Text>
    <Text style={styles.copy}>Help a friend discover Captains and compare their funds.</Text>
    <View style={styles.steps}>{['Share the Socially link.', 'Your friend opens the link and joins.', 'Compare Captain strategies and track records.'].map((text, i) => <View key={text} style={styles.step}><View style={styles.stepNumber}><Text style={styles.optionText}>{i + 1}</Text></View><Text style={[styles.copy, styles.flex]}>{text}</Text></View>)}</View>
    <Text style={styles.label}>Your invite link</Text><Text selectable style={styles.link}>{policyUrls.site}</Text>
    <ErrorCopy>{error}</ErrorCopy>{status ? <Text accessibilityLiveRegion="polite" style={styles.success}>{status}</Text> : null}
    <Action label="Share invite" testID="settings-share-invite" disabled={pending} busy={pending} onPress={() => { void share(); }} />
  </Card>;
}

const styles = StyleSheet.create({
  ...sharedStyles,
  steps: { gap: 14, paddingVertical: 10 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNumber: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: S.iconWell },
});
