import { useCallback, useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { InterFont } from '@/constants/fonts';
import { DashboardSheetTheme as C } from '@/constants/theme/dashboard';
import { SailingShip } from './sailing-ship';
import { RefreshIndicatorContext } from './refresh-indicator-context';

/** One status per request region. Unmount on completion, failure or cancellation. */
export function ShipLoader({ label, compact = false, active = true, showLabel = true }: {
  label: string; compact?: boolean; active?: boolean; showLabel?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const pullIndicatorVisible = useContext(RefreshIndicatorContext);
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));
  if (pullIndicatorVisible) return null;
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={label}
    accessibilityState={{ busy: active }} testID="ship-loader"
    style={[s.root, compact && s.compact]}>
    <SailingShip active={active && focused} width={compact ? 72 : 104} />
    {showLabel ? <Text style={s.label}>{label}</Text> : null}
  </View>;
}

const s = StyleSheet.create({
  root: { minHeight: 104, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 4 },
  compact: { minHeight: 78 },
  label: { fontFamily: InterFont.regular, color: C.secondary, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
