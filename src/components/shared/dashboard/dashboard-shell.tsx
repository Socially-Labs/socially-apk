import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Dashboard, WalletPalette } from '@/constants/theme';

export function DashboardShell({ children, testID, variant = 'default' }: { children: ReactNode; testID?: string; variant?: 'default' | 'wallet' }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return (
    <View style={styles.screen} testID={testID}>
      <StatusBar style="dark" />
      <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Image
          source={require('@/assets/images/auth/voyage-blue.png')}
          style={[styles.artwork, { height: Math.max(370, height * 0.52) }]}
          contentFit="fill" transition={0} />
        <View style={[styles.veil, { height: Math.max(370, height * 0.52) }, variant === 'wallet' && { backgroundColor: WalletPalette.veil }]} />
        <LinearGradient
          colors={['rgba(245,247,251,0)', 'rgba(245,247,251,0.84)', Dashboard.background]}
          locations={[0, 0.68, 1]}
          style={[styles.fade, { top: Math.max(240, height * 0.32), height: height * 0.3 }]} />
      </View>
      <ScrollView
        style={styles.scroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, {
          paddingTop: Math.max(insets.top + 8, 54), paddingBottom: Math.max(insets.bottom + 120, 142),
        }]}>
        <View style={styles.measure}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Dashboard.background },
  artwork: { position: 'absolute', top: 0, left: 0, width: '100%' },
  veil: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.43)' },
  fade: { position: 'absolute', left: 0, right: 0 },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 15 },
  measure: { width: '100%', maxWidth: Dashboard.maxWidth, alignSelf: 'center' },
});
