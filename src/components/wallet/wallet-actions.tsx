import { ArrowDown, ArrowRightLeft, ArrowUpRight, Plus } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont, InterFont } from '@/constants/fonts';
import { WalletPalette as W } from '@/constants/theme';

export type WalletAction = 'deposit' | 'send' | 'receive' | 'swap';
const actions = [
  { id: 'deposit', label: 'Deposit', caption: 'Add crypto', icon: Plus },
  { id: 'send', label: 'Send', caption: 'To any address', icon: ArrowUpRight },
  { id: 'receive', label: 'Receive', caption: 'From any wallet', icon: ArrowDown },
  { id: 'swap', label: 'Swap', caption: 'Trade assets', icon: ArrowRightLeft },
] as const;
export function WalletActions({ onAction, compact }: { onAction: (action: WalletAction) => void; compact: boolean }) {
  return <View style={styles.actions} testID="wallet-actions">
    {actions.map(({ id, label, caption, icon: Icon }) => <AuthButton key={id} accessibilityRole="button" accessibilityLabel={`${label}, ${caption.toLowerCase()}`} onPress={() => onAction(id)} testID={`wallet-${id}`} style={styles.action}>
      <View style={[styles.icon, id === 'deposit' && styles.primary]}>
        <Icon size={25} color={id === 'deposit' ? W.heroInk : W.ink} strokeWidth={1.5} />
      </View><Text style={styles.label}>{label}</Text><Text style={[styles.caption, compact && styles.compactCaption]} numberOfLines={1}>{caption}</Text>
    </AuthButton>)}
  </View>;
}
const styles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 7, marginTop: 18, marginBottom: 18 }, action: { flex: 1, alignItems: 'center', gap: 3 },
  icon: { width: 54, height: 48, borderRadius: 14, backgroundColor: W.muted, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 3 }, primary: { backgroundColor: W.primaryAction[1] },
  label: { fontFamily: BrandFont.editorial, fontSize: 17, color: W.ink }, caption: { fontFamily: InterFont.regular, fontSize: 9, color: W.secondary },
  compactCaption: { fontSize: 8 },
});
