import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';
import { AuthButton } from '@/components/shared/motion';
import { errorFeedback } from '@/components/shared/feedback';
import { BrandFont, InterFont } from '@/constants/fonts';
import { AuthPanel as A } from '@/constants/theme';
import { AuthIcon } from './auth-icons';
import { AuthMorphIcon } from './auth-morph-icon';
import { AuthOtpInput } from './auth-otp-input';
import { AuthPassDivider } from './auth-pass-divider';
import { AuthPrimaryAction } from './auth-primary-action';
import { AuthVerificationFooter } from './auth-verification-controls';
import type { RefObject } from 'react';
import type { TextInput } from 'react-native';
import type { AuthTestIDPrefix, EmailAuth } from './auth-control-types';

export function AuthOtpPanel({ auth, input, focused, busy, testIDPrefix, onFocus, onBlur }: {
  auth: EmailAuth; input: RefObject<TextInput | null>; focused: boolean; busy: boolean; testIDPrefix: AuthTestIDPrefix;
  onFocus: () => void; onBlur: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const layout = reduceMotion ? undefined : LinearTransition.duration(320);
  const enter = reduceMotion ? undefined : FadeIn.duration(240);
  const exit = reduceMotion ? undefined : FadeOut.duration(120);
  useEffect(() => { if (auth.error) errorFeedback(); }, [auth.error]);
  return <Animated.View entering={enter} layout={layout} style={styles.panel} testID={`${testIDPrefix}-otp-panel`}>
    <AuthButton accessibilityLabel="Use a different email address" accessibilityRole="button" disabled={busy}
      testID={`${testIDPrefix}-change-email`} onPress={auth.changeEmail} style={styles.back}>
      <AuthIcon name="back" size={17} /><Text style={styles.backText}>Change email</Text>
    </AuthButton>
    <View style={styles.hero}>
      <View style={styles.seal}><AuthMorphIcon state="lock" from="mail" size={29} /></View>
      <Text accessibilityRole="header" style={styles.title}>Check your inbox.</Text>
      <Text style={styles.copy}>Enter the six-digit code we sent to</Text>
      <Text selectable style={styles.email}>{auth.email.trim()}</Text>
    </View>
    <AuthPassDivider />
    <AuthOtpInput input={input} code={auth.code} onChange={auth.updateCode} busy={busy} focused={focused} invalid={!!auth.error}
      testIDPrefix={testIDPrefix} onFocus={onFocus} onBlur={onBlur} onSubmit={() => { void auth.submitCode(); }} />
    <View style={styles.statusRow} accessibilityLiveRegion="polite">
      {auth.pending === 'verify' ? <ActivityIndicator color={A.primary} size="small" /> : null}
      <Text style={styles.hint}>{auth.pending === 'verify' ? 'Checking your code…' : 'We’ll continue as soon as all six digits are entered.'}</Text>
    </View>
    {auth.error ? <Animated.Text entering={enter} exiting={exit} testID={`${testIDPrefix}-otp-error`}
      accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}>{auth.error}</Animated.Text> : null}
    <View style={styles.action}>
      <AuthPrimaryAction testID={`${testIDPrefix}-submit`} label={auth.pending === 'verify' ? 'Verifying…' : auth.error ? 'Try code again' : 'Verify & continue'}
        busy={auth.pending === 'verify'} disabled={busy || auth.code.length !== 6} onPress={() => { void auth.submitCode(); }} />
    </View>
    <AuthVerificationFooter notice={auth.notice} resendIn={auth.resendIn} pending={auth.pending} busy={busy} testIDPrefix={testIDPrefix}
      onResend={() => { void auth.requestCode(true); }} enter={enter} exit={exit} layout={layout} />
  </Animated.View>;
}

const styles = StyleSheet.create({
  panel: { paddingHorizontal: 23, paddingBottom: 20 },
  back: { flexDirection: 'row', gap: 6, alignItems: 'center', minHeight: 44, alignSelf: 'flex-start', marginTop: -12, marginBottom: 8 },
  backText: { fontFamily: InterFont.medium, fontSize: 12, color: A.secondary },
  hero: { alignItems: 'center' },
  seal: { width: 62, height: 62, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: A.successSurface, borderWidth: 1, borderColor: A.glassBorder, marginBottom: 16 },
  title: { fontFamily: BrandFont.editorial, fontSize: 30, lineHeight: 36, color: A.ink, textAlign: 'center' },
  copy: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 19, color: A.secondary, textAlign: 'center', marginTop: 9 },
  email: { fontFamily: InterFont.medium, fontSize: 13, lineHeight: 20, color: A.primary, textAlign: 'center', marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 30 },
  hint: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 17, color: A.secondary, textAlign: 'center', flexShrink: 1 },
  action: { marginTop: 13 },
  error: { fontFamily: InterFont.medium, fontSize: 12, lineHeight: 18, color: A.error, textAlign: 'center', marginTop: 9 },
});
