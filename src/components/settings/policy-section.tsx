import { policyUrls } from '@/auth/config';
import { AuthButton } from '@/components/shared/motion';
import { SettingsPalette as S } from '@/constants/theme';
import { FileText, LockKeyhole, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { openSettingsLink, shareSettingsText } from './settings-actions';
import { titles } from './settings-detail-config';
import { sharedStyles } from './settings-detail-styles';
import { Action, Card, ErrorCopy } from './settings-detail-ui';

export function Policy({ kind }: { kind: 'terms' | 'privacy' }) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const url = policyUrls[kind];
  async function open() {
    setError(null);
    try { await openSettingsLink(url); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The policy couldn’t be opened.'); }
  }
  async function share() {
    setError(null); setStatus(null);
    try { const result = await shareSettingsText(titles[kind], url); if (result !== 'cancelled') setStatus(result === 'copied' ? 'Link copied.' : 'Link shared.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Select and copy the link below.'); }
  }
  return <Card><View style={styles.heroIcon}>{kind === 'terms' ? <FileText size={30} color={S.accent} strokeWidth={1.8} /> : <LockKeyhole size={30} color={S.accent} strokeWidth={1.8} />}</View>
    <Text style={styles.heroTitle}>{kind === 'terms' ? 'Know the terms of your voyage.' : 'Your privacy matters.'}</Text>
    <Text style={styles.copy}>{kind === 'terms' ? 'Read the published Terms of Service for using Socially.' : 'Read the published Privacy Policy for information about how your data is handled.'}</Text>
    <Text selectable style={styles.link}>{url}</Text><ErrorCopy>{error}</ErrorCopy>
    {status ? <Text accessibilityLiveRegion="polite" style={styles.success}>{status}</Text> : null}
    <Action label={`Read ${titles[kind]}`} testID={`settings-read-${kind}`} onPress={() => { void open(); }} />
    <AuthButton accessibilityRole="button" onPress={() => { void share(); }} style={styles.inlineAction}><Share2 size={17} color={S.accent} /><Text style={styles.inlineActionText}>Share policy link</Text></AuthButton>
  </Card>;
}

const styles = StyleSheet.create({
  ...sharedStyles,

});
