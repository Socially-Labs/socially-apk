import { useEffect } from 'react';
import Svg, { Path } from 'react-native-svg';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { WalletPalette as W } from '@/constants/theme';
import { copyMorphPath } from './copy-morph-rig';

const AnimatedPath = Animated.createAnimatedComponent(Path);
export function CopyMorphIcon({ copied, size = 18 }: { copied: boolean; size?: number }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(copied ? 1 : 0);
  useEffect(() => {
    progress.set(reduceMotion ? Number(copied) : withTiming(Number(copied), { duration: 280, easing: Easing.bezier(0.22, 1, 0.36, 1) }));
    return () => cancelAnimation(progress);
  }, [copied, reduceMotion, progress]);
  const front = useAnimatedProps(() => ({ d: copyMorphPath(progress.get(), 'front') }));
  const rear = useAnimatedProps(() => ({ d: copyMorphPath(progress.get(), 'rear'), opacity: 1 - Math.min(1, Math.max(0, progress.get())) }));
  return <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false} aria-hidden testID="share-qr-copy-morph">
    <AnimatedPath d={copyMorphPath(Number(copied), 'rear')} animatedProps={rear} fill="none" stroke={W.receiveQrInk} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <AnimatedPath d={copyMorphPath(Number(copied), 'front')} animatedProps={front} fill="none" stroke={W.receiveQrInk} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}
