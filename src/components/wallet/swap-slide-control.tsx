import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Path } from 'react-native-svg';
import { ChevronsRight } from 'lucide-react-native';
import { selectionFeedback } from '@/components/shared/feedback';
import { InterFont } from '@/constants/fonts';
import { WalletPalette as W } from '@/constants/theme';
import { swapMorphPath } from './swap-morph-rig';

const AnimatedPath = Animated.createAnimatedComponent(Path);
function MorphStroke({ slot, progress }: { slot: number; progress: SharedValue<number> }) {
  const animatedProps = useAnimatedProps(() => ({
    d: swapMorphPath(progress.get(), slot), opacity: slot === 2 ? 1 - progress.get() : 1,
  }));
  return <AnimatedPath d={swapMorphPath(0, slot)} animatedProps={animatedProps} fill="none" stroke={W.white} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />;
}

/** Only a full deliberate drag commits; assistive activation/keyboard is equivalent. */
export function SwapSlideControl({ label, disabled, onCommit, onDragChange, pendingLabel, testIDPrefix = 'swap' }: {
  label: string; disabled: boolean; onCommit: () => Promise<void>; onDragChange: (dragging: boolean) => void; pendingLabel?: string; testIDPrefix?: string;
}) {
  const reduced = useReducedMotion();
  const [pending, setPending] = useState(false);
  const travel = useSharedValue(0), distance = useSharedValue(0), morph = useSharedValue(0), latched = useSharedValue(false);
  const committing = useRef(false), mounted = useRef(true), screenReader = useRef(false);
  const callbacks = useRef({ disabled, onCommit, onDragChange });
  useLayoutEffect(() => { callbacks.current = { disabled, onCommit, onDragChange }; }, [disabled, onCommit, onDragChange]);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isScreenReaderEnabled().then(value => { if (alive) screenReader.current = value; });
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', value => { screenReader.current = value; });
    return () => { alive = false; subscription.remove(); };
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; callbacks.current.onDragChange(false); cancelAnimation(travel); cancelAnimation(morph); };
  }, [travel, morph]);
  const reset = useCallback(() => {
    latched.set(false);
    travel.set(reduced ? 0 : withTiming(0, { duration: 220 }));
    morph.set(reduced ? 0 : withTiming(0, { duration: 220 }));
  }, [latched, travel, morph, reduced]);
  useEffect(() => { if (disabled && !committing.current) { reset(); callbacks.current.onDragChange(false); } }, [disabled, reset]);
  const dragChanged = useCallback((dragging: boolean) => { callbacks.current.onDragChange(dragging); }, []);
  const commit = useCallback(async () => {
    if (committing.current) return;
    if (callbacks.current.disabled) { reset(); dragChanged(false); return; }
    committing.current = true;
    if (pendingLabel) { setPending(true); travel.set(distance.get()); }
    selectionFeedback();
    try { await callbacks.current.onCommit(); }
    finally { committing.current = false; dragChanged(false); if (mounted.current) { setPending(false); reset(); } }
  }, [reset, dragChanged, pendingLabel, travel, distance]);
  // Gesture registration stores these worklets; scheduleOnRN invokes the ref-backed
  // callbacks only after a gesture. The compiler lint treats registration as execution.
  /* eslint-disable react-hooks/refs */
  const pan = useMemo(() => Gesture.Pan().enabled(!disabled && !pending).activeOffsetX(4).failOffsetY([-14, 14])
    .onStart(() => { if (!latched.get()) scheduleOnRN(dragChanged, true); })
    .onUpdate(event => {
      if (latched.get()) return;
      const value = Math.max(0, Math.min(distance.get(), event.translationX));
      travel.set(value);
      // Reduced motion keeps the arrow until the explicit completed endpoint.
      morph.set(reduced ? 0 : distance.get() ? value / distance.get() : 0);
    })
    .onEnd(() => {
      if (latched.get()) return;
      if (distance.get() > 0 && travel.get() >= distance.get() * 0.92) {
        latched.set(true); travel.set(distance.get()); morph.set(1); scheduleOnRN(commit);
      } else {
        travel.set(reduced ? 0 : withTiming(0, { duration: 220 }));
        morph.set(reduced ? 0 : withTiming(0, { duration: 220 }));
      }
    })
    .onFinalize(() => {
      if (!latched.get()) {
        travel.set(reduced ? 0 : withTiming(0, { duration: 220 }));
        morph.set(reduced ? 0 : withTiming(0, { duration: 220 }));
        scheduleOnRN(dragChanged, false);
      }
    }), [disabled, pending, reduced, latched, travel, distance, morph, dragChanged, commit]);
  /* eslint-enable react-hooks/refs */
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: travel.get() }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: travel.get() + 54, opacity: distance.get() > 0 ? Math.min(1, travel.get() / distance.get()) : 0 }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: reduced ? 1 : 1 - Math.min(1, morph.get() * 1.8) }));
  return <View testID={`${testIDPrefix}-slide-track`} style={[styles.track, disabled && !pending && styles.disabled]} onLayout={event => { distance.set(Math.max(0, event.nativeEvent.layout.width - 64)); }}>
    {pendingLabel ? <Animated.View pointerEvents="none" style={[styles.fill, fillStyle]} /> : null}
    <Animated.Text style={[styles.label, !pending && labelStyle]} accessible={false}>{pending ? pendingLabel : label}</Animated.Text>
    <View style={[styles.chevrons, pending && { opacity: 0 }]} pointerEvents="none"><ChevronsRight size={22} color={W.balanceCompass} /></View>
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.thumbPosition, thumbStyle]}>
        <Pressable testID={`${testIDPrefix}-submit`} style={styles.thumb} disabled={disabled || pending} accessibilityRole="button" accessibilityLabel={label}
          accessibilityHint="Drag all the way to the right, or activate with your screen reader or keyboard."
          accessibilityState={{ disabled: disabled || pending, busy: pending }} accessibilityActions={[{ name: 'activate', label }]}
          onAccessibilityAction={event => { if (event.nativeEvent.actionName === 'activate') void commit(); }}
          onPress={event => {
            const native = event.nativeEvent as typeof event.nativeEvent & { detail?: number; type?: string };
            // RN Web reports every browser as screen-reader enabled; use the
            // browser's keyboard/assistive click signal instead of that flag.
            if ((Platform.OS !== 'web' && screenReader.current) || (Platform.OS === 'web' && (native.detail === 0 || native.type === 'keyup'))) void commit();
          }}>
          {pending ? <ActivityIndicator color={W.white} accessibilityLabel={pendingLabel} /> : <Svg width={28} height={28} viewBox="0 0 24 24" {...(Platform.OS === 'web' ? {} : { accessible: false })} aria-hidden testID={`${testIDPrefix}-slide-morph`}>
            {[0, 1, 2].map(slot => <MorphStroke key={slot} slot={slot} progress={morph} />)}
          </Svg>}
        </Pressable>
      </Animated.View>
    </GestureDetector>
  </View>;
}
const styles = StyleSheet.create({
  track: { height: 64, borderRadius: 34, backgroundColor: W.balanceIcon, borderWidth: 1, borderColor: W.receiveGlass.border, justifyContent: 'center' },
  disabled: { opacity: 0.46 },
  fill: { position: 'absolute', left: 4, top: 4, bottom: 4, borderRadius: 30, backgroundColor: W.selected },
  thumbPosition: { position: 'absolute', left: 4, top: 4, width: 54, height: 54 },
  thumb: { width: 54, height: 54, borderRadius: 27, backgroundColor: W.receiveQrInk, alignItems: 'center', justifyContent: 'center', boxShadow: W.heroShadow },
  label: { marginLeft: 56, marginRight: 38, textAlign: 'center', fontFamily: InterFont.medium, fontSize: 14, color: W.ink },
  chevrons: { position: 'absolute', right: 18 },
});
