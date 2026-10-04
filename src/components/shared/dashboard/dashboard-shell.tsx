import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import { useCallback, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Dashboard, WalletPalette } from '@/constants/theme';
import { Motion } from '@/constants/motion';

export function DashboardShell({ children, testID, variant = 'default', keyboardAvoided = false }: {
  children: ReactNode; testID?: string; variant?: 'default' | 'wallet'; keyboardAvoided?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  useFocusEffect(useCallback(() => {
    // The screen stays mounted, so filters and scroll position survive tab changes.
    opacity.set(reduceMotion ? 1 : 0.92);
    if (!reduceMotion) opacity.set(withTiming(1, { duration: Motion.reveal }));
    return () => { cancelAnimation(opacity); opacity.set(1); };
  }, [opacity, reduceMotion]));
  const contentStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
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
          style={[styles.fade, { top: Math.max(240, height * 0.32), height: height * 0.3 }, variant === 'wallet' && { top: height * 0.24, height: height * 0.28 }]} />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets={!keyboardAvoided}
        style={styles.scroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, {
          paddingHorizontal: variant === 'wallet' ? 20 : 15,
          paddingTop: Math.max(insets.top + 8, variant === 'wallet' ? 48 : 54), paddingBottom: Math.max(insets.bottom + 120, 142),
        }]}>
        <Animated.View style={[styles.measure, contentStyle]}>{children}</Animated.View>
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
