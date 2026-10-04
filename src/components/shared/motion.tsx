import { useEffect, type ComponentProps, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation, Easing, Extrapolation, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue,
  withSpring, type SharedValue,
} from 'react-native-reanimated';

import { AuthPanel } from '@/constants/theme';
import { Motion } from '@/constants/motion';

// Construct the curve on the UI thread rather than copying a JS-created
// Bézier closure and its captured helper functions into the worklet runtime.
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

// A settled sheet, then the field, action, and secondary controls. One clock
// keeps the choreography deterministic and interruptible without JS timers.
export function AuthReveal({ progress, order, children, style, layout }: {
  progress: SharedValue<number>; order: number; children: ReactNode; style?: StyleProp<ViewStyle>;
  layout?: ComponentProps<typeof Animated.View>['layout'];
}) {
  const reduceMotion = useReducedMotion();
  const animated = useAnimatedStyle(() => {
    const start = order * 0.1;
    const p = EASE_OUT.factory()(interpolate(progress.get(), [start, start + 0.48], [0, 1], Extrapolation.CLAMP));
    return { opacity: p, transform: [{ translateY: reduceMotion ? 0 : (1 - p) * 10 }] };
  });
  return <Animated.View style={[style, animated]} layout={layout}>{children}</Animated.View>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AuthButton({ children, style, disabled, onPressIn, onPressOut, onFocus, onBlur, ...props }: Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode; style?: StyleProp<ViewStyle>;
}) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const focus = useSharedValue(false);
  useEffect(() => {
    if (disabled || reduceMotion) { cancelAnimation(scale); scale.set(1); }
  }, [disabled, reduceMotion, scale]);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
    outlineWidth: focus.get() ? 2 : 0,
    outlineColor: AuthPanel.focusBorder,
    outlineOffset: 3,
  }));
  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      style={[style, animated]}
      onFocus={(event) => { focus.set(true); onFocus?.(event); }}
      onBlur={(event) => { focus.set(false); onBlur?.(event); }}
      onPressIn={(event) => {
        if (!reduceMotion) scale.set(withSpring(Motion.pressScale, Motion.pressSpring));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(reduceMotion ? 1 : withSpring(1, Motion.releaseSpring));
        onPressOut?.(event);
      }}>
      {children}
    </AnimatedPressable>
  );
}
