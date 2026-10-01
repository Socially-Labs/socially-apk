import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useState } from 'react';
import {
  Dimensions, Keyboard, KeyboardAvoidingView,
  Platform, StyleSheet, View, useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing, Extrapolation, LinearTransition, cancelAnimation,
  interpolate, useAnimatedScrollHandler, useAnimatedStyle, useReducedMotion,
  useSharedValue, withSpring, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { IntroCompleteContext } from '@/components/auth/intro-context';
import { SignInBrand } from '@/components/auth/sign-in-brand';
import { SignInPanel } from '@/components/auth/sign-in-panel';
import { AuthPanel } from '@/constants/theme';

const BACKGROUND = require('@/assets/images/auth/voyage-blue.png');
const ORIGINAL = require('@/assets/images/voyage/original.png');
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const SHEET_SPRING = { damping: 28, stiffness: 240, mass: 0.9, overshootClamping: true };

// Keep the Keyboard singleton on the RN thread. Capturing Keyboard.dismiss
// directly in a gesture worklet attempts to serialize its KeyboardImpl owner.
function dismissKeyboard() {
  Keyboard.dismiss();
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // Android's keyboard resizes the window; the architectural scene stays still.
  const backdropHeight = Platform.OS === 'web' ? height : Dimensions.get('screen').height;
  const reduceMotion = useReducedMotion();
  const introComplete = useContext(IntroCompleteContext);
  const [focused, setFocused] = useState(false);
  const [backgroundReady, setBackgroundReady] = useState(false);
  const reveal = useSharedValue(0);
  const contentReveal = useSharedValue(0);
  const drag = useSharedValue(0);
  const focus = useSharedValue(0);
  const scroll = useSharedValue(0);
  const colorReveal = useSharedValue(0);
  const layout = reduceMotion ? undefined : LinearTransition.duration(280).easing(EASE_OUT);

  useEffect(() => {
    if (!introComplete) return;
    reveal.set(reduceMotion ? 1 : withSpring(1, SHEET_SPRING));
    // Linear clock, individually eased rows: delays stay evenly spaced.
    contentReveal.set(reduceMotion ? 1 : withTiming(1, { duration: 520, easing: Easing.linear }));
    return () => { cancelAnimation(reveal); cancelAnimation(contentReveal); };
  }, [introComplete, reduceMotion, reveal, contentReveal]);

  useEffect(() => {
    if (introComplete && backgroundReady) {
      colorReveal.set(reduceMotion ? 1 : withTiming(1, { duration: 600, easing: EASE_OUT }));
    }
    return () => cancelAnimation(colorReveal);
  }, [introComplete, backgroundReady, reduceMotion, colorReveal]);

  useEffect(() => {
    focus.set(reduceMotion ? (focused ? 1 : 0) : withTiming(focused ? 1 : 0, { duration: 300, easing: EASE_OUT }));
  }, [focused, reduceMotion, focus]);

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: reveal.get(),
    transform: [
      { translateY: reduceMotion ? 0 : (1 - reveal.get()) * 64 + drag.get() },
      { scale: reduceMotion ? 1 : interpolate(reveal.get(), [0, 1], [0.985, 1]) },
    ],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: reduceMotion ? 1 : 1 + focus.get() * 0.018 },
      { translateY: reduceMotion ? 0 : -focus.get() * 8 - Math.min(scroll.get(), 100) * 0.08 - drag.get() * 0.12 },
    ],
  }));
  const colorStyle = useAnimatedStyle(() => ({ opacity: colorReveal.get() }));
  const onScroll = useAnimatedScrollHandler((event) => { scroll.set(event.contentOffset.y); });

  // The top edge is the only drag target, so gestures never steal typing or
  // button taps. Velocity carries into a damped return to the resting position.
  const pan = Gesture.Pan()
    .enabled(!reduceMotion && introComplete)
    .activeOffsetY([-6, 6])
    .onUpdate((event) => {
      drag.set(interpolate(event.translationY, [-80, 0, 160], [-12, 0, 48], Extrapolation.CLAMP));
    })
    .onEnd((event) => {
      if (event.translationY > 24) scheduleOnRN(dismissKeyboard);
      drag.set(withSpring(0, { ...SHEET_SPRING, velocity: event.velocityY * 0.2 }));
    })
    .onFinalize((_event, success) => {
      if (!success) drag.set(withSpring(0, SHEET_SPRING));
    });

  return (
    <GestureHandlerRootView style={styles.screen} testID="auth-screen">
      <StatusBar style="dark" />
      <Animated.View
        style={[styles.backdrop, { width, height: backdropHeight }, backdropStyle]}
        pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Image source={ORIGINAL} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} />
        <Animated.View style={[StyleSheet.absoluteFill, colorStyle]}>
          <Image
            source={BACKGROUND}
            style={[styles.referenceScene, { top: -backdropHeight * 0.025, height: backdropHeight * 0.94 }]}
            contentFit="fill" transition={0} priority="high" onDisplay={() => setBackgroundReady(true)} />
          <View style={styles.sceneVeil} />
        </Animated.View>
        <LinearGradient
          colors={['rgba(237,242,249,0)', 'rgba(237,242,249,0.28)', 'rgba(237,242,249,0.94)']}
          locations={[0, 0.46, 1]} style={styles.groundFade} />
      </Animated.View>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.ScrollView
          onScroll={onScroll} scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom + 4, 38) }]}>
          <Animated.View
            testID="auth-panel-reveal" style={[styles.panelReveal, sheetStyle]}
            pointerEvents={introComplete ? 'auto' : 'none'}
            accessibilityElementsHidden={!introComplete} importantForAccessibility={introComplete ? 'auto' : 'no-hide-descendants'}
            layout={layout}>
            <SignInBrand testIDPrefix="auth" />
            <View style={styles.panelSurface}>
              <LinearGradient colors={AuthPanel.glass} style={StyleSheet.absoluteFill} pointerEvents="none" />
              <GestureDetector gesture={pan}>
                <View style={styles.dragEdge} collapsable={false} />
              </GestureDetector>
              <SignInPanel progress={contentReveal} onFocusChange={setFocused} />
            </View>
          </Animated.View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden', backgroundColor: AuthPanel.backdrop },
  backdrop: { position: 'absolute', top: 0, left: 0 },
  referenceScene: { position: 'absolute', left: 0, right: 0 },
  sceneVeil: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,255,255,0.22)' },
  groundFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '34%' },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 12 },
  panelReveal: {
    width: '100%', maxWidth: 460, alignSelf: 'center',
  },
  panelSurface: {
    overflow: 'hidden',
    borderRadius: AuthPanel.panelRadius, boxShadow: AuthPanel.panelShadow,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)',
  },
  dragEdge: { height: 19, width: '100%' },
});
