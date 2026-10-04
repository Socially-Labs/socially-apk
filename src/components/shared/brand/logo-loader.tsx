import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing, cancelAnimation, useAnimatedProps, useAnimatedStyle,
  useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { LOGO_CONTOUR } from './logo-contour';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const TRACE_LENGTH = 2400;

/** Traces the real brand contour, then reveals the original silver-blue artwork. */
export function LogoLoader({ size = 120, loading = false }: { size?: number; loading?: boolean }) {
  const reduceMotion = useReducedMotion();
  const trace = useSharedValue(reduceMotion ? 1 : 0);
  const fill = useSharedValue(reduceMotion ? 1 : 0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      trace.set(1);
      fill.set(1);
      return;
    }
    trace.set(withTiming(1, { duration: 850, easing: Easing.out(Easing.cubic) }));
    fill.set(withDelay(650, withTiming(1, { duration: 300 })));
    return () => {
      cancelAnimation(trace);
      cancelAnimation(fill);
    };
  }, [reduceMotion, trace, fill]);

  useEffect(() => {
    cancelAnimation(pulse);
    if (reduceMotion || !loading) {
      pulse.set(1);
      return;
    }
    pulse.set(withDelay(1100, withRepeat(withSequence(
      withTiming(0.76, { duration: 800 }),
      withTiming(1, { duration: 800 }),
    ), -1)));
    return () => cancelAnimation(pulse);
  }, [loading, reduceMotion, pulse]);

  const contourProps = useAnimatedProps(() => ({
    strokeDashoffset: TRACE_LENGTH * (1 - trace.get()),
    opacity: 1 - fill.get(),
  }));
  const imageStyle = useAnimatedStyle(() => ({ opacity: fill.get() }));
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.get() }));

  return (
    <Animated.View style={[{ width: size, height: size }, pulseStyle]} accessible
      accessibilityRole={loading ? 'progressbar' : 'image'} accessibilityLabel={loading ? 'Loading Socially' : 'Socially'}
      accessibilityState={{ busy: loading }}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 256 256">
          <AnimatedPath d={LOGO_CONTOUR} fill="none" stroke="#697780" strokeWidth={1.2}
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray={[TRACE_LENGTH, TRACE_LENGTH]}
            animatedProps={contourProps} />
        </Svg>
      </View>
      <Animated.View style={[StyleSheet.absoluteFill, imageStyle]} pointerEvents="none">
        <Image source={require('@/assets/images/splash-icon.png')} style={StyleSheet.absoluteFill}
          contentFit="contain" transition={0} accessibilityElementsHidden importantForAccessibility="no" />
      </Animated.View>
    </Animated.View>
  );
}
