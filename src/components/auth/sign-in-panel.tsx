import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, LinearTransition, useReducedMotion, type SharedValue } from 'react-native-reanimated';

import { policyUrls } from '@/auth/config';
import { AUTH_TEST_MODE, useTestAccess } from '@/auth/test-access';
import { AuthIcon } from '@/components/auth/auth-icons';
import { AuthButton, AuthReveal } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { AuthPanel } from '@/constants/theme';
import { useEmailAuth } from '@/hooks/use-email-auth';

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const { terms: termsUrl, privacy: privacyUrl } = policyUrls;
const hasPolicies = !!termsUrl?.startsWith('https://') && !!privacyUrl?.startsWith('https://');

/** Shared email / verification controls for the splash and sign-in screen. */
export function SignInPanel({ progress, testIDPrefix = 'auth', onFocusChange }: {
  progress: SharedValue<number>;
  testIDPrefix?: 'auth' | 'splash';
  onFocusChange?: (focused: boolean) => void;
}) {
  const auth = useEmailAuth();
  const { enterTestApp } = useTestAccess();
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
      enterTestApp();
      return;
    }
    if (verifying) void auth.submitCode();
    else void auth.requestCode();
  }
  const buttonLabel = AUTH_TEST_MODE ? 'Continue'
    : !auth.isReady ? 'Getting ready…'
    : auth.pending === 'send' ? 'Sending code…'
    : auth.pending === 'verify' ? 'Verifying…'
    : verifying ? 'Verify & continue' : 'Continue';
  const emailBusy = !AUTH_TEST_MODE && (auth.pending === 'send' || auth.pending === 'verify' || !auth.isReady);

  function openPolicy(url: string | undefined) {
    if (!url?.startsWith('https://')) return;
    setLinkError(null);
    void Linking.openURL(url).catch(() => setLinkError('Couldn’t open the page. Please try again.'));
  }

  return (
    <View style={styles.panel} testID={`${testIDPrefix}-panel`}>
      {verifying ? (
        <Animated.View entering={enter} exiting={exit} style={styles.codeHeader}>
          <AuthButton
            accessibilityRole="button" accessibilityLabel="Use a different email address"
            onPress={changeEmail} disabled={busy} style={styles.changeEmail}>
            <AuthIcon name="back" size={18} />
            <Text style={styles.changeEmailText}>Change email</Text>
          </AuthButton>
          <Text style={styles.codeTitle}>Check your inbox</Text>
          <Text style={styles.destination}>Enter the code sent to <Text style={styles.emailDestination}>{auth.email.trim()}</Text></Text>
        </Animated.View>
      ) : null}

      <AuthReveal progress={progress} order={0} layout={layout}>
        <View style={[styles.inputFrame, focused && styles.inputFocused, !!error && styles.inputError]}>
          <Animated.View key={auth.stage} entering={enter} exiting={exit} style={styles.fieldIcon}>
            <AuthIcon name={verifying ? 'lock' : 'mail'} size={20} />
          </Animated.View>
          <TextInput
            ref={input} testID={`${testIDPrefix}-${verifying ? 'code' : 'email'}`}
            accessibilityLabel={verifying ? '6-digit verification code' : 'Email address'}
            accessibilityHint={AUTH_TEST_MODE ? 'Optional for this app preview' : verifying ? 'Enter the code from your email' : 'Sign in or create an account. We will email you a code.'}
            style={[styles.input, verifying && styles.codeInput]}
            value={verifying ? auth.code : auth.email}
            onChangeText={verifying ? auth.updateCode : auth.updateEmail}
            onFocus={() => { setFocused(true); onFocusChange?.(true); }}
            onBlur={() => { setFocused(false); onFocusChange?.(false); }}
            placeholder={verifying ? '000000' : 'Your email address'}
            placeholderTextColor={AuthPanel.placeholder}
            autoCapitalize="none" autoCorrect={false} spellCheck={false}
            keyboardType={verifying ? 'number-pad' : 'email-address'}
            textContentType={verifying ? 'oneTimeCode' : 'emailAddress'}
            autoComplete={verifying ? 'one-time-code' : 'email'}
            returnKeyType="go" maxLength={verifying ? 12 : 254}
            editable={!busy} onSubmitEditing={submit}
            selectionColor={AuthPanel.primary} underlineColorAndroid="transparent" />
          {!verifying && auth.email.length > 0 ? (
            <AuthButton
              accessibilityRole="button" accessibilityLabel="Clear email address"
              disabled={busy} style={styles.clearButton} hitSlop={4}
              onPress={() => { auth.updateEmail(''); input.current?.focus(); }}>
              <AuthIcon name="clear" size={18} />
            </AuthButton>
          ) : null}
        </View>
      </AuthReveal>

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
        <Animated.View key="resend" entering={enter} exiting={exit} layout={layout} style={styles.verificationFooter}>
          <Text accessibilityLiveRegion="polite" style={styles.helper}>{auth.notice || 'No code yet? Check your spam folder.'}</Text>
          <AuthButton
            accessibilityRole="button" accessibilityState={{ disabled: busy || auth.resendIn > 0 }}
            testID={`${testIDPrefix}-resend`} disabled={busy || auth.resendIn > 0}
            onPress={() => { void auth.requestCode(true); }} style={styles.resendButton}>
            <Text style={[styles.resendText, (busy || auth.resendIn > 0) && styles.muted]}>
              {auth.pending === 'resend' ? 'Sending…' : auth.resendIn > 0 ? `Resend in ${auth.resendIn}s` : 'Resend code'}
            </Text>
          </AuthButton>
        </Animated.View>
      ) : (
        <Animated.View key="social" entering={enter} exiting={exit} layout={layout}>
          <AuthReveal progress={progress} order={2}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} /><Text style={styles.or}>OR</Text><View style={styles.dividerLine} />
            </View>
          </AuthReveal>
          <AuthReveal progress={progress} order={3}>
            <AuthButton
              testID={`${testIDPrefix}-google`} accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              accessibilityState={{ disabled: busy, busy: auth.pending === 'google' }}
              disabled={busy} onPress={() => {
                Keyboard.dismiss();
                if (AUTH_TEST_MODE) enterTestApp();
                else void auth.requestSocial('google');
              }}
              style={styles.socialButton}>
              {auth.pending === 'google'
                ? <ActivityIndicator color={AuthPanel.primary} size="small" />
                : <AuthIcon name="google" size={24} />}
              <Text style={styles.socialText}>Continue with Google</Text>
            </AuthButton>
          </AuthReveal>
          <AuthReveal progress={progress} order={4}>
            {hasPolicies ? (
              <Text style={styles.footer}>
                By continuing, you agree to our{' '}
                <Text accessibilityRole="link" onPress={() => openPolicy(termsUrl)} style={styles.policy}>Terms</Text>
                {' '}and{' '}
                <Text accessibilityRole="link" onPress={() => openPolicy(privacyUrl)} style={styles.policy}>Privacy Policy.</Text>
              </Text>
            ) : (
              <Text style={styles.footer}>Sign in or create your account.{'\n'}No password needed.</Text>
            )}
          </AuthReveal>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { paddingHorizontal: 17, paddingBottom: 23 },
  inputFrame: {
    minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 15,
    paddingLeft: 10, borderRadius: AuthPanel.controlRadius,
    borderWidth: 1, borderColor: AuthPanel.border, backgroundColor: AuthPanel.field,
  },
  fieldIcon: { width: 20, height: 22, justifyContent: 'center', alignItems: 'center' },
  inputFocused: { borderColor: AuthPanel.focusBorder, backgroundColor: 'rgba(255,255,255,0.72)' },
  inputError: { borderColor: AuthPanel.error },
  input: {
    flex: 1, minWidth: 0, minHeight: 44, paddingVertical: 10, paddingRight: 10,
    fontFamily: InterFont.regular, fontSize: AuthPanel.inputSize,
    color: AuthPanel.ink, borderWidth: 0, outlineWidth: 0,
  },
  codeInput: { fontSize: AuthPanel.codeSize, letterSpacing: 8, textAlign: 'center' },
  clearButton: { width: 36, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
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
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 31 },
  dividerLine: { height: 1, flex: 1, backgroundColor: AuthPanel.divider },
  or: { fontFamily: InterFont.medium, fontSize: 10, color: AuthPanel.caption },
  socialButton: {
    minHeight: 44, borderRadius: AuthPanel.controlRadius,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: AuthPanel.border, backgroundColor: AuthPanel.field,
  },
  socialText: { fontFamily: InterFont.regular, fontSize: AuthPanel.socialSize, color: AuthPanel.ink },
  footer: {
    fontFamily: InterFont.regular, fontSize: AuthPanel.captionSize, lineHeight: 15,
    color: AuthPanel.caption, textAlign: 'center', marginTop: 17,
  },
  policy: { fontFamily: InterFont.semiBold, color: AuthPanel.secondary },
  feedback: { marginTop: 10, paddingHorizontal: 2 },
  error: { fontFamily: InterFont.medium, fontSize: AuthPanel.bodySize, lineHeight: 20, color: AuthPanel.error },
  helper: { fontFamily: InterFont.regular, fontSize: AuthPanel.captionSize, lineHeight: 18, color: AuthPanel.secondary, textAlign: 'center' },
  codeHeader: { marginBottom: 18 },
  changeEmail: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44, alignSelf: 'flex-start' },
  changeEmailText: { fontFamily: InterFont.medium, fontSize: AuthPanel.captionSize, color: AuthPanel.secondary },
  codeTitle: { fontFamily: InterFont.semiBold, fontSize: 22, lineHeight: 28, color: AuthPanel.ink, marginTop: 2 },
  destination: { fontFamily: InterFont.regular, fontSize: AuthPanel.captionSize, lineHeight: 18, color: AuthPanel.secondary, marginTop: 6 },
  emailDestination: { fontFamily: InterFont.medium, color: AuthPanel.ink },
  verificationFooter: { alignItems: 'center', paddingTop: 18 },
  resendButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  resendText: { fontFamily: InterFont.semiBold, fontSize: AuthPanel.bodySize, color: AuthPanel.primary },
  muted: { color: AuthPanel.placeholder },
});
