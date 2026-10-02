import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { authErrorMessage } from '@/auth/auth-errors';
import { useAuth } from '@/auth/session';
import { useTestAccess } from '@/auth/test-access';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { SettingsPalette as S } from '@/constants/theme';

export function LogoutSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { logout, isAuthenticated } = useAuth();
  const { hasTestAccess, leaveTestApp } = useTestAccess();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const previewing = hasTestAccess && !isAuthenticated;
  const close = () => { if (!busy.current) { setError(null); onClose(); } };
  async function signOut() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      if (!previewing) await logout();
      // Revoke preview access too, so a successful logout always leaves the app.
      leaveTestApp();
      onClose();
    } catch (cause) { setError(authErrorMessage(cause, 'logout')); }
    finally { busy.current = false; setPending(false); }
  }
  return <DashboardSheet visible={visible} title={previewing ? 'Leave preview?' : 'Log out?'} onClose={close}>
    <View style={styles.content}>
      <Text style={styles.copy}>{previewing ? 'You’ll return to the sign-in screen. Your saved profile will be here when you come back.' : 'You can sign back in anytime. Your account and saved profile will stay with you.'}</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <AuthButton testID="settings-confirm-logout" accessibilityRole="button" accessibilityState={{ disabled: pending, busy: pending }}
        disabled={pending} onPress={() => { void signOut(); }} style={styles.confirm}>
        {pending ? <ActivityIndicator color={S.primaryInk} /> : <Text style={styles.confirmText}>{previewing ? 'Back to sign in' : 'Log out'}</Text>}
      </AuthButton>
      <AuthButton accessibilityRole="button" onPress={close} disabled={pending} style={styles.cancel}><Text style={styles.cancelText}>Stay aboard</Text></AuthButton>
    </View>
  </DashboardSheet>;
}
const styles = StyleSheet.create({
  content: { gap: 14 },
  copy: { fontFamily: InterFont.regular, fontSize: 14, lineHeight: 21, color: S.secondary },
  confirm: { minHeight: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: S.danger },
  confirmText: { fontFamily: InterFont.medium, fontSize: 14, color: S.primaryInk },
  cancel: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: InterFont.medium, fontSize: 14, color: S.ink },
  error: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 19, color: S.danger },
});
