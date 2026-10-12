import { useKeyboardVisible } from '@/components/shared/keyboard/use-keyboard-visible';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, PanResponder, StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { InterFont } from '@/constants/fonts';
import { DiscoverPalette as C } from '@/constants/theme';
import { selectionFeedback } from '@/components/shared/feedback';
import { SailingShip } from './sailing-ship';
import { RefreshIndicatorContext } from './refresh-indicator-context';
import { canPullRefresh, refreshPullDistance, REFRESH_REST, REFRESH_THRESHOLD } from './pull-refresh-gesture';

type ScrollProps = Pick<ScrollViewProps, 'onScroll' | 'scrollEventThrottle' | 'bounces' | 'overScrollMode' | 'scrollEnabled' | 'accessibilityActions' | 'onAccessibilityAction'>;
type Props = {
  refreshing: boolean;
  onRefresh: () => void | Promise<unknown>;
  children: (props: ScrollProps) => ReactNode;
  topInset?: number;
  enabled?: boolean;
  pullDistance?: SharedValue<number>;
};

/** Custom top pull indicator. The scroll view remains virtualized and owns ordinary scrolling. */
export function SailingRefresh({ refreshing, onRefresh, children, topInset = 0, enabled = true, pullDistance }: Props) {
  const keyboardVisible = useKeyboardVisible();
  const reducedMotion = useReducedMotion();
  const localDistance = useSharedValue(0);
  const distance = pullDistance ?? localDistance;
  // The moving page must clear the entire indicator below the status-bar inset.
  const restingDistance = Math.max(0, topInset) + REFRESH_REST;
  const [phase, setPhase] = useState<'idle' | 'pull' | 'refresh'>('idle');
  const [armed, setArmed] = useState(false);
  const state = useRef({ scrollY: 0, startedAtTop: false, startedWithKeyboard: false, distance: 0, armed: false, pending: false, observedBusy: false, promise: false, generation: 0, focused: false });
  const latest = useRef({ refreshing, onRefresh, enabled: enabled && !keyboardVisible, keyboardVisible });
  useEffect(() => { latest.current = { refreshing, onRefresh, enabled: enabled && !keyboardVisible, keyboardVisible }; }, [refreshing, onRefresh, enabled, keyboardVisible]);
  const settle = useCallback(() => {
    const current = state.current;
    current.pending = false; current.promise = false; current.observedBusy = false; current.distance = 0; current.armed = false;
    setPhase('idle'); setArmed(false);
    distance.set(withTiming(0, { duration: reducedMotion ? 0 : 220 }));
  }, [distance, reducedMotion]);
  useFocusEffect(useCallback(() => {
    state.current.focused = true;
    return () => {
      state.current.focused = false; state.current.generation++;
      settle(); cancelAnimation(distance); distance.set(0);
    };
  }, [distance, settle]));
  // Some existing hooks trigger their request through an effect and return void.
  // Hold the ship until that controlled request transitions from busy to settled.
  useEffect(() => {
    if (!state.current.pending || state.current.promise) return;
    if (refreshing) state.current.observedBusy = true;
    else if (state.current.observedBusy) settle();
  }, [refreshing, phase, settle]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', status => {
      if (status !== 'active') { state.current.generation++; settle(); }
    });
    return () => listener.remove();
  }, [settle]);

  const startRefresh = useCallback(() => {
    const current = state.current;
    if (current.pending) return;
    if (latest.current.refreshing || !latest.current.enabled || !current.focused) { settle(); return; }
    current.pending = true; current.observedBusy = false;
    const generation = ++current.generation;
    setPhase('refresh'); setArmed(false);
    distance.set(withTiming(restingDistance, { duration: reducedMotion ? 0 : 160 }));
    selectionFeedback();
    try {
      const task = latest.current.onRefresh();
      if (task && typeof task.then === 'function') {
        current.promise = true;
        // Screens own their error presentation. Rejections must still release the indicator.
        void Promise.resolve(task).catch(() => {}).finally(() => {
          if (current.focused && current.generation === generation) settle();
        });
      }
    } catch { settle(); }
  }, [distance, reducedMotion, settle, restingDistance]);
  // PanResponder stores callbacks for later touch events; it does not read these refs during render.
  // eslint-disable-next-line react-hooks/refs
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: () => {
      state.current.startedAtTop = state.current.scrollY <= 1;
      state.current.startedWithKeyboard = latest.current.keyboardVisible;
      return false;
    },
    onMoveShouldSetPanResponderCapture: (_event, gesture) => canPullRefresh(
      state.current.startedAtTop, state.current.scrollY, gesture.dx, gesture.dy, gesture.numberActiveTouches,
      !latest.current.enabled || state.current.startedWithKeyboard || latest.current.refreshing || state.current.pending,
    ),
    onPanResponderGrant: () => { cancelAnimation(distance); setPhase('pull'); },
    onPanResponderMove: (_event, gesture) => {
      if (gesture.numberActiveTouches !== 1) { state.current.armed = false; setArmed(false); return; }
      const next = refreshPullDistance(gesture.dy);
      state.current.distance = next; distance.set(next);
      const ready = next >= REFRESH_THRESHOLD;
      if (ready !== state.current.armed) { state.current.armed = ready; setArmed(ready); }
    },
    onPanResponderRelease: (_event, gesture) => {
      if (gesture.numberActiveTouches <= 1 && state.current.armed) startRefresh(); else settle();
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderTerminate: settle,
  }), [distance, settle, startRefresh]);
  const contentStyle = useAnimatedStyle(() => ({ transform: [{ translateY: distance.get() }] }));
  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, distance.get() / 36),
    // Fade in at the safe-area position; sliding up clips the mast on short pulls.
    transform: [{ translateY: 0 }],
  }));
  const onScroll = useCallback<NonNullable<ScrollViewProps['onScroll']>>(event => {
    state.current.scrollY = Math.max(0, event.nativeEvent.contentOffset.y);
  }, []);
  const onAccessibilityAction = useCallback<NonNullable<ScrollViewProps['onAccessibilityAction']>>(event => {
    if (event.nativeEvent.actionName === 'refresh') startRefresh();
  }, [startRefresh]);
  const scrollProps: ScrollProps = {
    onScroll, scrollEventThrottle: 16, bounces: false, overScrollMode: 'never', scrollEnabled: phase !== 'pull',
    accessibilityActions: [{ name: 'refresh', label: 'Refresh content' }], onAccessibilityAction,
  };
  const visible = enabled && phase !== 'idle';
  return <View testID="sailing-refresh" style={styles.root} {...pan.panHandlers}>
    <Animated.View testID="sailing-refresh-indicator" pointerEvents="none" style={[styles.indicator, { top: Math.max(0, topInset) }, indicatorStyle]}
      accessibilityElementsHidden={!visible} importantForAccessibility={visible ? 'yes' : 'no-hide-descendants'}>
      {visible ? <View accessible accessibilityRole="progressbar" accessibilityLabel={phase === 'refresh' ? 'Refreshing content' : armed ? 'Release to refresh' : 'Pull to refresh'} accessibilityState={{ busy: phase === 'refresh' }}>
        <SailingShip active={visible} width={128} />
        <Text style={styles.label} accessibilityLiveRegion="polite">{phase === 'refresh' ? 'Refreshing…' : armed ? 'Release to refresh' : 'Pull to refresh'}</Text>
      </View> : null}
    </Animated.View>
    <Animated.View style={[styles.content, contentStyle]}>
      {/* These props contain deferred event callbacks, not ref values read during render. */}
      {/* eslint-disable-next-line react-hooks/refs */}
      <RefreshIndicatorContext value={visible}>{children(scrollProps)}</RefreshIndicatorContext>
    </Animated.View>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' }, content: { flex: 1 },
  indicator: { position: 'absolute', left: 0, right: 0, height: REFRESH_REST, alignItems: 'center', justifyContent: 'center', gap: 4, zIndex: 1 },
  label: { fontFamily: InterFont.regular, fontSize: 10, lineHeight: 14, textAlign: 'center', color: C.secondary },
});
