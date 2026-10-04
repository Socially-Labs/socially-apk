import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, ChevronDown, ChevronRight, ExternalLink, Gift, LifeBuoy, Mail, Share2, ShieldCheck } from 'lucide-react-native';
import { useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { errorFeedback, selectionFeedback, successFeedback } from '@/components/shared/feedback';
import { Motion } from '@/constants/motion';

import { policyUrls } from '@/auth/config';
import { useAuth } from '@/auth/session';
import { DashboardShell } from '@/components/shared/dashboard/dashboard-shell';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont, InterFont } from '@/constants/fonts';
import { SettingsPalette as S } from '@/constants/theme';
import { ProfileAvatar } from './profile-avatar';
import { contactSupport, openSettingsLink, shareSettingsText } from './settings-actions';
import { useAccountSettings, type ProfileDraft } from './settings-provider';
import { SettingsLoading } from './settings-loading';

const appVersion = Constants.expoConfig?.version ?? '1.0.0';
const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@socially.trade';
const supportUrl = process.env.EXPO_PUBLIC_SUPPORT_URL?.trim() ?? '';
const titles: Record<string, string> = {
  profile: 'Edit profile', display: 'Display', referral: 'Refer a friend', support: 'Help & support',
  terms: 'Terms of Service', privacy: 'Privacy Policy', about: 'About Socially',
};

function Action({ label, onPress, disabled = false, busy = false, secondary = false, testID }: {
  label: string; onPress: () => void; disabled?: boolean; busy?: boolean; secondary?: boolean; testID?: string;
}) {
  const reduceMotion = useReducedMotion();
  return <AuthButton accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, busy }} testID={testID}
    onPress={onPress} disabled={disabled} style={[styles.action, secondary && styles.secondaryAction, disabled && styles.disabled]}>
    <Animated.View key={busy ? 'busy' : label} entering={reduceMotion ? undefined : FadeIn.duration(Motion.feedback)} style={styles.actionContent}>
      {busy ? <ActivityIndicator color={S.primaryInk} /> : label === 'Saved' ? <Check size={18} color={S.primaryInk} /> : null}
      <Text style={[styles.actionText, secondary && styles.secondaryActionText]}>{label}</Text>
    </Animated.View>
  </AuthButton>;
}
function Card({ children }: { children: ReactNode }) { return <View style={styles.card}>{children}</View>; }
function ErrorCopy({ children }: { children: string | null }) { return children ? <Text style={styles.error} accessibilityRole="alert">{children}</Text> : null; }

