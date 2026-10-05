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
    {actions.map(({ id, label, caption, icon: Icon }) => <AuthButton key={id} accessibilityRole="button" accessibilityLabel={`${label}, ${caption.toLowerCase()}`} onPress={() => onAction(id)} testID={`wallet-${id}`} style={[styles.action, compact && styles.compactAction]}>
      <View style={[styles.icon, compact && styles.compactIcon]}>
        <Icon size={compact ? 22 : 25} color={W.ink} strokeWidth={1.5} />
      </View><Text style={styles.label}>{label}</Text><Text style={[styles.caption, compact && styles.compactCaption]} numberOfLines={1}>{caption}</Text>
    </AuthButton>)}
  </View>;
}
const styles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 16, marginBottom: 16 }, action: { flex: 1, minWidth: 0, minHeight: 92, paddingHorizontal: 3, paddingVertical: 8, alignItems: 'center', gap: 3, borderRadius: 20, borderCurve: 'continuous', borderWidth: 1, borderColor: W.border, backgroundColor: W.actionSurface },
  compactAction: { borderRadius: 17, paddingHorizontal: 2 },
  icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: W.actionIcon, alignItems: 'center', justifyContent: 'center', marginBottom: 2 }, compactIcon: { width: 36, height: 36, borderRadius: 12 },
  label: { fontFamily: BrandFont.editorial, fontSize: W.actionLabelSize, lineHeight: 19, color: W.ink }, caption: { fontFamily: InterFont.regular, fontSize: 8, lineHeight: 12, color: W.secondary },
  compactCaption: { fontSize: 8 },
});
