import { InterFont } from '@/constants/fonts';
import { DiscoverPalette as D } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const sharedStyles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  reasonIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: D.accentTint },
  cardHeading: { fontFamily: InterFont.medium, fontSize: 13, lineHeight: 19, color: D.ink },
});
