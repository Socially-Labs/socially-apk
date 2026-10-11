import { KeyboardScrollView } from '@/components/shared/keyboard/keyboard-scroll-view';
import { useKeyboardVisible } from '@/components/shared/keyboard/use-keyboard-visible';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing, Extrapolation, cancelAnimation, interpolate,
  useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignInBrand } from '@/components/auth/sign-in-brand';
import { SignInPanel } from '@/components/auth/sign-in-panel';
import { SheetSurface, sheetMaterialStyle } from '@/components/shared/dashboard/sheet-surface';
import { AuthPanel } from '@/constants/theme';

/** Both launch sign-in and the returning auth route use the same form and framing. */
export function SignInLayout({ reveal, testIDPrefix, enabled = true }: {
  reveal: SharedValue<number>;
  testIDPrefix: 'auth' | 'splash';
  enabled?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const contentReveal = useSharedValue(0);
  const stepReveal = useSharedValue(1);
  const [stage, setStage] = useState('credentials');
  const keyboardVisible = useKeyboardVisible();
  const { height } = useWindowDimensions();
  const compact = keyboardVisible || height < 600;
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    // The compact form fits from its top; discard the tall-layout offset once.
    if (compact) scroll.current?.scrollTo({ y: 0, animated: false });
  }, [compact]);

  useEffect(() => {
    contentReveal.set(0);
    contentReveal.set(enabled ? (reduceMotion ? 1 : withTiming(1, { duration: 520, easing: Easing.linear })) : 0);
    return () => cancelAnimation(contentReveal);
  }, [enabled, reduceMotion, contentReveal, stage]);

  useEffect(() => {
    if (!enabled || stage === 'credentials') { stepReveal.set(1); return; }
    stepReveal.set(reduceMotion ? 1 : 0);
    if (!reduceMotion) stepReveal.set(withSpring(1, { damping: 28, stiffness: 240, mass: 0.9, overshootClamping: true }));
    return () => cancelAnimation(stepReveal);
  }, [stage, enabled, reduceMotion, stepReveal]);

  const brandStyle = useAnimatedStyle(() => ({ opacity: reveal.get() }));
  const cardStyle = useAnimatedStyle(() => ({
    // Native glass must never have a fully transparent ancestor during its reveal.
    opacity: Math.max(0.01, interpolate(reveal.get(), [0, 0.4], [0, 1], Extrapolation.CLAMP) * stepReveal.get()),
    transform: [{ translateY: reduceMotion ? 0 : (1 - reveal.get() * stepReveal.get()) * 36 }],
  }));

  return (
    <KeyboardAvoidingView style={StyleSheet.absoluteFill}
      pointerEvents={enabled ? 'box-none' : 'none'}
      accessibilityElementsHidden={!enabled}
      importantForAccessibility={enabled ? 'auto' : 'no-hide-descendants'}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <KeyboardScrollView ref={scroll} focusClearance={compact ? 120 : 160} style={styles.scroll}
        contentContainerStyle={[styles.content, {
          paddingTop: compact ? insets.top + 8 : Math.max(insets.top + 20, 44),
          paddingBottom: compact ? 16 : Math.max(insets.bottom + 12, 24),
        }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={[brandStyle, compact && styles.hiddenBrand]}>
          <SignInBrand testIDPrefix={testIDPrefix} />
        </Animated.View>
        <Pressable style={[styles.dismissArea, compact && styles.compactDismiss]} onPress={Keyboard.dismiss} accessible={false} />
        <Animated.View
          testID={testIDPrefix === 'splash' ? 'splash-sign-in' : 'auth-panel-reveal'}
          style={[styles.card, compact && styles.compactCard, sheetMaterialStyle, cardStyle]}>
          <SheetSurface />
          {enabled ? <SignInPanel progress={contentReveal} testIDPrefix={testIDPrefix} onStageChange={setStage} /> : null}
        </Animated.View>
      </KeyboardScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  hiddenBrand: { display: 'none' },
  compactDismiss: { flex: 0, minHeight: 0 },
  compactCard: { paddingTop: 12 },
  content: { flexGrow: 1, paddingHorizontal: 14 },
  dismissArea: { flex: 1, minHeight: 36 },
  card: {
    width: '100%', maxWidth: 420, alignSelf: 'center', overflow: 'hidden',
    paddingTop: 22, borderRadius: AuthPanel.panelRadius,
    borderWidth: 1, borderColor: AuthPanel.glassBorder,
    boxShadow: AuthPanel.panelShadow,
  },
});
