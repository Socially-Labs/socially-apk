import { DiscoverPalette as D } from '@/constants/theme';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { sharedStyles } from './discover-component-styles';

export function DiscoverSurface({ children, scenic = false, sceneryHeight = 330, onHeightChange }: PropsWithChildren<{
  scenic?: boolean; sceneryHeight?: number; onHeightChange?: (height: number) => void;
}>) {
  return <View style={styles.screen} onLayout={event => {
    if (event.nativeEvent.layout.height > 0) onHeightChange?.(event.nativeEvent.layout.height);
  }}>
    <LinearGradient colors={D.backgroundGradient} style={styles.background} pointerEvents="none" />
    {scenic ? <View testID="discover-scenery" style={[styles.scenery, { height: sceneryHeight }]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Image testID="discover-scenery-image" source={require('@/assets/images/discover/captain-horizon.png')} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="right center" transition={0} />
      <LinearGradient colors={D.sceneryVeil} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(245,247,251,0)', 'rgba(245,247,251,0.25)', D.background]} locations={[0, 0.5, 1]} style={styles.sceneryFade} />
    </View> : null}
    {children}
  </View>;
}

const styles = StyleSheet.create({
  ...sharedStyles,
  screen: { flex: 1, backgroundColor: D.background },
  background: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  scenery: { position: 'absolute', top: 0, left: 0, right: 0 },
  sceneryFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 145 },
});
