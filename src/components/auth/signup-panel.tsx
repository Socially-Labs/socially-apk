import { ArrowLeft, Check, Compass, Users } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';

import { useBackendAccount } from '@/auth/backend-account-provider';
import { useAuth } from '@/auth/session';
import { useTestAccess } from '@/auth/test-access';
import { AuthButton, AuthReveal } from '@/components/shared/motion';
import { usernameError, type AccountRole } from '@/components/settings/profile-model';
import { useAccountSettings } from '@/components/settings/settings-provider';
import { BrandFont, InterFont } from '@/constants/fonts';
import { AuthPanel as A } from '@/constants/theme';
import type { SharedValue } from 'react-native-reanimated';
import type { AuthTestIDPrefix } from './auth-control-types';
import { AuthPrimaryAction } from './auth-primary-action';

const roles = [
  { value: 'crew', title: 'Join as Crew', description: 'Find a Captain, join their fund and follow your portfolio.', Icon: Users },
  { value: 'captain', title: 'Become a Captain', description: 'Build your track record and manage a fund for your Crew.', Icon: Compass },
] as const;

export function SignupPanel({ progress, testIDPrefix, onStageChange }: {
  progress: SharedValue<number>; testIDPrefix: AuthTestIDPrefix; onStageChange?: (stage: string) => void;
}) {
  const { isAuthenticated, logout } = useAuth();
  const { leaveTestApp, completeTestSignup } = useTestAccess();
  const { updateSettings, saving } = useAccountSettings();
  const backend = useBackendAccount();
  const [checking, setChecking] = useState(false);
  const [step, setStep] = useState<'username' | 'role'>('username');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<AccountRole | null>(null);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const input = useRef<TextInput>(null);
  const writing = useRef(false);
  const busy = saving || leaving || checking;

  useEffect(() => { onStageChange?.(step); }, [step, onStageChange]);

  async function back() {
    if (busy || writing.current) return;
    setError(null);
    Keyboard.dismiss();
    if (step === 'role') { setStep('username'); return; }
    if (!isAuthenticated) { leaveTestApp(); return; }
    writing.current = true;
    setLeaving(true);
    try { await logout(); }
    catch { setError('Couldn’t sign out. Please try again.'); }
    finally { writing.current = false; setLeaving(false); }
  }

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { void back(); return true; });
    return () => subscription.remove();
  });

  async function submit() {
    if (busy || writing.current) return;
    const validationError = usernameError(username);
    if (validationError) { setError(validationError); input.current?.focus(); return; }
    setError(null);
    Keyboard.dismiss();
    if (step === 'username') {
      writing.current = true; setChecking(true);
      try {
        if (isAuthenticated && !await backend.usernameAvailable(username)) {
          setError('That username is already taken. Choose another one.'); return;
        }
        setStep('role');
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Username availability could not be checked.'); }
      finally { writing.current = false; setChecking(false); }
      return;
    }
    if (!role) { setError('Choose Captain or Crew to continue.'); return; }
    writing.current = true; setChecking(true);
    try {
      if (isAuthenticated) await backend.completeSignup(username, role, username);
      else await updateSettings({ username, role, name: username });
      completeTestSignup();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your profile couldn’t be saved. Please try again.');
    } finally { writing.current = false; setChecking(false); }
  }

  return <View style={styles.panel} testID={`${testIDPrefix}-signup-${step}`}>
    <AuthReveal progress={progress} order={0}>
      <View style={styles.topRow}>
        <AuthButton accessibilityRole="button" accessibilityLabel={step === 'role' ? 'Back to username' : 'Back to sign in'}
          testID={`${testIDPrefix}-signup-back`} disabled={busy} onPress={() => { void back(); }} style={styles.back}>
          <ArrowLeft size={16} color={A.primary} /><Text style={styles.backLabel}>Back</Text>
        </AuthButton>
        <Text style={styles.step}>Step {step === 'username' ? '1' : '2'} of 2</Text>
      </View>
      <Text style={styles.title} accessibilityRole="header">{step === 'username' ? 'Choose your username.' : 'How will you come aboard?'}</Text>
      <Text style={styles.copy}>{step === 'username' ? 'Your name among Captains and Crew.' : `@${username}, choose your place on Socially.`}</Text>
    </AuthReveal>

    <AuthReveal progress={progress} order={1} style={styles.fields}>
      {step === 'username' ? <>
        <View style={[styles.inputFrame, focused && styles.focused, error && styles.invalid]}>
          <Text style={styles.at}>@</Text>
          <TextInput ref={input} testID={`${testIDPrefix}-username`} accessibilityLabel="Username"
            accessibilityHint="3 to 24 letters, numbers or underscores, starting with a letter"
            style={styles.input} value={username} editable={!busy} maxLength={24}
            onChangeText={value => { setUsername(value.toLowerCase().replace(/^@/, '')); setError(null); }}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="your_username"
            placeholderTextColor={A.placeholder} selectionColor={A.primary} underlineColorAndroid="transparent"
            autoCapitalize="none" autoCorrect={false} spellCheck={false} autoComplete="username" textContentType="username"
            returnKeyType="next" onSubmitEditing={() => { void submit(); }} />
        </View>
        <Text style={styles.hint}>3–24 letters, numbers or underscores. Start with a letter.</Text>
      </> : <View style={styles.roles} accessibilityRole="radiogroup" accessibilityLabel="Choose your role">
        {roles.map(({ value, title, description, Icon }) => <AuthButton key={value} testID={`${testIDPrefix}-role-${value}`}
          accessibilityRole="radio" accessibilityLabel={title} accessibilityState={{ checked: role === value, disabled: busy }}
          aria-checked={role === value}
          disabled={busy} onPress={() => { setRole(value); setError(null); }} style={[styles.role, role === value && styles.roleSelected]}>
          <View style={styles.icon}><Icon size={22} color={A.primary} strokeWidth={1.7} /></View>
          <View style={styles.roleCopy}><Text style={styles.roleTitle}>{title}</Text><Text style={styles.roleDescription}>{description}</Text></View>
          <View style={[styles.radio, role === value && styles.radioSelected]}>{role === value ? <Check size={13} color={A.surface} /> : null}</View>
        </AuthButton>)}
      </View>}
    </AuthReveal>

    {error ? <Text testID={`${testIDPrefix}-signup-error`} accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}>{error}</Text> : null}
    <AuthReveal progress={progress} order={2} style={styles.action}>
      <AuthPrimaryAction testID={`${testIDPrefix}-signup-continue`} label={checking ? (step === 'username' ? 'Checking username…' : 'Saving your profile…') : saving ? 'Saving your profile…' : step === 'username' ? 'Continue' : role === 'captain' ? 'Continue as Captain' : role === 'crew' ? 'Continue as Crew' : 'Choose your role'}
        busy={busy} disabled={busy || (step === 'username' ? !username.trim() : !role)} onPress={() => { void submit(); }} />
    </AuthReveal>
    {step === 'role' ? <AuthReveal progress={progress} order={3}>
      <Text style={styles.hint}>{role === 'captain' ? 'Build your track record with a paper trading fund.' : 'Pick a Captain. Join the Crew. Keep your keys.'}</Text>
    </AuthReveal> : null}
  </View>;
}

