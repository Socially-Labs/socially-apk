import { AuthIcon } from '@/components/auth/auth-icons';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { AuthPanel } from '@/constants/theme';
import { StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import type { AuthControlAnimation, AuthTestIDPrefix, EmailAuth } from './auth-control-types';

export function AuthVerificationHeader({ email, changeEmail, busy, enter, exit }: AuthControlAnimation & {
  email: string; changeEmail: () => void; busy: boolean;
}) {
  return (
    <Animated.View entering={enter} exiting={exit} style={styles.codeHeader}>
      <AuthButton
        accessibilityRole="button" accessibilityLabel="Use a different email address"
        onPress={changeEmail} disabled={busy} style={styles.changeEmail}>
        <AuthIcon name="back" size={18} />
        <Text style={styles.changeEmailText}>Change email</Text>
      </AuthButton>
      <Text style={styles.codeTitle}>Check your inbox</Text>
      <Text style={styles.destination}>Enter the code sent to <Text style={styles.emailDestination}>{email.trim()}</Text></Text>
    </Animated.View>
  );
}

export function AuthVerificationFooter({ notice, resendIn, pending, busy, testIDPrefix, onResend, enter, exit, layout }: AuthControlAnimation & {
  notice: EmailAuth['notice']; resendIn: number; pending: EmailAuth['pending']; busy: boolean; testIDPrefix: AuthTestIDPrefix; onResend: () => void;
}) {
  return (
    <Animated.View key="resend" entering={enter} exiting={exit} layout={layout} style={styles.verificationFooter}>
      <Text accessibilityLiveRegion="polite" style={styles.helper}>{notice || 'No code yet? Check your spam folder.'}</Text>
      <AuthButton
        accessibilityRole="button" accessibilityState={{ disabled: busy || resendIn > 0 }}
        testID={`${testIDPrefix}-resend`} disabled={busy || resendIn > 0}
        onPress={onResend} style={styles.resendButton}>
        <Text style={[styles.resendText, (busy || resendIn > 0) && styles.muted]}>
          {pending === 'resend' ? 'Sending…' : resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
        </Text>
      </AuthButton>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
