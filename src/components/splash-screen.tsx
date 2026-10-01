import Constants from 'expo-constants';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Keyboard, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing, ReduceMotion, cancelAnimation, useAnimatedStyle, useDerivedValue,
  useReducedMotion, useSharedValue, withSpring, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useAuth } from '@/auth/session';
import { SplashSignInCard } from '@/components/splash-sign-in-card';
import { buildTimeline, progress, traitsOf, transition, type SplashEvent } from '@/components/splash-timeline';
import { VoyageScene } from '@/components/splash-voyage';
import { InterFont } from '@/constants/fonts';

const APP_NAME = (Constants.expoConfig?.name ?? 'Socially').trim().toUpperCase() || 'SOCIALLY';
const ASSET_FAILSAFE_MS = 2000;
const CLOCK_FAILSAFE_SLACK_MS = 400;
// A restored session may land just after the intro; wait briefly before offering sign-in.
const AUTH_READY_GRACE_MS = 2500;
const CARD_SPRING = { damping: 26, stiffness: 200, mass: 0.9, overshootClamping: true };

function runClock(
  clock: SharedValue<number>, target: number, event: SplashEvent,
  dispatch: (event: SplashEvent) => void,
) {
  const remaining = Math.max(0, target - clock.get());
  clock.set(
    withTiming(
      target,
      // Keep time under Reduce Motion; the scene itself disables spatial movement.
      { duration: remaining, easing: Easing.linear, reduceMotion: ReduceMotion.Never },
      (finished) => {
        'worklet';
        if (finished) scheduleOnRN(dispatch, event);
      },
    ),
  );
  const failsafe = setTimeout(() => {
    cancelAnimation(clock);
    clock.set(target);
    dispatch(event);
  }, remaining + CLOCK_FAILSAFE_SLACK_MS);
  return () => {
    clearTimeout(failsafe);
    cancelAnimation(clock);
  };
}

