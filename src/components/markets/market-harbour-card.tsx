import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type AnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Motion } from '@/constants/motion';
import { CaptainMarketsPalette as M } from '@/constants/theme/captain-markets';
import { harbourBoatPath, harbourWaterPath } from './market-harbour-rig';
import { marketStyles as s } from './market-styles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const decorative = Platform.OS === 'web' ? { 'aria-hidden': true as const } : { accessible: false };

export function HarbourMarketCard({ active, compact, label, testID, onPress, children }: {
  active: boolean; compact: boolean; label: string; testID: string; onPress: () => void;
  children: (progress: SharedValue<number>, tileStyle: AnimatedStyle<ViewStyle>) => ReactNode;
}) {
  const initialReduceMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(initialReduceMotion);
  const progress = useSharedValue(0), focus = useSharedValue(false);
  const interaction = useRef({ pressed: false, hovered: false, focused: false });
  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!active) {
      interaction.current = { pressed: false, hovered: false, focused: false };
      focus.set(false);
      cancelAnimation(progress);
      progress.set(0);
    }
    return () => cancelAnimation(progress);
  }, [active, progress, focus]);
  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(progress);
      const state = interaction.current;
      progress.set(state.pressed ? 1 : state.hovered || state.focused ? 0.6 : 0);
    }
  }, [reduceMotion, progress]);

  function interact(kind: keyof typeof interaction.current, value: boolean) {
    interaction.current[kind] = value;
    if (kind === 'focused') focus.set(value);
    const state = interaction.current;
    const target = state.pressed ? 1 : state.hovered || state.focused ? 0.6 : 0;
    progress.set(reduceMotion ? target : withTiming(target, {
      duration: state.pressed ? Motion.feedback : Motion.transition,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    }));
  }

  const cardStyle = useAnimatedStyle(() => ({
    borderRadius: 22 - progress.get() * 2,
    transform: [{ scale: reduceMotion ? 1 : 1 - progress.get() * 0.012 }],
    outlineWidth: focus.get() ? 2 : 0,
    outlineColor: M.secondary,
    outlineOffset: 3,
  }));
  const tileStyle = useAnimatedStyle(() => ({
    borderRadius: 16 + progress.get() * 7,
    transform: [{ scale: reduceMotion ? 1 : 1 + progress.get() * 0.035 }],
  }));
  const waterBack = useAnimatedProps(() => ({ d: harbourWaterPath(progress.get(), 0) }));
  const waterFront = useAnimatedProps(() => ({ d: harbourWaterPath(progress.get(), 1) }));

  return <AnimatedPressable accessibilityRole="button" accessibilityLabel={label} testID={testID} onPress={onPress}
    onPressIn={() => interact('pressed', true)} onPressOut={() => interact('pressed', false)}
    onHoverIn={() => interact('hovered', true)} onHoverOut={() => interact('hovered', false)}
    onFocus={() => interact('focused', true)} onBlur={() => interact('focused', false)}
    style={[s.row, compact && s.compactRow, cardStyle]}>
    <View pointerEvents="none" accessible={false} aria-hidden style={StyleSheet.absoluteFill}>
      <LinearGradient colors={M.marketGlass} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height={28} viewBox="0 0 360 30" preserveAspectRatio="none" style={s.rowWater} {...decorative}>
        <AnimatedPath d={harbourWaterPath(0, 0)} animatedProps={waterBack} fill={M.waterBack} />
        <AnimatedPath d={harbourWaterPath(0, 1)} animatedProps={waterFront} fill={M.waterFront} />
      </Svg>
    </View>
    {children(progress, tileStyle)}
  </AnimatedPressable>;
}

export function MarketHarbourBoat({ progress, compact }: { progress: SharedValue<number>; compact: boolean }) {
  const mainsail = useAnimatedProps(() => ({ d: harbourBoatPath(progress.get(), 'mainsail') }));
  const foresail = useAnimatedProps(() => ({ d: harbourBoatPath(progress.get(), 'foresail') }));
  const hull = useAnimatedProps(() => ({ d: harbourBoatPath(progress.get(), 'hull') }));
  return <View pointerEvents="none" accessible={false} aria-hidden style={[s.rowBoat, compact && s.compactRowBoat]} testID="market-harbour-boat">
    <Svg width="100%" height={48} viewBox="0 0 64 56" {...decorative}>
      <AnimatedPath d={harbourBoatPath(0, 'mainsail')} animatedProps={mainsail} fill={M.sail} />
      <AnimatedPath d={harbourBoatPath(0, 'foresail')} animatedProps={foresail} fill={M.sailLight} />
      <AnimatedPath d={harbourBoatPath(0, 'hull')} animatedProps={hull} fill={M.sail} />
      <Path d="M6 50H56M17 54H44M47 12q3-4 6 0q3-4 6 0" stroke={M.sailLight} strokeWidth={1} strokeLinecap="round" fill="none" />
    </Svg>
  </View>;
}
