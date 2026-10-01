import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { BrandFont, InterFont } from '@/constants/fonts';
import { AuthPanel } from '@/constants/theme';

/** Keep the app identity visible while the user signs in or verifies their email. */
export function SignInBrand({ testIDPrefix }: { testIDPrefix: 'auth' | 'splash' }) {
  return (
    <View style={styles.brand} accessible accessibilityLabel="Socially. Join the voyage.">
      <Image
        testID={`${testIDPrefix}-logo`}
        source={require('@/assets/images/splash-icon.png')}
        style={styles.logo} contentFit="contain" transition={0}
        accessible={false} />
      <Text testID={`${testIDPrefix}-wordmark`} style={styles.name}>SOCIALLY</Text>
      <Text style={styles.tagline}>JOIN THE VOYAGE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 64, height: 64, marginBottom: 8 },
  name: {
    fontFamily: BrandFont.wordmark, fontSize: 28, lineHeight: 34,
    letterSpacing: 4, color: AuthPanel.ink, textAlign: 'center',
  },
  tagline: {
    fontFamily: InterFont.medium, fontSize: 9, lineHeight: 14,
    letterSpacing: 2.5, color: AuthPanel.primary, textAlign: 'center', marginTop: 4,
  },
});
