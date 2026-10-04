import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { Motion } from '@/constants/motion';
import { SettingsPalette as S } from '@/constants/theme';
import { Check } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

import { sharedStyles } from './settings-detail-styles';

export function Action({ label, onPress, disabled = false, busy = false, secondary = false, testID }: {
  label: string; onPress: () => void; disabled?: boolean; busy?: boolean; secondary?: boolean; testID?: string;
}) {
  const reduceMotion = useReducedMotion();
  return <AuthButton accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, busy }} testID={testID}
    onPress={onPress} disabled={disabled} style={[styles.action, secondary && styles.secondaryAction, disabled && styles.disabled]}>
    <Animated.View key={busy ? 'busy' : label} entering={reduceMotion ? undefined : FadeIn.duration(Motion.feedback)} style={styles.actionContent}>
      {busy ? <ActivityIndicator color={S.primaryInk} /> : label === 'Saved' ? <Check size={18} color={S.primaryInk} /> : null}
      <Text style={[styles.actionText, secondary && styles.secondaryActionText]}>{label}</Text>
    </Animated.View>
  </AuthButton>;
}

export function Card({ children }: { children: ReactNode }) { return <View style={styles.card}>{children}</View>; }

export function ErrorCopy({ children }: { children: string | null }) { return children ? <Text style={styles.error} accessibilityRole="alert">{children}</Text> : null; }

const styles = StyleSheet.create({
  ...sharedStyles,
  actionContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  card: { padding: 20, borderRadius: S.cardRadius, backgroundColor: S.surface, gap: 14, marginBottom: 16 },
  action: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 16, backgroundColor: S.primary, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  actionText: { fontFamily: InterFont.medium, fontSize: 14, lineHeight: 20, color: S.primaryInk, textAlign: 'center' },
  secondaryAction: { backgroundColor: S.iconWell },
  secondaryActionText: { color: S.ink },
  disabled: { opacity: 0.55 },
  error: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 20, color: S.danger },
});
