import { policyUrls } from '@/auth/config';
import { AuthButton } from '@/components/shared/motion';
import { SettingsPalette as S } from '@/constants/theme';
import { ChevronDown, ChevronRight, LifeBuoy } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useBackendAccount } from '@/auth/backend-account-provider';
import { useAuth } from '@/auth/session';
import { Keyboard, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { contactSupport, openSettingsLink, shareSettingsText } from './settings-actions';
import { appVersion, supportEmail, supportUrl } from './settings-detail-config';
import { sharedStyles } from './settings-detail-styles';
import { Action, Card, ErrorCopy } from './settings-detail-ui';

const faqs = [
  { question: 'How do I update my profile?', answer: 'Open Settings → your profile, edit your display name or bio, choose an avatar, and tap Save changes. Your profile and photos are saved to your account.' },
  { question: 'How do I deposit or withdraw?', answer: 'Open Wallet and choose Deposit or Withdraw. Connect your wallet and follow the instructions shown there.' },
  { question: 'How do I keep my balances private?', answer: 'Open Settings → Display and turn on Hide wallet balances. You can also tap the eye icon in Wallet. The choice is saved to your account.' },
  { question: 'How do I sign out?', answer: 'Tap Log out at the bottom of Settings and confirm. In preview mode, choose Back to sign in. Logging out does not delete your account.' },
];

export function Support() {
  const backend = useBackendAccount();
  const { isAuthenticated } = useAuth();
  const sending = useRef(false);
  const [pending, setPending] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  async function send() {
    if (sending.current) return;
    setError(null); setStatus(null);
    if (message.trim().length < 10) { setError('Add a little more detail so we can understand the issue (at least 10 characters).'); return; }
    Keyboard.dismiss();
    const report = `${message.trim()}\n\nSocially ${appVersion} · ${Platform.OS}`;
    sending.current = true; setPending(true);
    try {
      if (isAuthenticated) {
        const ticket = await backend.submitSupport({ message: message.trim(), appVersion, platform: Platform.OS });
        setStatus(`Request received. Reference: ${ticket.id}`); setMessage('');
      } else if (supportEmail) { await contactSupport(supportEmail, 'Socially support request', report); setStatus('Finish sending your request in your mail app.'); }
      else {
        const result = await shareSettingsText('Socially support request', report);
        if (result !== 'cancelled') setStatus(result === 'copied' ? 'Issue details copied. Send them to your Socially support contact.' : 'Issue details shared.');
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Your request couldn’t be opened. Please try again.'); }
    finally { sending.current = false; setPending(false); }
  }
  async function openHelp() {
    setError(null);
    try { await openSettingsLink(supportUrl || policyUrls.site); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The help page couldn’t be opened.'); }
  }
  return <>
    <Card><View style={styles.heroIcon}><LifeBuoy size={30} color={S.accent} strokeWidth={1.6} /></View><Text style={styles.heroTitle}>A little help along the way.</Text><Text style={styles.copy}>Find quick answers or tell us what’s happening.</Text>
      {faqs.map((faq, i) => <View key={faq.question} style={styles.faq}>
        <AuthButton accessibilityRole="button" accessibilityState={{ expanded: expanded === i }} onPress={() => setExpanded(expanded === i ? null : i)} style={styles.faqButton}>
          <Text style={[styles.itemTitle, styles.flex]}>{faq.question}</Text>{expanded === i ? <ChevronDown size={19} color={S.secondary} /> : <ChevronRight size={19} color={S.secondary} />}
        </AuthButton>{expanded === i ? <Text style={styles.copy}>{faq.answer}</Text> : null}
      </View>)}
    </Card>
    <Card><Text style={styles.itemTitle}>Contact & feedback</Text><Text style={styles.copy}>Describe the problem and what you expected to happen. Keep passwords and recovery phrases private.</Text>
      <TextInput accessibilityLabel="Support message" testID="support-message" value={message} onChangeText={setMessage} editable={!pending} placeholder="How can we help?" placeholderTextColor={S.secondary}
        maxLength={2000} multiline textAlignVertical="top" style={[styles.input, styles.supportInput]} />
      {isAuthenticated ? <Text style={styles.note}>Your request will be saved with your account for the support team.</Text> : supportEmail ? <Text selectable style={styles.link}>{supportEmail}</Text> : <Text style={styles.note}>Share your issue details with your support contact, or visit the Socially website for contact information.</Text>}
      <ErrorCopy>{error}</ErrorCopy>{status ? <Text style={styles.success} accessibilityLiveRegion="polite">{status}</Text> : null}
      <Action testID="settings-submit-support" label={isAuthenticated ? 'Send support request' : supportEmail ? 'Email support' : 'Share issue details'} busy={pending} disabled={pending || (isAuthenticated && backend.status !== 'ready')} onPress={() => { void send(); }} />
      <Action label={supportUrl ? 'Visit help center' : 'Visit Socially website'} secondary onPress={() => { void openHelp(); }} />
    </Card>
  </>;
}

const styles = StyleSheet.create({
  ...sharedStyles,
  supportInput: { minHeight: 130 },
  faq: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: S.line, paddingTop: 6, gap: 6 },
  faqButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
});