function ProfileEditor() {
  const { email } = useAuth();
  const { settings, ready, saving, profileDraft, updateProfileDraft, updateSettings, error: storageError } = useAccountSettings();
  const { name, bio, avatar } = profileDraft ?? settings;
  const nameInput = useRef<TextInput>(null);
  const bioInput = useRef<TextInput>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'bio' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const dirty = name.trim() !== settings.name || bio.trim() !== settings.bio || avatar !== settings.avatar;
  const nameError = nameTouched && !name.trim() ? 'Please enter your display name.' : null;
  function edit(patch: Partial<ProfileDraft>) {
    updateProfileDraft({ name, bio, avatar, ...patch });
    setSaved(false);
    setError(null);
  }
  async function save() {
    if (!ready || saving || !dirty) return;
    setNameTouched(true);
    if (!name.trim()) { errorFeedback(); nameInput.current?.focus(); return; }
    setError(null);
    setSaved(false);
    Keyboard.dismiss();
    try { await updateSettings({ name: name.trim(), bio: bio.trim(), avatar }); setSaved(true); successFeedback(); }
    catch (cause) { errorFeedback(); setError(cause instanceof Error ? cause.message : 'Your profile couldn’t be saved. Please try again.'); }
  }
  return <>
    <Card>
      <View style={styles.avatarPreview}><ProfileAvatar name={name || settings.name} avatar={avatar} size={84} /></View>
      <Text style={styles.label}>Choose your avatar</Text>
      <View style={styles.avatarOptions}>{(['captain', 'initials'] as const).map(kind => <AuthButton key={kind}
        accessibilityRole="button" accessibilityLabel={kind === 'captain' ? 'Captain avatar' : 'Initials avatar'} accessibilityState={{ selected: avatar === kind, disabled: !ready || saving }}
        disabled={!ready || saving} onPress={() => { if (kind !== avatar) selectionFeedback(); edit({ avatar: kind }); }} style={[styles.avatarOption, avatar === kind && styles.selected]}>
        <ProfileAvatar name={name || settings.name} avatar={kind} size={42} />
        <Text style={styles.optionText}>{kind === 'captain' ? 'Captain' : 'Initials'}</Text>
        {avatar === kind ? <Check size={16} color={S.accent} /> : null}
      </AuthButton>)}</View>
      <Text style={styles.label}>Display name</Text>
      <TextInput ref={nameInput} testID="profile-name" accessibilityLabel="Display name" accessibilityHint={nameError ?? 'Up to 40 characters'} value={name} maxLength={40} editable={ready && !saving}
        onChangeText={value => edit({ name: value })} placeholder="Your name" placeholderTextColor={S.secondary}
        onFocus={() => setFocusedField('name')} onBlur={() => { setFocusedField(null); setNameTouched(true); }}
        autoCapitalize="words" autoComplete="name" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => bioInput.current?.focus()}
        style={[styles.input, focusedField === 'name' && styles.inputFocused, nameError && styles.inputInvalid]} />
      <ErrorCopy>{nameError}</ErrorCopy>
      <Text style={styles.label}>Bio <Text style={styles.optional}>(optional)</Text></Text>
      <TextInput ref={bioInput} testID="profile-bio" accessibilityLabel="Bio" accessibilityHint="Optional, up to 140 characters" value={bio} maxLength={140} editable={ready && !saving}
        onChangeText={value => edit({ bio: value })} placeholder="A little about you" placeholderTextColor={S.secondary}
        onFocus={() => setFocusedField('bio')} onBlur={() => setFocusedField(null)}
        multiline textAlignVertical="top" style={[styles.input, styles.bio, focusedField === 'bio' && styles.inputFocused]} />
      <Text style={styles.characterCount}>{bio.length}/140</Text>
      <Text style={styles.label}>Sign-in account</Text>
      <View style={styles.account}><Mail size={18} color={S.secondary} /><Text selectable style={styles.copy}>{email ?? 'Signed in with a social account or preview access'}</Text></View>
      <Text style={styles.note}>Your sign-in details are managed by your login provider. Profile changes are saved on this device.</Text>
      <ErrorCopy>{error ?? storageError}</ErrorCopy>
      {saved ? <Text accessibilityLiveRegion="polite" style={styles.success}>Profile saved.</Text> : null}
      {dirty ? <Text style={styles.note}>Unsaved changes · Your draft stays here while you explore.</Text> : null}
      <Action label={saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'} busy={saving} disabled={!ready || saving || !dirty}
        testID="profile-save" onPress={() => { void save(); }} />
    </Card>
  </>;
}

