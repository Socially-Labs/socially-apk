// Browser verification entry; never imported by the production application.
import { useState } from 'react';
// @ts-expect-error This browser-only fixture uses React DOM without adding production typings.
import { createRoot } from 'react-dom/client';
import { View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { AuthContext } from '@/auth/session';
import { AuthCompletionProvider } from '@/auth/auth-completion-provider';
import { BackendAccountProvider } from '@/auth/backend-account-provider';
import { TestAccessProvider } from '@/auth/test-access';
import { SettingsProvider } from '@/components/settings/settings-provider';
import { SignInPanel } from '@/components/auth/sign-in-panel';
import { AuthSuccessSheet } from '@/components/auth/auth-success-sheet';
import AuthScreen from '@/components/auth/auth-screen';
import { IntroCompleteContext } from '@/components/auth/intro-context';
import { useAppAccess } from '@/hooks/use-app-access';
import { AppFontMap } from '@/constants/fonts';
import { useFonts } from 'expo-font';

declare global { interface Window { otpVerifyCalls: number; otpReject: boolean; otpRestored: boolean; otpFullScreen?: boolean } }
window.otpVerifyCalls = 0;

function Harness() {
  const [authenticated, setAuthenticated] = useState(window.otpRestored ?? false);
  useFonts(AppFontMap);
  return <SafeAreaProvider><GestureHandlerRootView style={{ flex: 1 }}><TestAccessProvider>
    <AuthContext.Provider value={{ isReady: true, isConfigured: true, isAuthenticated: authenticated,
      accountId: authenticated ? 'did:privy:fixture' : null, email: authenticated ? 'crew@example.com' : null,
      sendCode: async () => {}, verifyCode: async () => {
        window.otpVerifyCalls++;
        await new Promise(resolve => setTimeout(resolve, 350));
        if (window.otpReject) throw new Error('invalid_code');
        setAuthenticated(true);
      }, loginWithSocial: async () => setAuthenticated(true), oauthPending: false, oauthError: null,
      logout: async () => setAuthenticated(false), getAccessToken: async () => 'fixture-access-token' }}>
      <AuthCompletionProvider><BackendAccountProvider><SettingsProvider><Preview /></SettingsProvider></BackendAccountProvider></AuthCompletionProvider>
    </AuthContext.Provider>
  </TestAccessProvider></GestureHandlerRootView></SafeAreaProvider>;
}

function Preview() {
  const progress = useSharedValue(1);
  const { canEnterApp } = useAppAccess();
  if (window.otpFullScreen) return <IntroCompleteContext.Provider value={true}>
    {canEnterApp ? <Text testID="fixture-home">Account opened</Text> : <AuthScreen />}
    <AuthSuccessSheet />
  </IntroCompleteContext.Provider>;
  return <View style={{ flex: 1, backgroundColor: '#E4EDF5', justifyContent: 'flex-end', padding: 14 }}>
    {canEnterApp ? <Text testID="fixture-home">Account opened</Text> : <View style={{ backgroundColor: '#fff', borderRadius: 36, paddingTop: 22, width: '100%', maxWidth: 420, alignSelf: 'center' }}>
      <SignInPanel progress={progress} testIDPrefix="auth" />
    </View>}
    <AuthSuccessSheet />
  </View>;
}

createRoot(document.getElementById('root')!).render(<Harness />);
