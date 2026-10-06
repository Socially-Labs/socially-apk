import { useCallback, useEffect, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useBackendAccount } from '@/auth/backend-account-provider';
import { useAuthCompletion } from '@/auth/auth-completion-provider';
import { useAccountSettings } from '@/components/settings/settings-provider';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { successFeedback } from '@/components/shared/feedback';
import { BrandFont, InterFont } from '@/constants/fonts';
import { AuthPanel as A } from '@/constants/theme';
import { AuthMorphIcon } from './auth-morph-icon';
import { AuthPrimaryAction } from './auth-primary-action';

const SUCCESS_HOLD_MS = 1800;

export function AuthSuccessSheet() {
  const { pending, complete } = useAuthCompletion();
  const { account, status } = useBackendAccount();
  const { ready, loadError } = useAccountSettings();
  if (!pending || status !== 'ready' || !account || !ready || loadError) return null;
  return <SuccessPresentation key={account.id} needsOnboarding={account.username === null} onComplete={complete} />;
}

function SuccessPresentation({ needsOnboarding, onComplete }: { needsOnboarding: boolean; onComplete: () => void }) {
  const reduceMotion = useReducedMotion();
  const [closing, setClosing] = useState(false);
  const progress = useSharedValue(0);
  const close = useCallback(() => setClosing(true), []);
  useEffect(() => {
    Keyboard.dismiss();
    successFeedback();
    progress.set(reduceMotion ? 1 : withTiming(1, { duration: SUCCESS_HOLD_MS, easing: Easing.linear }));
    const timeout = setTimeout(close, SUCCESS_HOLD_MS);
    return () => { clearTimeout(timeout); cancelAnimation(progress); };
  }, [close, progress, reduceMotion]);
  const bar = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.get() }] }));
  return <DashboardSheet visible={!closing} title="You’re signed in" onClose={close} onDismiss={onComplete}
    footer={<AuthPrimaryAction testID="auth-success-continue" label={needsOnboarding ? 'Set up my profile' : 'Enter Socially'} onPress={close} />}>
    <View style={styles.content} testID="auth-success-sheet">
      <View style={styles.seal}><AuthMorphIcon state="success" from="lock" size={40} /></View>
      <Text accessibilityRole="header" style={styles.title}>Welcome aboard.</Text>
      <Text style={styles.copy}>{needsOnboarding ? 'Let’s choose your username and your place on Socially.' : 'Your account is ready. Your next voyage starts here.'}</Text>
      <View style={styles.progressTrack} accessible={false}><Animated.View style={[styles.progressBar, bar]} /></View>
      <Text accessibilityLiveRegion="polite" style={styles.hint}>{needsOnboarding ? 'Continuing to profile setup…' : 'Taking you to Socially…'}</Text>
    </View>
  </DashboardSheet>;
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6 },
  seal: { width: 88, height: 88, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: A.successSurface, borderWidth: 1, borderColor: A.glassBorder, marginBottom: 20 },
  title: { fontFamily: BrandFont.editorial, fontSize: 33, lineHeight: 40, color: A.ink, textAlign: 'center' },
  copy: { fontFamily: InterFont.regular, fontSize: 14, lineHeight: 22, color: A.secondary, textAlign: 'center', marginTop: 10, maxWidth: 310 },
  progressTrack: { width: 64, height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: A.border, marginTop: 23 },
  progressBar: { width: '100%', height: '100%', backgroundColor: A.primary, borderRadius: 2, transformOrigin: 'left center' },
  hint: { fontFamily: InterFont.medium, fontSize: 11, lineHeight: 18, color: A.secondary, marginTop: 10 },
});
