import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authErrorMessage } from '@/auth/auth-errors';
import { useAuth } from '@/auth/session';
import { InterFont } from '@/constants/fonts';

export default function HomeScreen() {
  const { email, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await logout();
    } catch (cause) {
      setError(authErrorMessage(cause, 'logout'));
      setPending(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 32 }]}>
      <Image source={require('@/assets/images/icon-cutout.png')} style={styles.icon} contentFit="contain" />
      <Text style={styles.wordmark}>SOCIALLY</Text>
      <Text accessibilityRole="header" style={styles.title}>You’re aboard.</Text>
      <Text style={styles.description}>Your Socially account is ready.</Text>
      <View style={styles.account}>
        <Text style={styles.label}>SIGNED IN AS</Text>
        <Text selectable style={styles.email}>{email ?? 'Your Socially account'}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: pending, busy: pending }}
        disabled={pending}
        onPress={() => { void signOut(); }}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}>
        {pending ? <ActivityIndicator color="#303E49" /> : <Text style={styles.buttonText}>Sign out</Text>}
      </Pressable>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E6ECF0' },
  content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 28, paddingBottom: 32 },
  icon: { width: 96, height: 96, marginBottom: 20 },
  wordmark: { fontFamily: InterFont.black, fontSize: 12, letterSpacing: 3, color: '#303E49' },
  title: { fontFamily: InterFont.semiBold, fontSize: 32, color: '#303E49', marginTop: 32 },
  description: { fontFamily: InterFont.regular, fontSize: 15, color: '#536570', marginTop: 12 },
  account: { width: '100%', maxWidth: 420, padding: 24, backgroundColor: '#F5F8FA', borderRadius: 20, gap: 12, marginTop: 32 },
  label: { fontFamily: InterFont.semiBold, fontSize: 10, letterSpacing: 1.4, color: '#536570' },
  email: { fontFamily: InterFont.medium, fontSize: 16, color: '#303E49' },
  button: { minHeight: 48, paddingHorizontal: 24, justifyContent: 'center', marginTop: 24 },
  buttonText: { fontFamily: InterFont.semiBold, fontSize: 14, color: '#303E49' },
  error: { fontFamily: InterFont.regular, fontSize: 12, color: '#A3333F', textAlign: 'center' },
});
