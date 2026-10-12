import { useEffect } from 'react';
import Svg, { Path } from 'react-native-svg';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { Motion } from '@/constants/motion';
import { Dashboard } from '@/constants/theme';
import { notificationBellPath } from './notification-bell-rig';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function useNotificationBellProgress(open: boolean) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    const target = Number(open);
    progress.set(reduceMotion ? target : withTiming(target, {
      duration: Motion.transition * Math.abs(target - progress.get()),
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    }));
    return () => cancelAnimation(progress);
  }, [open, reduceMotion, progress]);
  return progress;
}

export function NotificationBellIcon({ progress, open, size = 21 }: { progress: SharedValue<number>; open: boolean; size?: number }) {
  const left = useAnimatedProps(() => ({ d: notificationBellPath(progress.get(), 'left') }));
  const right = useAnimatedProps(() => ({ d: notificationBellPath(progress.get(), 'right') }));
  const clapper = useAnimatedProps(() => ({ d: notificationBellPath(progress.get(), 'clapper'), opacity: 1 - Math.min(1, progress.get() * 2) }));
  return <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden testID="notification-bell-morph">
    <AnimatedPath d={notificationBellPath(Number(open), 'left')} animatedProps={left} fill="none" stroke={Dashboard.ink} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    <AnimatedPath d={notificationBellPath(Number(open), 'right')} animatedProps={right} fill="none" stroke={Dashboard.ink} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    <AnimatedPath d={notificationBellPath(Number(open), 'clapper')} opacity={open ? 0 : 1} animatedProps={clapper} fill="none" stroke={Dashboard.ink} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}
