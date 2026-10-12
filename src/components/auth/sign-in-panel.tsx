import { useBackendAccount } from '@/auth/backend-account-provider';
import { useAuth } from '@/auth/session';
import { AUTH_TEST_MODE, useTestAccess } from '@/auth/test-access';
import { useAccountSettings } from '@/components/settings/settings-provider';
import { AuthIcon } from '@/components/auth/auth-icons';
import { AuthButton, AuthReveal } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { AuthPanel } from '@/constants/theme';
import { useEmailAuth } from '@/hooks/use-email-auth';
import { useAppAccess } from '@/hooks/use-app-access';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, LinearTransition, useReducedMotion, type SharedValue } from 'react-native-reanimated';
import { AuthEmailField } from './auth-email-field';
import { AuthEntryControls } from './auth-entry-controls';
import { SignupPanel } from './signup-panel';
import { AuthPrimaryAction } from './auth-primary-action';
import { AuthOtpPanel } from './auth-otp-panel';
import { useAuthCompletion } from '@/auth/auth-completion-provider';

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

/** Credentials and signup share the same card on both auth entry points. */
export function SignInPanel({ progress, testIDPrefix = 'auth', onStageChange }: {
  progress: SharedValue<number>; testIDPrefix?: 'auth' | 'splash'; onStageChange?: (stage: string) => void;
}) {
  const backend = useBackendAccount();
  const { pending: loginCompleting } = useAuthCompletion();
  const { isAuthenticated, logout } = useAuth();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const accountReady = !isAuthenticated || backend.status === 'ready';
  const { hasSession, needsOnboarding } = useAppAccess();
  const { ready, loadError, reloadSettings } = useAccountSettings();
  const [onboardingShown, setOnboardingShown] = useState(false);
  if (!hasSession && onboardingShown) setOnboardingShown(false);
  else if (hasSession && accountReady && ready && !loadError && needsOnboarding && !onboardingShown) setOnboardingShown(true);

  useEffect(() => {
    if (!hasSession) onStageChange?.('credentials');
  }, [hasSession, onStageChange]);

  if (!loginCompleting && hasSession && accountReady && ready && !loadError && (needsOnboarding || onboardingShown)) {
    return <SignupPanel progress={progress} testIDPrefix={testIDPrefix} onStageChange={onStageChange} />;
  }
  if (hasSession) {
    const error = logoutError ?? backend.error ?? loadError;
    return <View style={styles.panel} testID={`${testIDPrefix}-profile-loading`}>
      <Text accessibilityRole={error ? 'alert' : undefined} style={error ? styles.error : styles.status}>
        {error ?? (accountReady && ready ? 'Welcome aboard.' : 'Connecting your account…')}
      </Text>
      {error ? <View style={styles.primaryRow}><AuthPrimaryAction testID={`${testIDPrefix}-profile-retry`} label="Try again" disabled={signingOut}
        onPress={() => { setLogoutError(null); if (loadError) reloadSettings(); if (isAuthenticated) backend.retry(); }} /></View> : null}
      {isAuthenticated ? <AuthButton accessibilityRole="button" testID={`${testIDPrefix}-bootstrap-signout`} disabled={signingOut}
        onPress={() => { setSigningOut(true); setLogoutError(null); void logout().catch(() => setLogoutError('Couldn’t sign out. Please try again.')).finally(() => setSigningOut(false)); }}>
        <Text style={styles.status}>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
      </AuthButton> : null}
    </View>;
  }
  return <CredentialsPanel progress={progress} testIDPrefix={testIDPrefix} />;
}

function CredentialsPanel({ progress, testIDPrefix = 'auth', onFocusChange }: {
  progress: SharedValue<number>;
  testIDPrefix?: 'auth' | 'splash';
  onFocusChange?: (focused: boolean) => void;
}) {
  const auth = useEmailAuth();
  const { enterTestApp, beginTestSignup } = useTestAccess();
  const { settings, ready: profileReady } = useAccountSettings();
  const reduceMotion = useReducedMotion();
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const verifying = !AUTH_TEST_MODE && auth.stage === 'code';
  const busy = AUTH_TEST_MODE ? !profileReady : auth.pending !== null || auth.oauthPending || !auth.isReady;
  const disabled = busy || (!AUTH_TEST_MODE && (verifying ? auth.code.length !== 6 : !auth.email.trim()));
  const { changeEmail } = auth;
  const error = AUTH_TEST_MODE ? null : auth.error;
  const layout = reduceMotion ? undefined : LinearTransition.duration(280).easing(EASE_OUT);
  const enter = reduceMotion ? undefined : FadeIn.duration(200);
  const exit = reduceMotion ? undefined : FadeOut.duration(120);

  useEffect(() => {
    if (!verifying) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!busy) changeEmail();
      return true;
    });
    return () => subscription.remove();
  }, [verifying, busy, changeEmail]);

  function continuePreview() {
    if (!profileReady) return;
    Keyboard.dismiss();
    if (settings.role === null) beginTestSignup();
    else enterTestApp();
  }

  function submit() {
    if (disabled) return;
    if (AUTH_TEST_MODE) {
      continuePreview();
      return;
    }
    if (verifying) void auth.submitCode();
    else void auth.requestCode();
  }
  const buttonLabel = AUTH_TEST_MODE ? 'Continue'
    : !auth.isReady ? 'Getting ready…'
      : auth.pending === 'send' ? 'Sending code…'
        : 'Continue';
  const emailBusy = !AUTH_TEST_MODE && (auth.pending === 'send' || auth.pending === 'verify' || !auth.isReady);

  if (verifying) return <AuthOtpPanel auth={auth} input={input} focused={focused} busy={busy} testIDPrefix={testIDPrefix}
    onFocus={() => { setFocused(true); onFocusChange?.(true); }} onBlur={() => { setFocused(false); onFocusChange?.(false); }} />;

  return (
    <View style={styles.panel} testID={`${testIDPrefix}-panel`}>
      <AuthReveal progress={progress} order={0} style={styles.headingRow}>
        <Text accessibilityRole="header" style={styles.heading}>Welcome aboard</Text>
      </AuthReveal>
      <View style={styles.emailGroup} testID={`${testIDPrefix}-email-group`}>
        <AuthReveal progress={progress} order={0}>
          <Text style={styles.fieldLabel}>Email address</Text>
        </AuthReveal>

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
      </View>

      <AuthEntryControls key="social" progress={progress} testIDPrefix={testIDPrefix}
          enter={enter} exit={exit} layout={layout} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { paddingHorizontal: 16, paddingBottom: 22 },
  status: { fontFamily: InterFont.medium, fontSize: AuthPanel.bodySize, lineHeight: 20, color: AuthPanel.ink, paddingVertical: 12 },
  headingRow: { paddingHorizontal: 10, marginBottom: 14 },
  heading: { fontFamily: InterFont.semiBold, fontSize: AuthPanel.welcomeSize, lineHeight: 26, color: AuthPanel.ink },
  emailGroup: { padding: 14, borderRadius: AuthPanel.groupRadius, borderWidth: 1, borderColor: AuthPanel.groupBorder, backgroundColor: AuthPanel.groupSurface },
  fieldLabel: { fontFamily: InterFont.medium, fontSize: AuthPanel.fieldLabelSize, lineHeight: 18, color: AuthPanel.secondary, marginBottom: 8, paddingHorizontal: 6 },
  primaryRow: { marginTop: 12 },
  primaryButton: {
    minHeight: AuthPanel.controlHeight, borderRadius: AuthPanel.controlRadius, overflow: 'hidden',
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
