import { LogOut, Settings } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { authErrorMessage } from '@/auth/auth-errors';
import { useAuth } from '@/auth/session';
import { useTestAccess } from '@/auth/test-access';
import { DashboardShell } from '@/components/shared/dashboard/dashboard-shell';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { Dashboard } from '@/constants/theme';

export default function SettingsScreen() {
  const { email, logout, isAuthenticated } = useAuth();
  const { hasTestAccess, leaveTestApp } = useTestAccess();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewing = hasTestAccess && !isAuthenticated;

  async function signOut() {
    if (pending) return;
    if (previewing) {
      leaveTestApp();
      return;
    }
    setPending(true);
    setError(null);
    try { await logout(); }
    catch (cause) { setError(authErrorMessage(cause, 'logout')); }
    finally { setPending(false); }
  }

  return <DashboardShell testID="settings-dashboard">
    <View style={styles.heading}>
      <Settings size={24} color={Dashboard.icon} />
      <Text style={styles.title} accessibilityRole="header">Settings</Text>
    </View>
    <Text style={styles.copy}>Manage your account.</Text>
    <View style={styles.card}>
      <Text style={styles.section} accessibilityRole="header">Account</Text>
      {email ? <Text style={styles.email}>{email}</Text> : previewing ? <Text style={styles.email}>Preview account</Text> : null}
      <AuthButton testID="settings-sign-out" accessibilityRole="button" accessibilityState={{ disabled: pending, busy: pending }}
        onPress={() => { void signOut(); }} disabled={pending} style={styles.signOut}>
        {pending ? <ActivityIndicator color={Dashboard.ink} /> : <LogOut size={20} color={Dashboard.icon} />}
        <Text style={styles.signOutText}>{previewing ? 'Back to sign in' : 'Sign out'}</Text>
      </AuthButton>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  </DashboardShell>;
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: InterFont.semiBold, fontSize: 26, color: Dashboard.ink },
  copy: { fontFamily: InterFont.regular, fontSize: 14, color: Dashboard.secondary, marginTop: 12 },
  card: { marginTop: 30, padding: 20, borderRadius: 22, backgroundColor: Dashboard.glass },
  section: { fontFamily: InterFont.semiBold, fontSize: 17, color: Dashboard.ink },
  email: { fontFamily: InterFont.regular, fontSize: 14, color: Dashboard.secondary, marginTop: 10 },
  signOut: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  signOutText: { fontFamily: InterFont.medium, fontSize: 14, color: Dashboard.ink },
  error: { fontFamily: InterFont.regular, fontSize: 12, color: Dashboard.negative, marginTop: 8 },
});
