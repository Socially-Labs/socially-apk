import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { FadeOut, useReducedMotion } from 'react-native-reanimated';

import { CoastalScene } from '@/components/auth/coastal-scene';
import { AuthPanel } from '@/constants/theme';

/** The same ocean framing as sign-in, with no second logo/loading screen. */
export function BootLoadingScreen() {
  const painted = useRef(false);
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const onReady = useCallback(() => {
    if (painted.current) return;
    painted.current = true;
    requestAnimationFrame(() => { SplashScreen.hideAsync().catch(() => {}); });
  }, []);
  useEffect(() => {
    // An asset failure must never pin the system launch screen over the app.
    const failsafe = setTimeout(onReady, 2000);
    return () => clearTimeout(failsafe);
  }, [onReady]);

  return (
    <Animated.View style={styles.root} accessibilityViewIsModal accessibilityLabel="Loading Socially" pointerEvents="none"
      exiting={FadeOut.duration(reduceMotion ? 0 : 180)} testID="brand-boot-loading">
      <CoastalScene width={width} height={height} active={false} testIDPrefix="splash" onReady={onReady} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: AuthPanel.backdrop, overflow: 'hidden', zIndex: 10 },
});
