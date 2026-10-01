import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing, Extrapolation, LinearTransition, cancelAnimation, interpolate,
  useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignInPanel } from '@/components/sign-in-panel';
import { SignInBrand } from '@/components/sign-in-brand';
import { AuthPanel } from '@/constants/theme';

/** The reference panel floats above the existing voyage artwork. */
export function SplashSignInCard({ reveal }: { reveal: SharedValue<number> }) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const contentReveal = useSharedValue(0);
  const layout = reduceMotion ? undefined : LinearTransition.duration(280);

  useEffect(() => {
    contentReveal.set(reduceMotion ? 1 : withTiming(1, { duration: 620, easing: Easing.linear }));
    return () => cancelAnimation(contentReveal);
  }, [reduceMotion, contentReveal]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(reveal.get(), [0, 0.4], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: reduceMotion ? 0 : (1 - reveal.get()) * 120 }],
  }));

  return (
    <KeyboardAvoidingView
      style={StyleSheet.absoluteFill} pointerEvents="box-none"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, {
          paddingTop: insets.top + 16,
          paddingBottom: Math.max(insets.bottom + 4, 38),
        }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}>
        <Pressable style={styles.dismissArea} onPress={Keyboard.dismiss} accessible={false} />
        <Animated.View style={cardStyle}>
          <SignInBrand testIDPrefix="splash" />
        </Animated.View>
        <Animated.View testID="splash-sign-in" layout={layout} style={[styles.card, cardStyle]}>
          <LinearGradient colors={AuthPanel.glass} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <SignInPanel progress={contentReveal} testIDPrefix="splash" />
        </Animated.View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 12 },
  dismissArea: { flex: 1, minHeight: 16 },
  card: {
    width: '100%', maxWidth: 460, alignSelf: 'center', overflow: 'hidden',
    paddingTop: 19, borderRadius: AuthPanel.panelRadius,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)',
    boxShadow: AuthPanel.panelShadow,
  },
});
