import { isRunningInExpoGo } from 'expo';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AuthProvider } from '@/auth/auth-provider';
import { useAuth } from '@/auth/session';
import { TestAccessProvider, useTestAccess } from '@/auth/test-access';
import { SplashOverlay } from '@/components/auth/splash/splash-screen';
import { BootLoadingScreen } from '@/components/auth/splash/boot-loading-screen';
import { IntroCompleteContext } from '@/components/auth/intro-context';
import { AppFontMap } from '@/constants/fonts';
import { SettingsProvider } from '@/components/settings/settings-provider';
import { DiscoverProvider } from '@/components/discover/discover-provider';

SplashScreen.preventAutoHideAsync().catch(() => {});
// Expo Go owns its native splash and cannot customize the fade animation.
if (!isRunningInExpoGo()) {
  SplashScreen.setOptions({ fade: true, duration: 200 });
}

// The fonts are embedded by the expo-font config plugin (app.json), so on native they
// settle almost immediately. The cap only exists so a font that never resolves cannot
// pin the native splash on screen forever.
const FONTS_FAILSAFE_MS = 4000;

export default function RootLayout() {
  return <TestAccessProvider><AuthProvider><AppLayout /></AuthProvider></TestAccessProvider>;
}

function AuthNavigator() {
  const reduceMotion = useReducedMotion();
  const { isAuthenticated } = useAuth();
  const { hasTestAccess } = useTestAccess();
  const canEnterApp = isAuthenticated || hasTestAccess;
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Protected guard={!canEnterApp}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={canEnterApp}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="account/[section]" options={{ animation: reduceMotion ? 'fade' : 'default', gestureEnabled: true, gestureDirection: 'horizontal' }} />
        <Stack.Screen name="captain/[id]" options={{ animation: reduceMotion ? 'fade' : 'default', gestureEnabled: true }} />
        <Stack.Screen name="invest/[id]" options={{ animation: reduceMotion ? 'fade' : 'default', gestureEnabled: true }} />
      </Stack.Protected>
    </Stack>
  );
}

function AppLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isReady } = useAuth();
  const { hasTestAccess } = useTestAccess();
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [introMode, setIntroMode] = useState<'app' | 'sign-in' | null>(null);
  const [splashComplete, setSplashComplete] = useState(false);
  const completeSplash = useCallback(() => setSplashComplete(true), []);
  // On native these are usually already embedded by the expo-font config plugin
  // (app.json), so this resolves fast. It is what makes them work on web and in
  // Expo Go, where the config plugin does not apply.
  const [fontsLoaded, fontError] = useFonts(AppFontMap);
  const [fontsTimedOut, setFontsTimedOut] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError || fontsTimedOut) return;
    const failsafe = setTimeout(() => setFontsTimedOut(true), FONTS_FAILSAFE_MS);
    return () => clearTimeout(failsafe);
  }, [fontsLoaded, fontError, fontsTimedOut]);

  const fontsSettled = fontsLoaded || fontError !== null || fontsTimedOut;
  const bootSettled = fontsSettled && (isReady || hasTestAccess || authTimedOut);
  const canEnterApp = isAuthenticated || hasTestAccess;
  // Decide once from the settled session; later sign-in keeps its existing exit fade.
  if (bootSettled && introMode === null) {
    setIntroMode(canEnterApp ? 'app' : 'sign-in');
    if (canEnterApp) setSplashComplete(true);
  }

  useEffect(() => {
    if (isReady || hasTestAccess) return;
    const failsafe = setTimeout(() => setAuthTimedOut(true), 2500);
    return () => clearTimeout(failsafe);
  }, [isReady, hasTestAccess]);

  useEffect(() => {
    if (introMode !== 'app') return;
    // Restored sessions open immediately; the logo never imposes a minimum wait.
    SplashScreen.hideAsync().catch(() => {});
  }, [introMode]);

  // Keep the navigator mounted while fonts load; the native splash covers it
  // until the overlay is ready. Keep both native wrappers too: switching
  // importantForAccessibility back to 'auto' otherwise allows Fabric to flatten
  // the inner View and reparent NativeTabs. Android's fragment restoration can
  // throw "[RNScreens] Unexpected fragment manager state" on that reattachment.
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.root} collapsable={false}>
        <View
          style={styles.root}
          collapsable={false}
          pointerEvents={splashComplete ? 'auto' : 'none'}
          accessibilityElementsHidden={!splashComplete}
          importantForAccessibility={splashComplete ? 'auto' : 'no-hide-descendants'}>
          <IntroCompleteContext.Provider value={splashComplete}>
            <SettingsProvider><DiscoverProvider><AuthNavigator /></DiscoverProvider></SettingsProvider>
          </IntroCompleteContext.Provider>
        </View>
        {introMode === 'sign-in' && !splashComplete && <SplashOverlay onComplete={completeSplash} />}
        {introMode === null && <BootLoadingScreen />}
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
