import { AUTH_TEST_MODE, useTestAccess } from '@/auth/test-access';
import { useAccountSettings } from '@/components/settings/settings-provider';
import { AuthIcon } from '@/components/auth/auth-icons';
import { AuthButton, AuthReveal } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { AuthPanel } from '@/constants/theme';
import { useEmailAuth } from '@/hooks/use-email-auth';
import { useAppAccess } from '@/hooks/use-app-access';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, LinearTransition, useReducedMotion, type SharedValue } from 'react-native-reanimated';
import { AuthEmailField } from './auth-email-field';
import { AuthEntryControls } from './auth-entry-controls';
import { AuthVerificationFooter, AuthVerificationHeader } from './auth-verification-controls';
import { SignupPanel } from './signup-panel';
import { AuthPrimaryAction } from './auth-primary-action';

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

/** Credentials and signup share the same card on both auth entry points. */
export function SignInPanel({ progress, testIDPrefix = 'auth', onStageChange }: {
  progress: SharedValue<number>; testIDPrefix?: 'auth' | 'splash'; onStageChange?: (stage: string) => void;
}) {
  const { hasSession, needsOnboarding } = useAppAccess();
  const { ready, loadError, reloadSettings } = useAccountSettings();
  const [onboardingShown, setOnboardingShown] = useState(false);
  if (!hasSession && onboardingShown) setOnboardingShown(false);
  else if (hasSession && ready && !loadError && needsOnboarding && !onboardingShown) setOnboardingShown(true);

  useEffect(() => {
    if (!hasSession) onStageChange?.('credentials');
  }, [hasSession, onStageChange]);

  if (hasSession && ready && !loadError && (needsOnboarding || onboardingShown)) {
    return <SignupPanel progress={progress} testIDPrefix={testIDPrefix} onStageChange={onStageChange} />;
  }
  if (hasSession) return <View style={styles.panel} testID={`${testIDPrefix}-profile-loading`}>
    <Text accessibilityRole={loadError ? 'alert' : undefined} style={loadError ? styles.error : styles.status}>
      {loadError ?? (ready ? 'Welcome aboard.' : 'Loading your profile…')}
    </Text>
    {loadError ? <View style={styles.primaryRow}><AuthPrimaryAction testID={`${testIDPrefix}-profile-retry`} label="Try again" onPress={reloadSettings} /></View> : null}
  </View>;
  return <CredentialsPanel progress={progress} testIDPrefix={testIDPrefix} />;
}

