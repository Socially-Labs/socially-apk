import { Check, Globe2, LockKeyhole } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { InterFont } from '@/constants/fonts';
import { SettingsPalette as S } from '@/constants/theme';
import { Card } from './settings-detail-ui';

export function NetworkPreferences() {
  return <View testID="settings-network-options"><Card>
    <Text style={s.heading}>Solana network</Text>
    <Text style={s.copy}>Choose the network for your wallet and swaps.</Text>
    <View accessible accessibilityRole="radio" accessibilityState={{ checked: true }} aria-checked accessibilityLabel="Solana Devnet, selected" testID="settings-network-devnet" style={[s.option, s.selected]}>
      <Globe2 size={22} color={S.ink} /><View style={s.body}><Text style={s.title}>Solana Devnet</Text><Text style={s.copy}>Active · Test SOL and Circle test USDC</Text></View><Check size={22} color={S.ink} />
    </View>
    <View accessible accessibilityRole="radio" accessibilityState={{ checked: false, disabled: true }} aria-checked={false} aria-disabled accessibilityLabel="Solana Mainnet, coming soon, unavailable" testID="settings-network-mainnet" style={s.option}>
      <LockKeyhole size={21} color={S.secondary} /><View style={s.body}><Text style={s.title}>Solana Mainnet</Text><Text style={s.copy}>Coming soon</Text></View>
    </View>
    <Text style={s.copy}>Devnet is selected by default. Test tokens have no monetary value. Mainnet balances and swaps will be available in a future update.</Text>
  </Card></View>;
}
const s = StyleSheet.create({
  heading: { fontFamily: InterFont.semiBold, fontSize: 18, color: S.ink },
  copy: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 20, color: S.secondary },
  title: { fontFamily: InterFont.semiBold, fontSize: 15, color: S.ink },
  body: { flex: 1, gap: 4 },
  option: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 16, backgroundColor: S.iconWell, borderWidth: 1, borderColor: S.border },
  selected: { borderColor: S.primary },
});