function DisplayPreferences() {
  const { settings, ready, saving, error, updateSettings } = useAccountSettings();
  const [localError, setLocalError] = useState<string | null>(null);
  async function toggle(value: boolean) {
    setLocalError(null);
    try { await updateSettings({ hideBalances: value }); }
    catch (cause) { setLocalError(cause instanceof Error ? cause.message : 'This preference couldn’t be saved.'); }
  }
  return <Card>
    <View style={styles.switchRow}><View style={styles.flex}><Text style={styles.itemTitle}>Hide wallet balances</Text><Text style={styles.copy}>Keep your wallet amounts private until you choose to reveal them.</Text></View>
      <Switch testID="settings-hide-balances" accessibilityLabel="Hide wallet balances" value={settings.hideBalances}
        disabled={!ready || saving} onValueChange={value => { void toggle(value); }} trackColor={{ false: S.avatar, true: S.primary }} thumbColor={S.primaryInk} />
    </View>
    <ErrorCopy>{localError ?? error}</ErrorCopy>
    <View style={styles.divider} />
    <Text style={styles.itemTitle}>Appearance</Text><Text style={styles.copy}>Socially’s light voyage theme</Text>
    <Text style={styles.itemTitle}>Language</Text><Text style={styles.copy}>English</Text>
    <Text style={styles.itemTitle}>Display currency</Text><Text style={styles.copy}>USD · Token amounts retain their original units.</Text>
  </Card>;
}

function Referral() {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function share() {
    setError(null); setStatus(null); setPending(true);
    try {
      const result = await shareSettingsText('Join me on Socially', `Come aboard Socially. Explore markets and find your crew: ${policyUrls.site}`);
      if (result !== 'cancelled') setStatus(result === 'copied' ? 'Invite copied. Paste it into a message to your friend.' : 'Invite shared.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Your invite couldn’t be shared. Please try again.'); }
    finally { setPending(false); }
  }
  return <Card>
    <View style={styles.heroIcon}><Gift size={30} color={S.accent} strokeWidth={1.5} /></View>
    <Text style={styles.heroTitle}>Good voyages start with good company.</Text>
    <Text style={styles.copy}>Invite a friend to explore Socially and find their crew.</Text>
    <View style={styles.steps}>{['Share the Socially link.', 'Your friend opens the link and joins.', 'Explore markets together.'].map((text, i) => <View key={text} style={styles.step}><View style={styles.stepNumber}><Text style={styles.optionText}>{i + 1}</Text></View><Text style={[styles.copy, styles.flex]}>{text}</Text></View>)}</View>
    <Text style={styles.label}>Your invite link</Text><Text selectable style={styles.link}>{policyUrls.site}</Text>
    <ErrorCopy>{error}</ErrorCopy>{status ? <Text accessibilityLiveRegion="polite" style={styles.success}>{status}</Text> : null}
    <Action label="Share invite" testID="settings-share-invite" disabled={pending} busy={pending} onPress={() => { void share(); }} />
  </Card>;
}

