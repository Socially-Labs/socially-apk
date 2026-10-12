import { useEffect, type RefObject } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import Animated, { cancelAnimation, Easing, interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { AuthPanel as A } from '@/constants/theme';
import { InterFont } from '@/constants/fonts';

export function AuthOtpInput({ input, code, onChange, busy, focused, invalid, testIDPrefix, onFocus, onBlur, onSubmit }: {
  input: RefObject<TextInput | null>; code: string; onChange: (value: string) => void; busy: boolean;
  focused: boolean; invalid: boolean; testIDPrefix: string; onFocus: () => void; onBlur: () => void; onSubmit: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const shake = useSharedValue(0);
  useEffect(() => {
    if (busy) return;
    // Reanimated's web enter transition reparents the field; focus after it settles.
    const timeout = setTimeout(() => input.current?.focus(), Platform.OS === 'web' && !reduceMotion ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [input, reduceMotion, busy]);
  useEffect(() => {
    if (invalid && !reduceMotion) shake.set(withSequence(withTiming(-4, { duration: 55 }), withTiming(4, { duration: 70 }), withTiming(-2, { duration: 60 }), withTiming(0, { duration: 60 })));
    else shake.set(0);
    return () => cancelAnimation(shake);
  }, [invalid, reduceMotion, shake]);
  const motion = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));
  return <Animated.View style={[styles.frame, motion]} testID={`${testIDPrefix}-otp-input`}>
    <View style={styles.slots} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: 6 }, (_, index) => <DigitSlot key={index} digit={code[index] ?? ''} active={focused && index === Math.min(code.length, 5)} invalid={invalid} index={index} />)}
    </View>
    <TextInput ref={input} testID={`${testIDPrefix}-code`} accessibilityLabel="6-digit verification code"
      accessibilityHint="Enter or paste the six digits from your email. Verification starts automatically."
      style={styles.input} value={code} onChangeText={onChange} editable={!busy}
      onFocus={onFocus} onBlur={onBlur} keyboardType="number-pad" inputMode="numeric"
      autoComplete={Platform.OS === 'ios' ? undefined : 'one-time-code'} textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : undefined}
      autoCapitalize="none" autoCorrect={false} spellCheck={false} maxLength={12}
      caretHidden selectionColor="transparent" underlineColorAndroid="transparent"
      selectTextOnFocus={invalid} returnKeyType={Platform.OS === 'android' ? 'none' : 'default'} onSubmitEditing={onSubmit} />
  </Animated.View>;
}

function DigitSlot({ digit, active, invalid, index }: { digit: string; active: boolean; invalid: boolean; index: number }) {
  const reduceMotion = useReducedMotion();
  const emphasis = useSharedValue(0);
  const fill = useSharedValue(digit ? 1 : 0);
  useEffect(() => {
    emphasis.set(reduceMotion ? Number(active) : withTiming(Number(active), { duration: 180 }));
    fill.set(reduceMotion ? Number(!!digit) : withTiming(Number(!!digit), { duration: 180, easing: Easing.out(Easing.cubic) }));
    return () => { cancelAnimation(emphasis); cancelAnimation(fill); };
  }, [active, digit, reduceMotion, emphasis, fill]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(emphasis.get(), [0, 1], [A.otpSurface, A.surface]),
    borderColor: invalid ? A.error : interpolateColor(emphasis.get(), [0, 1], [A.border, A.primary]),
    transform: [{ translateY: reduceMotion ? 0 : -2 * emphasis.get() }],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: 0.5 + fill.get() * 0.5, transform: [{ scale: reduceMotion ? 1 : 0.9 + fill.get() * 0.1 }] }));
  return <Animated.View style={[styles.slot, style]} testID={`otp-digit-${index}`}>
    {digit ? <Animated.Text style={[styles.digit, textStyle]}>{digit}</Animated.Text> : <View testID={`otp-placeholder-${index}`} style={[styles.dash, active && styles.activeDash]} />}
  </Animated.View>;
}

const styles = StyleSheet.create({
  frame: { width: '100%', marginTop: 14, marginBottom: 12 },
  slots: { flexDirection: 'row', gap: 6 },
  slot: { flex: 1, minWidth: 0, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, backgroundColor: A.otpSurface },
  digit: { fontFamily: InterFont.medium, fontSize: 25, lineHeight: 34, color: A.ink, fontVariant: ['tabular-nums'] },
  dash: { position: 'absolute', bottom: 11, width: 12, height: 2, borderRadius: 1, backgroundColor: A.focusBorder, opacity: 0.45 },
  activeDash: { backgroundColor: A.primary, opacity: 0.8 },
  input: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, color: 'transparent', backgroundColor: 'transparent', fontSize: 25, borderWidth: 0, outlineWidth: 0, opacity: 0.03 },
});
