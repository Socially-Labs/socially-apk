import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AuthIcon } from '@/components/auth/auth-icons';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { AuthPanel } from '@/constants/theme';

export function AuthPrimaryAction({ label, testID, onPress, disabled = false, busy = false }: {
  label: string; testID: string; onPress: () => void; disabled?: boolean; busy?: boolean;
}) {
  return <AuthButton testID={testID} accessibilityRole="button" accessibilityState={{ disabled, busy }}
    onPress={onPress} disabled={disabled} style={[styles.button, disabled && styles.disabled]}>
    <LinearGradient colors={AuthPanel.primaryGradient} style={StyleSheet.absoluteFill} pointerEvents="none" />
    <Text style={styles.label}>{label}</Text>
    <View style={styles.arrow}>{busy ? <ActivityIndicator color={AuthPanel.surface} size="small" /> : <AuthIcon name="arrow" size={21} />}</View>
  </AuthButton>;
}

const styles = StyleSheet.create({
  button: { minHeight: AuthPanel.controlHeight, borderRadius: AuthPanel.controlRadius, overflow: 'hidden', paddingHorizontal: 38, paddingVertical: 10,
    justifyContent: 'center', alignItems: 'center', backgroundColor: AuthPanel.primary, boxShadow: AuthPanel.buttonShadow },
  disabled: { opacity: 0.82 },
  label: { fontFamily: InterFont.semiBold, color: AuthPanel.surface, fontSize: AuthPanel.buttonSize, lineHeight: 22, textAlign: 'center' },
  arrow: { position: 'absolute', right: 17, top: 0, bottom: 0, justifyContent: 'center' },
});
