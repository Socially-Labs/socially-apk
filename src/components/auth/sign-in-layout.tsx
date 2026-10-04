import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing, Extrapolation, LinearTransition, cancelAnimation, interpolate,
  useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignInBrand } from '@/components/auth/sign-in-brand';
import { SignInPanel } from '@/components/auth/sign-in-panel';
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

  useEffect(() => {
    contentReveal.set(enabled ? (reduceMotion ? 1 : withTiming(1, { duration: 520, easing: Easing.linear })) : 0);
    return () => cancelAnimation(contentReveal);
  }, [enabled, reduceMotion, contentReveal]);

  const brandStyle = useAnimatedStyle(() => ({ opacity: reveal.get() }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(reveal.get(), [0, 0.4], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: reduceMotion ? 0 : (1 - reveal.get()) * 36 }],
  }));

  return (
    <KeyboardAvoidingView style={StyleSheet.absoluteFill}
      pointerEvents={enabled ? 'box-none' : 'none'}
      accessibilityElementsHidden={!enabled}
      importantForAccessibility={enabled ? 'auto' : 'no-hide-descendants'}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Animated.ScrollView style={styles.scroll}
        contentContainerStyle={[styles.content, {
          paddingTop: Math.max(insets.top + 20, 44),
          paddingBottom: Math.max(insets.bottom + 12, 24),
        }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={brandStyle}>
          <SignInBrand testIDPrefix={testIDPrefix} />
        </Animated.View>
        <Pressable style={styles.dismissArea} onPress={Keyboard.dismiss} accessible={false} />
        <Animated.View
          testID={testIDPrefix === 'splash' ? 'splash-sign-in' : 'auth-panel-reveal'}
          layout={reduceMotion ? undefined : LinearTransition.duration(280)}
          style={[styles.card, cardStyle]}>
          <LinearGradient colors={AuthPanel.glass} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <SignInPanel progress={contentReveal} testIDPrefix={testIDPrefix} />
        </Animated.View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20 },
  dismissArea: { flex: 1, minHeight: 36 },
  card: {
    width: '100%', maxWidth: 420, alignSelf: 'center', overflow: 'hidden',
    paddingTop: 20, borderRadius: AuthPanel.panelRadius,
    borderWidth: 1, borderColor: AuthPanel.glassBorder,
    boxShadow: AuthPanel.panelShadow,
  },
});
