import { InterFont } from '@/constants/fonts';
import { DiscoverPalette as D } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const sharedStyles = StyleSheet.create({
  metricLabel: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: D.secondary },
  identityCopy: { flex: 1, gap: 5 },
});
