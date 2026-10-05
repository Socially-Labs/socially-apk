import { StatusBar } from 'expo-status-bar';
import { type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dashboard, SettingsPalette as S } from '@/constants/theme';

export function SettingsSurface({ children, testID, keyboardAvoided = false, compact = false }: {
  children: ReactNode; testID?: string; keyboardAvoided?: boolean; compact?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return <View style={styles.screen} testID={testID}>
    <StatusBar style="dark" />
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} automaticallyAdjustKeyboardInsets={!keyboardAvoided}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 12, compact ? 46 : 54), paddingBottom: compact ? Math.max(insets.bottom + 104, 112) : Math.max(insets.bottom + 120, 142) }]}>
      <View style={styles.measure}>{children}</View>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: S.background },
  content: { flexGrow: 1, paddingHorizontal: 20 },
  measure: { width: '100%', maxWidth: Dashboard.maxWidth, alignSelf: 'center' },
});
