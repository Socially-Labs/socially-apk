import { InterFont } from '@/constants/fonts';
import { DiscoverPalette as D } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const discoveryStyles = StyleSheet.create({
  title: { fontFamily: InterFont.semiBold, fontSize: D.titleSize, letterSpacing: -1, color: D.ink },
  heading: { fontFamily: InterFont.semiBold, fontSize: 19, letterSpacing: -0.4, color: D.ink },
  body: { fontFamily: InterFont.regular, fontSize: 14, lineHeight: 21, color: D.secondary },
  label: { fontFamily: InterFont.medium, fontSize: 12, lineHeight: 17, color: D.secondary },
  eyebrow: { fontFamily: InterFont.semiBold, fontSize: 10, letterSpacing: 1.6, color: D.secondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  card: { backgroundColor: D.surface, borderRadius: D.radius, padding: 20, borderWidth: 1, borderColor: D.line, gap: 16 },
  button: { minHeight: 48, borderRadius: 15, backgroundColor: D.ink, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 18 },
  buttonText: { fontFamily: InterFont.semiBold, fontSize: 14, color: D.heroInk },
  divider: { height: 1, backgroundColor: D.line },
});
