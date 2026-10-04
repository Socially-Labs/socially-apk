import { InterFont } from '@/constants/fonts';
import { SettingsPalette as S } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const sharedStyles = StyleSheet.create({
  flex: { flex: 1 },
  copy: { fontFamily: InterFont.regular, fontSize: 14, lineHeight: 21, color: S.secondary, flexShrink: 1 },
  label: { fontFamily: InterFont.medium, fontSize: 13, lineHeight: 19, color: S.ink, marginTop: 6 },
  note: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 18, color: S.secondary },
  input: { backgroundColor: S.field, borderRadius: 14, borderColor: S.line, borderWidth: 1, padding: 14, minHeight: 50, fontFamily: InterFont.regular, fontSize: 15, lineHeight: 21, color: S.ink },
  optionText: { fontFamily: InterFont.medium, fontSize: 12, lineHeight: 17, color: S.ink },
  success: { fontFamily: InterFont.medium, fontSize: 13, lineHeight: 19, color: S.accent },
  itemTitle: { fontFamily: InterFont.medium, fontSize: 15, lineHeight: 21, color: S.ink },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: S.line, marginVertical: 5 },
  heroIcon: { height: 66, width: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: S.badge, marginBottom: 4 },
  heroTitle: { fontFamily: InterFont.semiBold, fontSize: 22, lineHeight: 29, color: S.ink, letterSpacing: -0.5 },
  link: { fontFamily: InterFont.medium, fontSize: 13, lineHeight: 20, color: S.accent },
  inlineAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 48, gap: 8 },
  inlineActionText: { fontFamily: InterFont.medium, fontSize: 14, lineHeight: 20, color: S.accent },
});
