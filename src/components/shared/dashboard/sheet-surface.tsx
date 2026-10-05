import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';

import { DashboardSheetTheme as S } from '@/constants/theme';

const glassAvailable = Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
export const sheetMaterialStyle = undefined;

/** Decorative material only; controls stay on a separate, fully opaque layer. */
export function SheetSurface() {
  const [reduceTransparency, setReduceTransparency] = useState(true);
  useEffect(() => {
    if (!glassAvailable) return;
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then(value => {
      if (active) setReduceTransparency(value);
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
    return () => { active = false; subscription.remove(); };
  }, []);

  const glass = glassAvailable && !reduceTransparency;
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[StyleSheet.absoluteFill, !glass && styles.fallback]}>
    {glass ? <GlassView style={StyleSheet.absoluteFill} glassEffectStyle="regular" colorScheme="light" tintColor={S.glassTint} /> : null}
    <LinearGradient colors={S.gradient} style={StyleSheet.absoluteFill} />
  </View>;
}

const styles = StyleSheet.create({ fallback: { backgroundColor: S.surface } });