const styles = StyleSheet.create({
  panel: { paddingHorizontal: 17, paddingBottom: 23 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -10 },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 12 },
  backLabel: { fontFamily: InterFont.medium, fontSize: A.bodySize, color: A.primary },
  step: { fontFamily: InterFont.medium, fontSize: A.captionSize, color: A.placeholder },
  title: { fontFamily: BrandFont.editorial, fontSize: A.headingSize, lineHeight: 32, color: A.ink, marginTop: 2 },
  copy: { fontFamily: InterFont.regular, fontSize: A.bodySize, lineHeight: 20, color: A.placeholder, marginTop: 7 },
  fields: { marginTop: 19 },
  inputFrame: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9, paddingLeft: 13,
    borderRadius: A.controlRadius, borderWidth: 1, borderColor: A.border, backgroundColor: A.field },
  focused: { borderColor: A.focusBorder },
  invalid: { borderColor: A.error },
  at: { fontFamily: InterFont.medium, fontSize: A.inputSize, color: A.placeholder },
  input: { flex: 1, minWidth: 0, minHeight: 44, paddingVertical: 10, paddingRight: 10, fontFamily: InterFont.regular,
    fontSize: A.inputSize, color: A.ink, borderWidth: 0, outlineWidth: 0 },
  hint: { fontFamily: InterFont.regular, fontSize: A.captionSize, lineHeight: 16, color: A.placeholder, marginTop: 10 },
  roles: { gap: 10 },
  role: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, minHeight: 86,
    borderRadius: A.controlRadius, borderWidth: 1, borderColor: A.border, backgroundColor: A.field },
  roleSelected: { borderColor: A.primary, backgroundColor: A.selected },
  icon: { width: 32, alignItems: 'center' },
  roleCopy: { flex: 1, gap: 4 },
  roleTitle: { fontFamily: InterFont.semiBold, fontSize: A.inputSize, lineHeight: 20, color: A.ink },
  roleDescription: { fontFamily: InterFont.regular, fontSize: A.roleDescriptionSize, lineHeight: 18, color: A.placeholder },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: A.focusBorder, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { backgroundColor: A.primary, borderColor: A.primary },
  action: { marginTop: 16 },
  error: { fontFamily: InterFont.medium, fontSize: A.bodySize, lineHeight: 20, color: A.error, marginTop: 10 },
});
