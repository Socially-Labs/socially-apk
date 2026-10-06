import { useEffect } from 'react';
import Svg, { Path } from 'react-native-svg';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { AuthPanel as A } from '@/constants/theme';
import { authMorphPath } from './auth-morph-rig';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const states = { mail: 0, lock: 1, success: 2 } as const;

export function AuthMorphIcon({ state, from = state, size = 28 }: {
  state: keyof typeof states; from?: keyof typeof states; size?: number;
}) {
  const reduceMotion = useReducedMotion();
  const position = useSharedValue(states[from]);
  useEffect(() => {
    position.set(reduceMotion ? states[state] : withTiming(states[state], { duration: 440, easing: Easing.bezier(0.22, 1, 0.36, 1) }));
    return () => cancelAnimation(position);
  }, [state, reduceMotion, position]);
  const frame = useAnimatedProps(() => ({ d: authMorphPath(position.get(), 'frame') }));
  const mark = useAnimatedProps(() => ({ d: authMorphPath(position.get(), 'mark') }));
  return <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false} aria-hidden testID={`auth-morph-${state}`}>
    <AnimatedPath d={authMorphPath(states[from], 'frame')} animatedProps={frame} fill="none" stroke={A.primary} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <AnimatedPath d={authMorphPath(states[from], 'mark')} animatedProps={mark} fill="none" stroke={A.primary} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}