export function SplashOverlay({ onComplete }: { onComplete: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const initialReduceMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(initialReduceMotion);
  const [phase, dispatch] = useReducer(transition, 'mirroring');
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [layout, setLayout] = useState({ width, height });
  const ready = useRef(false);
  const clock = useSharedValue(0);
  const frozenTime = useSharedValue(0);
  const spatialMotionDisabled = useSharedValue(initialReduceMotion);
  const motionClock = useDerivedValue(() => spatialMotionDisabled.get() ? frozenTime.get() : clock.get());
  const timeline = buildTimeline({ reduceMotion });
  const { isAuthenticated, isReady } = useAuth();
  const [authGraceOver, setAuthGraceOver] = useState(false);
  const card = useSharedValue(0);
  const showCard = phase === 'waiting' && !isAuthenticated && (isReady || authGraceOver);
  // Stays mounted through the exit fade once shown, so the card leaves with the scene.
  const [cardMounted, setCardMounted] = useState(false);
  if (showCard && !cardMounted) setCardMounted(true);

  const sceneReady = useCallback((canAnimate: boolean) => {
    // Late display/error events cannot restart the splash or change its layers mid-flight.
    if (ready.current) return;
    ready.current = true;
    setMotionEnabled(canAnimate);
    if (!canAnimate) setReduceMotion(true);
    dispatch('mirrorPainted');
  }, []);

  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (reduce) => {
      if (reduce) {
        frozenTime.set(clock.get());
        spatialMotionDisabled.set(true);
      }
      if (clock.get() === 0) setReduceMotion(reduce);
    });
    return () => subscription.remove();
  }, [clock, frozenTime, spatialMotionDisabled]);

  useEffect(() => {
    switch (phase) {
      case 'mirroring': {
        const failsafe = setTimeout(() => sceneReady(false), ASSET_FAILSAFE_MS);
        return () => clearTimeout(failsafe);
      }
      case 'unveiling': {
        let live = true;
        // Raster display callbacks precede this paint; hide the native launch screen afterward.
        const frame = requestAnimationFrame(() => {
          SplashScreen.hideAsync()
            .catch(() => {})
            .finally(() => { if (live) dispatch('nativeHidden'); });
        });
        return () => { live = false; cancelAnimationFrame(frame); };
      }
      case 'performing':
        return runClock(clock, timeline.exitAt, 'performed', dispatch);
      case 'leaving':
        return runClock(clock, timeline.end, 'left', dispatch);
      case 'gone':
        onComplete();
    }
  }, [phase, clock, sceneReady, timeline.exitAt, timeline.end, onComplete]);

  useEffect(() => {
    if (phase !== 'waiting') return;
    if (isAuthenticated) {
      Keyboard.dismiss();
      dispatch('authenticated');
      return;
    }
    if (isReady) return;
    const grace = setTimeout(() => setAuthGraceOver(true), AUTH_READY_GRACE_MS);
    return () => clearTimeout(grace);
  }, [phase, isAuthenticated, isReady]);

  useEffect(() => {
    if (!cardMounted) return;
    card.set(reduceMotion ? 1 : withSpring(1, CARD_SPRING));
    return () => cancelAnimation(card);
  }, [cardMounted, reduceMotion, card]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' || (phase !== 'performing' && phase !== 'leaving')) return;
      // Returning from a call or another app should reveal the app, never replay this intro.
      cancelAnimation(clock);
      if (phase === 'performing' && !isAuthenticated) {
        clock.set(timeline.exitAt);
        dispatch('performed');
        return;
      }
      clock.set(timeline.end);
      dispatch('performed');
      dispatch('authenticated');
      dispatch('left');
    });
    return () => subscription.remove();
  }, [clock, phase, isAuthenticated, timeline.exitAt, timeline.end]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: 1 - progress(clock.get(), timeline.exit) }));
  const lockupStyle = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, card.get() * 2.5) }));
  const traits = traitsOf(phase);
  if (!traits.render) return null;

  return (
    // An in-tree overlay covers the navigator without needing a separate window.
    // The native launch screen stays visible until the scene is ready.
    <Animated.View
      style={[styles.root, rootStyle]}
      testID="voyage-splash"
      accessibilityViewIsModal
      pointerEvents={traits.pointerEvents}
      onLayout={({ nativeEvent: { layout: measured } }) => {
        // Android's keyboard resizes the window; the scene behind the card stays still.
        if (cardMounted) return;
        setLayout((current) => current.width === measured.width && current.height === measured.height
          ? current : { width: measured.width, height: measured.height });
      }}>
      <StatusBar style="dark" />
      <VoyageScene
        clock={clock}
        motionClock={motionClock}
        timeline={timeline}
        width={layout.width}
        height={layout.height}
        motionEnabled={motionEnabled}
        onReady={sceneReady}
      />
      <Animated.View
        style={[styles.lockup, { paddingBottom: Math.max(insets.bottom, 16) + 36 }, lockupStyle]}
        pointerEvents="none"
        accessible={!cardMounted}
        accessibilityElementsHidden={cardMounted}
        importantForAccessibility={cardMounted ? 'no-hide-descendants' : 'auto'}
        accessibilityRole="summary"
        accessibilityLabel={`${APP_NAME}. Join the voyage.`}>
        <View style={styles.icon}>
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            transition={0}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>
        <Text style={styles.name} maxFontSizeMultiplier={1.2}>{APP_NAME}</Text>
        <Text style={styles.tagline} maxFontSizeMultiplier={1.2}>JOIN THE VOYAGE</Text>
      </Animated.View>
      {cardMounted ? <SplashSignInCard reveal={card} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#D6DDE2', overflow: 'hidden' },
  lockup: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    alignItems: 'center', gap: 10, mixBlendMode: 'multiply',
  },
  icon: { width: 56, height: 56, marginBottom: 4 },
  name: {
    fontFamily: InterFont.black, fontSize: 30, lineHeight: 36,
    letterSpacing: 4, color: '#303A41', textAlign: 'center',
  },
  tagline: {
    fontFamily: InterFont.light, fontSize: 10, lineHeight: 16,
    letterSpacing: 4.5, color: '#697780', textAlign: 'center',
  },
});