function CredentialsPanel({ progress, testIDPrefix = 'auth', onFocusChange }: {
  progress: SharedValue<number>;
  testIDPrefix?: 'auth' | 'splash';
  onFocusChange?: (focused: boolean) => void;
}) {
  const auth = useEmailAuth();
  const { enterTestApp, beginTestSignup } = useTestAccess();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const reduceMotion = useReducedMotion();
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const verifying = !AUTH_TEST_MODE && auth.stage === 'code';
  const busy = !AUTH_TEST_MODE && (auth.pending !== null || auth.oauthPending || !auth.isReady);
  const disabled = !AUTH_TEST_MODE && (busy || (verifying ? auth.code.length !== 6 : !auth.email.trim()));
  const { changeEmail } = auth;
  const error = (AUTH_TEST_MODE ? null : auth.error) || linkError;
  const layout = reduceMotion ? undefined : LinearTransition.duration(280).easing(EASE_OUT);
  const enter = reduceMotion ? undefined : FadeIn.duration(200);
  const exit = reduceMotion ? undefined : FadeOut.duration(120);

  useEffect(() => {
    if (verifying) input.current?.focus();
  }, [verifying]);

  useEffect(() => {
    if (!verifying) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!busy) changeEmail();
      return true;
    });
    return () => subscription.remove();
  }, [verifying, busy, changeEmail]);

  function submit() {
    if (AUTH_TEST_MODE) {
      Keyboard.dismiss();
      if (mode === 'sign-up') beginTestSignup();
      else enterTestApp();
      return;
    }
    if (verifying) void auth.submitCode();
    else void auth.requestCode();
  }
  const buttonLabel = AUTH_TEST_MODE ? mode === 'sign-up' ? 'Create account' : 'Sign in'
    : !auth.isReady ? 'Getting ready…'
      : auth.pending === 'send' ? 'Sending code…'
        : auth.pending === 'verify' ? 'Verifying…'
          : verifying ? 'Verify & continue' : 'Continue';
  const emailBusy = !AUTH_TEST_MODE && (auth.pending === 'send' || auth.pending === 'verify' || !auth.isReady);

  function openPolicy(url: string | undefined) {
    if (!url?.startsWith('https://')) return;
    setLinkError(null);
    void Linking.openURL(url).catch (() => setLinkError('Couldn’t open the page. Please try again.'));
  }

  return (
    <View style={styles.panel} testID={`${testIDPrefix}-panel`}>
      {!verifying ? <AuthReveal progress={progress} order={0} style={styles.modes}>
        {(['sign-in', 'sign-up'] as const).map(value => <AuthButton key={value} testID={`${testIDPrefix}-mode-${value}`}
          accessibilityRole="tab" accessibilityState={{ selected: mode === value, disabled: busy }} disabled={busy}
          aria-selected={mode === value}
          onPress={() => { setMode(value); setLinkError(null); }} style={[styles.mode, mode === value && styles.modeSelected]}>
          <Text style={[styles.modeLabel, mode === value && styles.modeLabelSelected]}>{value === 'sign-in' ? 'Sign in' : 'Sign up'}</Text>
        </AuthButton>)}
      </AuthReveal> : null}
      {verifying ? (
        <AuthVerificationHeader email={auth.email} changeEmail={changeEmail} busy={busy} enter={enter} exit={exit} />
      ) : null}

      <AuthEmailField auth={auth} input={input} progress={progress} verifying={verifying} busy={busy}
        focused={focused} invalid={!!error} testIDPrefix={testIDPrefix} enter={enter} exit={exit} layout={layout} submit={submit}
        onFocus={() => { setFocused(true); onFocusChange?.(true); }}
        onBlur={() => { setFocused(false); onFocusChange?.(false); }} />

      {error ? (
        <Animated.View entering={enter} exiting={exit} layout={layout} style={styles.feedback}>
          <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}>{error}</Text>
        </Animated.View>
      ) : null}

      <AuthReveal progress={progress} order={1} style={styles.primaryRow} layout={layout}>
        <AuthButton
          testID={`${testIDPrefix}-submit`} accessibilityRole="button" accessibilityState={{ disabled, busy: emailBusy }}
          onPress={submit} disabled={disabled} style={[styles.primaryButton, disabled && styles.buttonDisabled]}>
          <LinearGradient colors={AuthPanel.primaryGradient} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={styles.buttonLabelFrame}>
            <Animated.Text key={buttonLabel} entering={enter} exiting={exit} style={styles.buttonText}>{buttonLabel}</Animated.Text>
          </View>
          <View style={styles.buttonArrow}>
            {emailBusy ? <ActivityIndicator color={AuthPanel.surface} size="small" /> : <AuthIcon name="arrow" size={21} />}
          </View>
        </AuthButton>
      </AuthReveal>

      {verifying ? (
        <AuthVerificationFooter key="resend" notice={auth.notice} resendIn={auth.resendIn} pending={auth.pending} busy={busy}
          testIDPrefix={testIDPrefix} onResend={() => { void auth.requestCode(true); }} enter={enter} exit={exit} layout={layout} />
      ) : (
        <AuthEntryControls key="social" progress={progress} testIDPrefix={testIDPrefix} busy={busy} googleBusy={auth.pending === 'google'}
          openPolicy={openPolicy} enter={enter} exit={exit} layout={layout} onGoogle={() => {
            Keyboard.dismiss();
            if (AUTH_TEST_MODE) { if (mode === 'sign-up') beginTestSignup(); else enterTestApp(); }
            else void auth.requestSocial('google');
          }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { paddingHorizontal: 17, paddingBottom: 23 },
  status: { fontFamily: InterFont.medium, fontSize: AuthPanel.bodySize, lineHeight: 20, color: AuthPanel.ink, paddingVertical: 12 },
  modes: { flexDirection: 'row', gap: 4, padding: 3, borderRadius: AuthPanel.controlRadius, backgroundColor: AuthPanel.selected, marginBottom: 15 },
  mode: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: AuthPanel.controlRadius - 3 },
  modeSelected: { backgroundColor: AuthPanel.surface },
  modeLabel: { fontFamily: InterFont.medium, fontSize: AuthPanel.bodySize, color: AuthPanel.placeholder },
  modeLabelSelected: { fontFamily: InterFont.semiBold, color: AuthPanel.primary },
  primaryRow: { marginTop: 9 },
  primaryButton: {
    minHeight: 44, borderRadius: AuthPanel.controlRadius, overflow: 'hidden',
    paddingHorizontal: 38, paddingVertical: 10,
    justifyContent: 'center', alignItems: 'center', backgroundColor: AuthPanel.primary,
    boxShadow: AuthPanel.buttonShadow,
  },
  buttonDisabled: { opacity: 0.82 },
  buttonLabelFrame: { height: 22, width: '100%' },
  buttonText: { position: 'absolute', left: 0, right: 0, fontFamily: InterFont.semiBold, color: AuthPanel.surface, fontSize: AuthPanel.buttonSize, lineHeight: 22, textAlign: 'center' },
  buttonArrow: { position: 'absolute', right: 17, top: 0, bottom: 0, justifyContent: 'center' },
  feedback: { marginTop: 10, paddingHorizontal: 2 },
  error: { fontFamily: InterFont.medium, fontSize: AuthPanel.bodySize, lineHeight: 20, color: AuthPanel.error },
});
