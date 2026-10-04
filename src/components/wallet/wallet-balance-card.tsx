import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, ChevronRight, Eye, EyeOff, LockKeyhole, MoreHorizontal } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { AuthButton } from '@/components/shared/motion';
import { ReserveIcon } from '@/components/shared/icons/product-icons';
import { BrandFont, InterFont } from '@/constants/fonts';
import { WalletPalette as W } from '@/constants/theme';
import { walletBalance } from '@/constants/wallet';

export function WalletBalanceCard({ visible, canToggle, compact, error, onToggle, onMore, onVaults }: {
  visible: boolean; canToggle: boolean; compact: boolean; error: string | null; onToggle: () => void;
  onMore: () => void; onVaults: () => void;
}) {
  return <View style={styles.card} testID="wallet-balance-card">
    <LinearGradient colors={W.hero} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
    <View style={[styles.compass, compact && styles.compactCompass]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><BalanceCompass /></View>
    <View style={styles.header}><View style={styles.labelRow}><Text style={styles.label}>TOTAL BALANCE</Text>
      <AuthButton accessibilityRole="button" accessibilityLabel={visible ? 'Hide balance' : 'Show balance'} testID="wallet-balance-visibility" disabled={!canToggle} onPress={onToggle} style={styles.iconButton}>
        {visible ? <Eye size={16} color={W.heroSecondary} /> : <EyeOff size={16} color={W.heroSecondary} />}
      </AuthButton></View>
      <AuthButton accessibilityRole="button" accessibilityLabel="Wallet options" testID="wallet-options" onPress={onMore} style={styles.iconButton}><MoreHorizontal size={22} color={W.heroSecondary} /></AuthButton>
    </View>
    <Text style={styles.balance} testID="wallet-balance" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{visible ? walletBalance : '••••••'}</Text>
    <View style={styles.changeRow}><View style={styles.changePill}><ArrowUpRight size={15} color={W.heroPositive} /><Text style={styles.change}>+2.4%</Text></View><Text style={styles.changeCaption}>All assets (24h)</Text></View>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <View style={[styles.breakdown, compact && styles.compactBreakdown]}>
      <View style={[styles.bucket, compact && styles.compactBucket]}><View style={[styles.bucketIcon, compact && styles.compactBucketIcon]}><ReserveIcon size={compact ? 15 : 17} color={W.heroInk} /></View><View style={styles.bucketCopy}><Text style={[styles.bucketValue, compact && styles.compactBucketValue]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{visible ? walletBalance : '••••'}</Text><Text style={[styles.bucketLabel, compact && styles.compactBucketLabel]}>Tradable</Text></View></View>
      <View style={styles.divider} />
      <AuthButton accessibilityRole="button" accessibilityLabel={visible ? 'Captain vaults, zero dollars' : 'Captain vaults, balance hidden'} onPress={onVaults} testID="wallet-vault-balance" style={[styles.bucket, compact && styles.compactBucket]}>
        <View style={[styles.bucketIcon, compact && styles.compactBucketIcon]}><LockKeyhole size={compact ? 15 : 17} color={W.heroInk} /></View><View style={styles.bucketCopy}><Text style={[styles.bucketValue, compact && styles.compactBucketValue]} numberOfLines={1}>{visible ? '$0.00' : '••••'}</Text><Text style={[styles.bucketLabel, compact && styles.compactBucketLabel]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>In Captain Vaults</Text></View>
      </AuthButton>
      <AuthButton accessibilityRole="button" accessibilityLabel="View Captain vaults" onPress={onVaults} style={styles.vaultArrow}><ChevronRight size={19} color={W.heroInk} /></AuthButton>
    </View>
  </View>;
}

function BalanceCompass() {
  return <Svg width={140} height={155} viewBox="0 0 140 155">
    <G fill="none" stroke={W.heroSecondary} strokeOpacity={0.07} strokeWidth={0.7}>
      <Path d="M35 0C40 55-14 39 12 82S120 62 109 125M45 0C50 55-4 45 22 83S130 63 119 125M55 0C60 55 6 48 32 85S140 67 129 125M65 0C70 55 16 55 42 89S150 75 139 125" />
    </G>
    <G transform="translate(29 41)" stroke={W.compass} strokeWidth={0.7} opacity={0.6}>
      <Circle cx={54} cy={54} r={34} fill="none" strokeOpacity={0.5} /><Circle cx={54} cy={54} r={29} fill="none" strokeDasharray="1 6" strokeOpacity={0.45} />
      <Line x1={10} y1={54} x2={98} y2={54} /><Line x1={54} y1={10} x2={54} y2={98} />
      <Path d="M54 13 61 47 89 54 61 61 54 95 47 61 19 54 47 47Z" fill="none" />
      <Path d="M54 13 54 54 61 47ZM89 54 54 54 61 61ZM54 95 54 54 47 61ZM19 54 54 54 47 47Z" fill={W.compass} fillOpacity={0.2} />
      <Circle cx={54} cy={54} r={3} fill={W.hero[0]} />
      {[['N', 54, 4], ['E', 108, 58], ['S', 54, 112], ['W', 0, 58]].map(([label, x, y]) => <SvgText key={label} x={x} y={y} textAnchor="middle" stroke="none" fill={W.compass} fontSize={9} fontFamily={BrandFont.editorial}>{label}</SvgText>)}
    </G>
  </Svg>;
}
const styles = StyleSheet.create({
  card: { borderRadius: 22, padding: 18, overflow: 'hidden', backgroundColor: W.hero[0], boxShadow: W.heroShadow },
  compass: { position: 'absolute', right: 4, top: 12, opacity: 0.7 },
  compactCompass: { right: -2, opacity: 0.55, transform: [{ scale: 0.83 }] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -9, marginBottom: -3 }, labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontFamily: BrandFont.editorial, fontSize: 12, color: W.heroSecondary, letterSpacing: 0.2 }, iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  balance: { fontFamily: BrandFont.editorial, fontSize: W.balanceSize, fontVariant: ['lining-nums', 'tabular-nums'], lineHeight: 50, letterSpacing: -0.7, color: W.heroInk, maxWidth: '85%' },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 5, marginBottom: 14 }, changePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 16, backgroundColor: W.heroPill },
  change: { fontFamily: InterFont.medium, fontSize: 11, color: W.heroPositive }, changeCaption: { fontFamily: InterFont.regular, fontSize: 10, color: W.heroSecondary }, error: { fontFamily: InterFont.regular, fontSize: 11, color: W.heroInk, marginBottom: 10 },
  breakdown: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: W.heroLine, paddingTop: 14 }, bucket: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 }, bucketIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: W.heroPill },
  bucketCopy: { flex: 1, minWidth: 0, gap: 2 }, bucketValue: { fontFamily: BrandFont.editorial, fontSize: 16, fontVariant: ['lining-nums', 'tabular-nums'], color: W.heroInk }, bucketLabel: { fontFamily: BrandFont.editorial, fontSize: 12, color: W.heroSecondary }, divider: { width: 1, height: 23, backgroundColor: W.heroLine }, vaultArrow: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: W.heroPill },
  compactBreakdown: { gap: 7 }, compactBucket: { gap: 6 }, compactBucketIcon: { width: 24, height: 24, borderRadius: 12 }, compactBucketValue: { fontSize: 14 }, compactBucketLabel: { fontSize: 10 },
});
