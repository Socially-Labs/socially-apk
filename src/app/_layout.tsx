import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { SplashOverlay } from '@/components/splash-screen';
import { InterFontMap } from '@/constants/fonts';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 200 });

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [splashComplete, setSplashComplete] = useState(false);
  const completeSplash = useCallback(() => setSplashComplete(true), []);
  // On native these are usually already embedded by the expo-font config plugin
  // (app.json), so this resolves fast. It is what makes them work on web and in
  // Expo Go, where the config plugin does not apply.
  const [fontsLoaded, fontError] = useFonts(InterFontMap);

  // Render nothing until the fonts resolve, otherwise the first frame paints with
  // the system fallback and visibly reflows. The native splash stays up until
  // SplashOverlay hides it.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.root}>
        <View
          style={styles.root}
          accessibilityElementsHidden={!splashComplete}
          importantForAccessibility={splashComplete ? 'auto' : 'no-hide-descendants'}>
          <AppTabs />
        </View>
        {!splashComplete && <SplashOverlay onComplete={completeSplash} />}
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
