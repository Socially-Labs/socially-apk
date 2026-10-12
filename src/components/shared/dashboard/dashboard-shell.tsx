import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import { useCallback, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View, useWindowDimensions, type ScrollViewProps } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { REFRESH_THRESHOLD } from '@/components/shared/refresh/pull-refresh-gesture';
import { SailingRefresh } from '@/components/shared/refresh/sailing-refresh';
import { Dashboard, DiscoverPalette, WalletPalette } from '@/constants/theme';
import { Motion } from '@/constants/motion';

export function DashboardShell({ children, testID, variant = 'default', keyboardAvoided = false, fixed = false, onRefresh, refreshing = false }: {
  children: ReactNode; testID?: string; variant?: 'default' | 'wallet' | 'crew' | 'captain'; keyboardAvoided?: boolean; fixed?: boolean; onRefresh?: () => void; refreshing?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const crew = variant === 'crew';
  const captain = variant === 'captain';
  const scenicHome = crew || captain;
  const sceneryHeight = scenicHome ? Math.max(390, Math.min(480, height * 0.55)) : Math.max(370, height * 0.52);
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  const pullDistance = useSharedValue(0);
  const refreshSceneryStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, pullDistance.get() / REFRESH_THRESHOLD)),
  }));
  const scenerySource = captain ? require('@/assets/images/home/captain-helm.webp') : crew ? require('@/assets/images/home/crew-harbor.webp') : require('@/assets/images/auth/voyage-blue.png');
  useFocusEffect(useCallback(() => {
    // The screen stays mounted, so filters and scroll position survive tab changes.
    opacity.set(reduceMotion ? 1 : 0.92);
    if (!reduceMotion) opacity.set(withTiming(1, { duration: Motion.reveal }));
    return () => { cancelAnimation(opacity); opacity.set(1); };
  }, [opacity, reduceMotion]));
  const contentStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const scenery = (
      <View testID="dashboard-scenery" style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Image
          source={scenerySource}
          style={[styles.artwork, { height: sceneryHeight }]}
          contentFit={scenicHome ? 'cover' : 'fill'} contentPosition={scenicHome ? { left: '60%', top: '50%' } : 'center'} transition={0} />
        {scenicHome && onRefresh ? <Animated.View testID="home-refresh-scenery" style={[styles.artwork, { height: sceneryHeight }, refreshSceneryStyle]}>
          {/* Blend a pre-blurred copy; the gesture animates opacity without reprocessing the bitmap each frame. */}
          <Image testID="home-refresh-blurred-photo" source={scenerySource} blurRadius={4}
            style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={{ left: '60%', top: '50%' }} transition={0} />
          <View style={[StyleSheet.absoluteFill, styles.refreshTint]} />
        </Animated.View> : null}
        <View style={[styles.veil, { height: sceneryHeight }, scenicHome && { backgroundColor: 'transparent' }, variant === 'wallet' && { backgroundColor: WalletPalette.veil }]} />
        {scenicHome ? <LinearGradient colors={captain ? DiscoverPalette.captainSceneryVeil : DiscoverPalette.sceneryVeil} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.artwork, { height: sceneryHeight }]} /> : null}
        <LinearGradient
          colors={['rgba(245,247,251,0)', 'rgba(245,247,251,0.84)', Dashboard.background]}
          locations={[0, 0.68, 1]}
          style={[styles.fade, { top: Math.max(240, height * 0.32), height: height * 0.3 }, scenicHome && { top: sceneryHeight - 150, height: 150 }, variant === 'wallet' && { top: height * 0.24, height: height * 0.28 }]} />
      </View>
  );
  const content = (scrollProps: ScrollViewProps = {}) => fixed ? <View testID="home-fixed"
    accessibilityActions={scrollProps.accessibilityActions} onAccessibilityAction={scrollProps.onAccessibilityAction}
    style={[styles.scroll, {
        paddingHorizontal: 20, paddingTop: Math.max(insets.top + 8, height < 720 ? 16 : 54),
        paddingBottom: Math.max(insets.bottom + 84, 114),
      }]}>
        <Animated.View style={[styles.measure, styles.scroll, contentStyle]}>{children}</Animated.View>
      </View> : <ScrollView {...scrollProps}
        testID={scenicHome ? 'home-scroll' : undefined}
        keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets={!keyboardAvoided}
        style={styles.scroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, {
          paddingHorizontal: variant === 'wallet' || scenicHome ? 20 : 15,
          paddingTop: Math.max(insets.top + 8, variant === 'wallet' ? 48 : 54), paddingBottom: Math.max(insets.bottom + 120, 142),
        }]}>
        <Animated.View style={[styles.measure, contentStyle]}>{children}</Animated.View>
      </ScrollView>;
  return (
    <View style={styles.screen} testID={testID}>
      <StatusBar style="dark" />
      {scenery}
      {onRefresh ? <SailingRefresh refreshing={refreshing} onRefresh={onRefresh} topInset={insets.top} pullDistance={pullDistance}>
        {scrollProps => content(scrollProps)}
      </SailingRefresh> : content()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Dashboard.background },
  refreshTint: { backgroundColor: 'rgba(245,247,251,0.12)' },
  artwork: { position: 'absolute', top: 0, left: 0, width: '100%' },
  veil: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.43)' },
  fade: { position: 'absolute', left: 0, right: 0 },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 15 },
  measure: { width: '100%', maxWidth: Dashboard.maxWidth, alignSelf: 'center' },
});
