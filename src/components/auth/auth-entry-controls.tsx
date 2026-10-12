import { AuthIcon } from '@/components/auth/auth-icons';
import { AuthButton, AuthReveal } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { AuthPanel } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { type SharedValue } from 'react-native-reanimated';
import type { AuthControlAnimation, AuthTestIDPrefix } from './auth-control-types';

export function AuthEntryControls({ progress, testIDPrefix, enter, exit, layout }: AuthControlAnimation & {
  progress: SharedValue<number>; testIDPrefix: AuthTestIDPrefix;
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
          testID={`${testIDPrefix}-connect-wallet`} accessibilityRole="button"
          accessibilityLabel="Connect wallet"
          accessibilityHint="Wallet connection is coming soon."
          accessibilityState={{ disabled: true }}
          disabled
          style={styles.socialButton}>
          <AuthIcon name="wallet" size={24} />
          <Text style={styles.socialText}>Connect wallet</Text>
        </AuthButton>
      </AuthReveal>
      <AuthReveal progress={progress} order={4}>
        <View style={styles.footer} testID={`${testIDPrefix}-security-footer`}>
          <AuthIcon name="lock" size={13} />
          <Text style={styles.securityText}>Secured by <Text style={styles.provider}>Privy</Text></Text>
        </View>
      </AuthReveal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 31 },
  dividerLine: { height: 1, flex: 1, backgroundColor: AuthPanel.divider },
  or: { fontFamily: InterFont.medium, fontSize: 10, color: AuthPanel.caption },
  socialButton: {
    minHeight: AuthPanel.controlHeight, borderRadius: AuthPanel.socialRadius,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: AuthPanel.border, backgroundColor: AuthPanel.socialSurface,
  },
  socialText: { fontFamily: InterFont.regular, fontSize: AuthPanel.socialSize, color: AuthPanel.ink },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 16 },
  securityText: {
    fontFamily: InterFont.regular, fontSize: AuthPanel.captionSize, lineHeight: 15,
    color: AuthPanel.caption,
  },
  provider: { fontFamily: InterFont.semiBold },
});
