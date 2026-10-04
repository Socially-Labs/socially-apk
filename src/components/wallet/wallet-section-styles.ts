import { BrandFont, InterFont } from '@/constants/fonts';
import { WalletPalette as W } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const sharedStyles = StyleSheet.create({
  assetSymbol: { fontFamily: BrandFont.editorial, fontSize: 18, color: W.ink },
  caption: { fontFamily: InterFont.regular, fontSize: 10, lineHeight: 15, color: W.secondary },
  manageCopy: { flex: 1, gap: 3 },
  detailCopy: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 21, color: W.secondary, textAlign: 'center' },
});
