import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeOut, useReducedMotion } from 'react-native-reanimated';

import { LogoLoader } from '@/components/shared/brand/logo-loader';

/** Mirrors the native splash position and color while real resources settle. */
export function BootLoadingScreen() {
  const painted = useRef(false);
  const reduceMotion = useReducedMotion();
  const onLayout = useCallback(() => {
    if (painted.current) return;
    painted.current = true;
    requestAnimationFrame(() => { SplashScreen.hideAsync().catch(() => {}); });
  }, []);

  return (
    <Animated.View style={styles.root} onLayout={onLayout} accessibilityViewIsModal pointerEvents="none"
      exiting={FadeOut.duration(reduceMotion ? 0 : 180)} testID="brand-boot-loading">
      <LogoLoader loading />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#D6DDE2', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
});