const faqs = [
  { question: 'How do I update my profile?', answer: 'Open Settings → your profile, edit your display name or bio, choose an avatar, and tap Save changes. Your changes are saved for this account on this device.' },
  { question: 'Why can’t I deposit or withdraw yet?', answer: 'The current wallet shows a preview portfolio. Deposits, withdrawals, and receiving funds need a connected wallet and are not available in preview mode.' },
  { question: 'How do I keep my balances private?', answer: 'Open Settings → Display and turn on Hide wallet balances. You can also tap the eye icon in Wallet. The choice is remembered on this device.' },
  { question: 'How do I sign out?', answer: 'Tap Log out at the bottom of Settings and confirm. In preview mode, choose Back to sign in. Logging out does not delete your account.' },
];
function Support() {
  const [expanded, setExpanded] = useState<number | null>(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  async function send() {
    setError(null); setStatus(null);
    if (message.trim().length < 10) { setError('Add a little more detail so we can understand the issue (at least 10 characters).'); return; }
    const report = `${message.trim()}\n\nSocially ${appVersion} · ${Platform.OS}`;
    try {
      if (supportEmail) { await contactSupport(supportEmail, 'Socially support request', report); setStatus('Finish sending your request in your mail app.'); }
      else {
        const result = await shareSettingsText('Socially support request', report);
        if (result !== 'cancelled') setStatus(result === 'copied' ? 'Issue details copied. Send them to your Socially support contact.' : 'Issue details shared.');
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Your request couldn’t be opened. Please try again.'); }
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
      <TextInput accessibilityLabel="Support message" testID="support-message" value={message} onChangeText={setMessage} placeholder="How can we help?" placeholderTextColor={S.secondary}
        maxLength={2000} multiline textAlignVertical="top" style={[styles.input, styles.supportInput]} />
      {supportEmail ? <Text selectable style={styles.link}>{supportEmail}</Text> : <Text style={styles.note}>Share your issue details with your support contact, or visit the Socially website for contact information.</Text>}
      <ErrorCopy>{error}</ErrorCopy>{status ? <Text style={styles.success} accessibilityLiveRegion="polite">{status}</Text> : null}
      <Action label={supportEmail ? 'Email support' : 'Share issue details'} onPress={() => { void send(); }} />
      <Action label={supportUrl ? 'Visit help center' : 'Visit Socially website'} secondary onPress={() => { void openHelp(); }} />
    </Card>
  </>;
}

function Policy({ kind }: { kind: 'terms' | 'privacy' }) {
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
  return <Card><View style={styles.heroIcon}><ShieldCheck size={30} color={S.accent} strokeWidth={1.6} /></View>
    <Text style={styles.heroTitle}>{kind === 'terms' ? 'Know the terms of your voyage.' : 'Your privacy matters.'}</Text>
    <Text style={styles.copy}>{kind === 'terms' ? 'Read the published Terms of Service for using Socially.' : 'Read the published Privacy Policy for information about how your data is handled.'}</Text>
    <Text selectable style={styles.link}>{url}</Text><ErrorCopy>{error}</ErrorCopy>
    {status ? <Text accessibilityLiveRegion="polite" style={styles.success}>{status}</Text> : null}
    <Action label={`Read ${titles[kind]}`} testID={`settings-read-${kind}`} onPress={() => { void open(); }} />
    <AuthButton accessibilityRole="button" onPress={() => { void share(); }} style={styles.inlineAction}><Share2 size={17} color={S.accent} /><Text style={styles.inlineActionText}>Share policy link</Text></AuthButton>
  </Card>;
}

function About() {
  const [error, setError] = useState<string | null>(null);
  async function openSite() {
    try { await openSettingsLink(policyUrls.site); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The website couldn’t be opened.'); }
  }
  return <Card><View style={styles.aboutBrand}><ProfileAvatar name="Socially" avatar="captain" size={88} /><Text style={styles.wordmark}>SOCIALLY</Text></View>
    <Text style={styles.heroTitle}>Find your crew. Explore your markets.</Text><Text style={styles.copy}>Your markets, crew, and wallet, together in one place.</Text>
    <View style={styles.divider} /><View style={styles.meta}><Text style={styles.copy}>Version</Text><Text style={styles.itemTitle}>{appVersion}</Text></View>
    <View style={styles.meta}><Text style={styles.copy}>Platform</Text><Text style={styles.itemTitle}>{Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'}</Text></View>
    <ErrorCopy>{error}</ErrorCopy><AuthButton accessibilityRole="button" onPress={() => { void openSite(); }} style={styles.inlineAction}><ExternalLink size={17} color={S.accent} /><Text style={styles.inlineActionText}>Visit Socially</Text></AuthButton>
  </Card>;
}

export default function SettingsDetailScreen() {
  const { section: param } = useLocalSearchParams<{ section: string }>();
  const section = typeof param === 'string' ? param : '';
  const { ready } = useAccountSettings();
  function goBack() { Keyboard.dismiss(); if (router.canGoBack()) router.back(); else router.replace('/settings'); }
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <DashboardShell testID={`settings-detail-${section}`} keyboardAvoided>
      <View style={styles.header}><AuthButton accessibilityRole="button" accessibilityLabel="Back to Settings" onPress={goBack} style={styles.back}><ArrowLeft size={22} color={S.ink} /></AuthButton><Text accessibilityRole="header" style={styles.title}>{titles[section] ?? 'Settings'}</Text></View>
      {!ready && (section === 'profile' || section === 'display') ? <SettingsLoading profile={section === 'profile'} /> :
        section === 'profile' ? <ProfileEditor /> : section === 'display' ? <DisplayPreferences /> : section === 'referral' ? <Referral /> : section === 'support' ? <Support /> : section === 'terms' || section === 'privacy' ? <Policy kind={section} /> : section === 'about' ? <About /> : <Card><Text style={styles.copy}>This settings page isn’t available.</Text><Action label="Back to Settings" onPress={goBack} /></Card>}
    </DashboardShell>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  actionContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 26 },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: S.surface },
  title: { flex: 1, fontFamily: InterFont.semiBold, fontSize: 23, lineHeight: 31, color: S.ink, letterSpacing: -0.6 },
  card: { padding: 20, borderRadius: S.cardRadius, backgroundColor: S.surface, gap: 14, marginBottom: 16 },
  flex: { flex: 1 },
  copy: { fontFamily: InterFont.regular, fontSize: 14, lineHeight: 21, color: S.secondary, flexShrink: 1 },
  label: { fontFamily: InterFont.medium, fontSize: 13, lineHeight: 19, color: S.ink, marginTop: 6 },
  optional: { fontFamily: InterFont.regular, color: S.secondary },
  note: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 18, color: S.secondary },
  input: { backgroundColor: S.field, borderRadius: 14, borderColor: S.line, borderWidth: 1, padding: 14, minHeight: 50, fontFamily: InterFont.regular, fontSize: 15, lineHeight: 21, color: S.ink },
  inputFocused: { borderColor: S.accent },
  inputInvalid: { borderColor: S.danger },
  bio: { minHeight: 94 },
  supportInput: { minHeight: 130 },
  characterCount: { textAlign: 'right', fontFamily: InterFont.regular, fontSize: 11, color: S.secondary, marginTop: -7 },
  account: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  avatarPreview: { alignItems: 'center', marginVertical: 6 },
  avatarOptions: { flexDirection: 'row', gap: 10 },
  avatarOption: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: S.line },
  selected: { backgroundColor: S.badge, borderColor: S.accent },
  optionText: { fontFamily: InterFont.medium, fontSize: 12, lineHeight: 17, color: S.ink },
  action: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 16, backgroundColor: S.primary, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  actionText: { fontFamily: InterFont.medium, fontSize: 14, lineHeight: 20, color: S.primaryInk, textAlign: 'center' },
  secondaryAction: { backgroundColor: S.iconWell },
  secondaryActionText: { color: S.ink },
  disabled: { opacity: 0.55 },
  error: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 20, color: S.danger },
  success: { fontFamily: InterFont.medium, fontSize: 13, lineHeight: 19, color: S.accent },
  itemTitle: { fontFamily: InterFont.medium, fontSize: 15, lineHeight: 21, color: S.ink },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: S.line, marginVertical: 5 },
  heroIcon: { height: 66, width: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: S.badge, marginBottom: 4 },
  heroTitle: { fontFamily: InterFont.semiBold, fontSize: 22, lineHeight: 29, color: S.ink, letterSpacing: -0.5 },
  steps: { gap: 14, paddingVertical: 10 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNumber: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: S.iconWell },
  link: { fontFamily: InterFont.medium, fontSize: 13, lineHeight: 20, color: S.accent },
  faq: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: S.line, paddingTop: 6, gap: 6 },
  faqButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inlineAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 48, gap: 8 },
  inlineActionText: { fontFamily: InterFont.medium, fontSize: 14, lineHeight: 20, color: S.accent },
  aboutBrand: { alignItems: 'center', gap: 12, paddingVertical: 12 },
  wordmark: { fontFamily: BrandFont.wordmark, fontSize: 32, lineHeight: 39, letterSpacing: 5, color: S.ink },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
