import { LogoLoader } from '@/components/shared/brand/logo-loader';
import { BrandFont, InterFont } from '@/constants/fonts';
import Constants from 'expo-constants';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

const APP_NAME = (Constants.expoConfig?.name ?? 'Socially').trim().toUpperCase() || 'SOCIALLY';

export function SplashLockup({ bottomInset, lockupStyle, cardMounted, loading }: {
  bottomInset: number; lockupStyle: ComponentProps<typeof Animated.View>['style']; cardMounted: boolean; loading: boolean;
}) {
  return (
    <Animated.View
      style={[styles.lockup, { paddingBottom: Math.max(bottomInset, 16) + 36 }, lockupStyle]}
      pointerEvents="none"
      accessible={!cardMounted}
      accessibilityElementsHidden={cardMounted}
      importantForAccessibility={cardMounted ? 'no-hide-descendants' : 'auto'}
      accessibilityRole="summary"
      accessibilityLabel={`${APP_NAME}. Join the voyage.`}>
      <View style={styles.icon}>
        <LogoLoader size={56} loading={loading} />
      </View>
      <Text style={styles.name} maxFontSizeMultiplier={1.2}>{APP_NAME}</Text>
      <Text style={styles.tagline} maxFontSizeMultiplier={1.2}>JOIN THE VOYAGE</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  lockup: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    alignItems: 'center', gap: 10, mixBlendMode: 'multiply',
  },
  icon: { width: 56, height: 56, marginBottom: 4 },
  name: {
    fontFamily: BrandFont.wordmark, fontSize: 34, lineHeight: 42,
    letterSpacing: 4.5, color: '#303A41', textAlign: 'center',
  },
  tagline: {
    fontFamily: InterFont.light, fontSize: 10, lineHeight: 16,
    letterSpacing: 4.5, color: '#697780', textAlign: 'center',
  },
});
