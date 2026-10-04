import { useAuth } from '@/auth/session';
import { AUTH_TEST_MODE, useTestAccess } from '@/auth/test-access';
import { buildTimeline, traitsOf, transition, type SplashEvent } from '@/components/auth/splash/splash-timeline';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Keyboard } from 'react-native';
import {
  Easing, ReduceMotion, cancelAnimation,
  useReducedMotion, useSharedValue, withSpring, withTiming, type SharedValue
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

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

/** Owns the intro lifecycle, auth grace period, and animation clock. */
export function useSplashController(onComplete: () => void) {
  const initialReduceMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(initialReduceMotion);
  const [phase, dispatch] = useReducer(transition, 'mirroring');
  const ready = useRef(false);
  const clock = useSharedValue(0);
  const timeline = buildTimeline({ reduceMotion });
  const { isAuthenticated, isReady } = useAuth();
  const { hasTestAccess } = useTestAccess();
  const canEnterApp = isAuthenticated || hasTestAccess;
  const [authGraceOver, setAuthGraceOver] = useState(false);
  const card = useSharedValue(0);
  const showCard = phase === 'waiting' && !canEnterApp && (AUTH_TEST_MODE || isReady || authGraceOver);
  // Stays mounted through the exit fade once shown, so the card leaves with the scene.
  const [cardMounted, setCardMounted] = useState(false);
  if (showCard && !cardMounted) setCardMounted(true);

  const sceneReady = useCallback((canAnimate: boolean) => {
    // Late display/error events cannot restart the splash or change its layers mid-flight.
    if (ready.current) return;
    ready.current = true;
    if (!canAnimate) setReduceMotion(true);
    dispatch('mirrorPainted');
  }, []);

  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (reduce) => {
      if (clock.get() === 0) setReduceMotion(reduce);
    });
    return () => subscription.remove();
  }, [clock]);

  useEffect(() => {
    switch(phase) {
      case 'mirroring': {
        const failsafe = setTimeout(() => sceneReady(false), ASSET_FAILSAFE_MS);
        return () => clearTimeout(failsafe);
      }
      case 'unveiling': {
        let live = true;
        // Raster display callbacks precede this paint; hide the native launch screen afterward.
        const frame = requestAnimationFrame(() => {
          SplashScreen.hideAsync()
            .catch (() => { })
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
    if (canEnterApp) {
      Keyboard.dismiss();
      dispatch('authenticated');
      return;
    }
    if (AUTH_TEST_MODE || isReady) return;
    const grace = setTimeout(() => setAuthGraceOver(true), AUTH_READY_GRACE_MS);
    return () => clearTimeout(grace);
  }, [phase, canEnterApp, isReady]);

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
      if (phase === 'performing' && !canEnterApp) {
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
  }, [clock, phase, canEnterApp, timeline.exitAt, timeline.end]);

  return { phase, clock, timeline, card, cardMounted, sceneReady, isReady, authGraceOver, traits: traitsOf(phase) };
}
