import { policyUrls } from '@/auth/config';
import { AuthIcon } from '@/components/auth/auth-icons';
import { AuthButton, AuthReveal } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { AuthPanel } from '@/constants/theme';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { type SharedValue } from 'react-native-reanimated';
import type { AuthControlAnimation, AuthTestIDPrefix } from './auth-control-types';

const { terms: termsUrl, privacy: privacyUrl } = policyUrls;
const hasPolicies = !!termsUrl?.startsWith('https://') && !!privacyUrl?.startsWith('https://');

export function AuthEntryControls({ progress, testIDPrefix, busy, googleBusy, onGoogle, openPolicy, enter, exit, layout }: AuthControlAnimation & {
  progress: SharedValue<number>; testIDPrefix: AuthTestIDPrefix; busy: boolean; googleBusy: boolean;
  onGoogle: () => void; openPolicy: (url: string | undefined) => void;
}) {
  return (
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
          accessibilityState={{ disabled: busy, busy: googleBusy }}
          disabled={busy} onPress={onGoogle}
          style={styles.socialButton}>
          {googleBusy
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
  );
}

const styles = StyleSheet.create({
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
});
