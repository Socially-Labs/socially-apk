import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { DashboardSheetTheme as S } from '@/constants/theme';

// Filter at the panel boundary: a clipped descendant cannot sample the page
// behind its parent. Backdrop filtering keeps the panel's own text sharp.
export const sheetMaterialStyle: ViewStyle & { backdropFilter: string; WebkitBackdropFilter: string } = {
  backgroundColor: 'rgba(239,247,255,0.35)',
  backdropFilter: S.blur,
  WebkitBackdropFilter: S.blur,
};

export function SheetSurface() {
  return <View style={StyleSheet.absoluteFill} pointerEvents="none" aria-hidden>
    <LinearGradient colors={S.gradient} style={StyleSheet.absoluteFill} />
  </View>;
}
