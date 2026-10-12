import { LinearGradient } from 'expo-linear-gradient';
import { Compass, Users, Wallet } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TokenIcon } from '@/components/shared/markets/market-graphics';
import { InterFont } from '@/constants/fonts';
import { NotificationPalette as C } from '@/constants/theme';
import type { HomeNotification } from '@/constants/home-notifications';

export type ToastNotice = { notification: HomeNotification; preview?: boolean; token?: 'SOL' | 'USDC' };

/** Storyboard 11: enter, reveal, one clipped light sweep, hold, then exit. */
export function NotificationToast({ notice, hidden, onDismiss, onOpen }: {
  notice: ToastNotice; hidden: boolean; onDismiss: () => void; onOpen: () => void;
}) {
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const toastWidth = Math.min(width - 32, 400);
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  const content = useSharedValue(reduceMotion ? 1 : 0);
  const sweep = useSharedValue(0);
  const travel = useSharedValue(0);
  const swiped = useSharedValue(false);
  const panActive = useSharedValue(false);
  const [dragging, setDragging] = useState(false);
  const closing = useRef(false);
  const suppressPressUntil = useRef(0);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [foreground, setForeground] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const [focused, setFocused] = useState(false);
  const notification = notice.notification;
  const copy = hidden ? notification.privateCopy ?? notification.copy : notification.copy;

  const close = useCallback((open = false) => {
    if (closing.current) return;
    closing.current = true;
    cancelAnimation(sweep);
    progress.set(withTiming(0, { duration: reduceMotion ? 100 : 200 }));
    exitTimer.current = setTimeout(open ? onOpen : onDismiss, reduceMotion ? 100 : 200);
  }, [onDismiss, onOpen, progress, reduceMotion, sweep]);

  const dismissSwipe = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    cancelAnimation(sweep);
    exitTimer.current = setTimeout(onDismiss, reduceMotion ? 100 : 180);
  }, [onDismiss, reduceMotion, sweep]);
  const dragChanged = useCallback((value: boolean) => {
    // A completed pan may still deliver a Pressable release on web/Android.
    suppressPressUntil.current = Date.now() + 500;
    setDragging(value);
  }, []);
  // Gesture callbacks execute on the UI thread, after registration.
  /* eslint-disable react-hooks/refs */
  const pan = useMemo(() => Gesture.Pan().activeOffsetX([-8, 8]).failOffsetY([-14, 14])
    .onStart(() => { panActive.set(true); scheduleOnRN(dragChanged, true); })
    .onUpdate(event => { if (!swiped.get()) travel.set(event.translationX); })
    .onEnd(event => {
      if (Math.abs(event.translationX) > toastWidth * 0.25 || (Math.abs(event.translationX) > 20 && Math.abs(event.velocityX) > 700)) {
        swiped.set(true);
        travel.set(withTiming(Math.sign(event.translationX) * (width + toastWidth), { duration: reduceMotion ? 100 : 180 }));
        scheduleOnRN(dismissSwipe);
      }
    })
    .onFinalize(() => {
      if (panActive.get() && !swiped.get()) { travel.set(withTiming(0, { duration: reduceMotion ? 100 : 180 })); scheduleOnRN(dragChanged, false); }
      panActive.set(false);
    }), [dismissSwipe, dragChanged, panActive, reduceMotion, swiped, toastWidth, travel, width]);
  /* eslint-enable react-hooks/refs */

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    progress.set(withTiming(1, { duration: reduceMotion ? 100 : 280, easing: Easing.out(Easing.cubic) }));
    content.set(withDelay(reduceMotion ? 0 : 180, withTiming(1, { duration: reduceMotion ? 100 : 180 })));
    if (!reduceMotion) sweep.set(withDelay(520, withTiming(1, { duration: 650, easing: Easing.inOut(Easing.quad) })));
    return () => {
      cancelAnimation(progress); cancelAnimation(content); cancelAnimation(sweep); cancelAnimation(travel);
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, [content, progress, reduceMotion, sweep, travel]);
  useEffect(() => {
    if (!foreground || focused || dragging) return;
    // Give wrapped text time to be read; touching or focusing the toast pauses dismissal.
    const timer = setTimeout(() => close(), fontScale > 1.15 ? 8000 : 4500);
    return () => clearTimeout(timer);
  }, [close, focused, dragging, fontScale, foreground]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: progress.get() * (1 - Math.min(1, Math.abs(travel.get()) / (toastWidth * 1.5))),
    transform: [{ translateX: travel.get() }, { translateY: reduceMotion ? 0 : -18 * (1 - progress.get()) }],
  }));
  const capsuleStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: reduceMotion ? 1 : 68 / toastWidth + (1 - 68 / toastWidth) * progress.get() }],
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: reduceMotion ? 0 : (toastWidth / 2 - 31) * (1 - progress.get()) }],
  }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: content.get() }));
  const sweepStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0 : Math.sin(sweep.get() * Math.PI),
    transform: [{ translateX: -toastWidth * 0.7 + sweep.get() * toastWidth * 1.7 }],
  }));
  const Icon = notification.icon === 'crew' ? Users : notification.icon === 'wallet' || notification.icon === 'allocation' ? Wallet : Compass;

  return <GestureHandlerRootView pointerEvents="box-none" style={[s.position, { top: insets.top + 8 }]}>
    <GestureDetector gesture={pan}><Animated.View testID="captain-notification-toast" accessibilityLiveRegion="polite"
      style={[s.toast, { width: toastWidth }, entranceStyle]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, s.capsule, capsuleStyle]}>
        <LinearGradient colors={C.surface} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View pointerEvents="none" testID="notification-toast-sweep" style={[s.sweep, { width: toastWidth * 0.7 }, sweepStyle]}>
        <LinearGradient colors={C.toastSweep} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Pressable accessibilityRole="button" accessibilityLabel="Expand notification" accessibilityHint={`${copy}. Swipe left or right to dismiss.`}
        accessibilityActions={[{ name: 'dismiss', label: 'Dismiss notification' }]}
        onAccessibilityEscape={() => close()} onAccessibilityAction={event => { if (event.nativeEvent.actionName === 'dismiss') close(); }}
        onPress={() => { if (Date.now() >= suppressPressUntil.current) close(true); }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onPressIn={() => setFocused(true)} onPressOut={() => setFocused(false)} style={s.body}>
        <Animated.View style={[s.icon, badgeStyle]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {notice.token ? <TokenIcon symbol={notice.token} size={36} /> : <Icon size={21} strokeWidth={1.7} color={C.icon} />}
        </Animated.View>
        <Animated.View style={[s.text, contentStyle]}>
          <Text style={s.copy}>{copy}</Text>
          <Text style={s.caption}>{notice.preview ? 'Preview · ' : ''}{notification.title}</Text>
        </Animated.View>
        <Animated.View style={[s.dot, contentStyle]} />
      </Pressable>
    </Animated.View></GestureDetector>
  </GestureHandlerRootView>;
}

const s = StyleSheet.create({
  position: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 100, elevation: 20 },
  toast: { minHeight: 68, borderRadius: 28, borderCurve: 'continuous', flexDirection: 'row', overflow: 'hidden', boxShadow: C.shadow },
  capsule: { borderRadius: 28, borderCurve: 'continuous', borderWidth: 1, borderColor: C.line, backgroundColor: C.pointer, overflow: 'hidden' },
  sweep: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  body: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', paddingLeft: 12, paddingRight: 18, paddingVertical: 12, gap: 10 },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.iconSurface, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0, gap: 3 },
  copy: { fontFamily: InterFont.semiBold, fontSize: 13, lineHeight: 18, color: C.ink },
  caption: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 15, color: C.secondary },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.positive },
});
