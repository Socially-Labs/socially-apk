import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Eye, EyeOff, LockKeyhole, MoreHorizontal } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { AuthButton } from '@/components/shared/motion';
import { ReserveIcon } from '@/components/shared/icons/product-icons';
import { BrandFont, InterFont } from '@/constants/fonts';
import { WalletPalette as W } from '@/constants/theme';
import { formatUsdc } from '@/api/wallet';

export function WalletBalanceCard({ visible, canToggle, compact, error, tradingError, totalUsd, valuationLoading, available, vault, onToggle, onMore, onVaults }: {
  visible: boolean; canToggle: boolean; compact: boolean; error: string | null; onToggle: () => void;
  onMore: () => void; onVaults: () => void; tradingError: string | null; totalUsd: string | null; valuationLoading: boolean; available: string | null; vault: string | null;
}) {
  return <View style={styles.card} testID="wallet-balance-card">
    <LinearGradient colors={W.balanceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
    <View style={[styles.compass, compact && styles.compactCompass]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><BalanceCompass /></View>
    <View style={styles.header}><View style={styles.labelRow}><Text style={styles.label}>TOTAL WALLET VALUE <Text style={styles.preview}>· USD estimate</Text></Text>
      <AuthButton accessibilityRole="button" accessibilityLabel={visible ? 'Hide balance' : 'Show balance'} testID="wallet-balance-visibility" disabled={!canToggle} onPress={onToggle} style={styles.iconButton}>
        {visible ? <Eye size={17} color={W.ink} /> : <EyeOff size={17} color={W.ink} />}
      </AuthButton></View>
      <AuthButton accessibilityRole="button" accessibilityLabel="Wallet options" testID="wallet-options" onPress={onMore} style={styles.iconButton}><MoreHorizontal size={22} color={W.secondary} /></AuthButton>
    </View>
    <Text style={styles.balance} testID="wallet-balance" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{!visible ? '••••••' : totalUsd === null ? '—' : `$${formatUsdc(totalUsd)}`}</Text>
    {visible && totalUsd === null && !error ? <Text style={styles.changeCaption}>{valuationLoading ? 'Fetching wallet valuation…' : 'Fresh market prices unavailable. Pull to refresh.'}</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <Text style={styles.tradingHeading}>Paper trading funds · Separate from wallet</Text>
    {tradingError ? <Text accessibilityRole="alert" style={styles.error}>{tradingError}</Text> : null}
    <View style={[styles.breakdown, compact && styles.compactBreakdown]}>
      <View style={[styles.bucket, compact && styles.compactBucket]}><View style={[styles.bucketIcon, compact && styles.compactBucketIcon]}><ReserveIcon size={compact ? 15 : 17} color={W.ink} /></View><View style={styles.bucketCopy}><Text style={[styles.bucketValue, compact && styles.compactBucketValue]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{visible ? formatUsdc(available) : '••••'}</Text><Text style={[styles.bucketLabel, compact && styles.compactBucketLabel]}>Trading cash</Text></View></View>
      <View style={styles.divider} />
      <AuthButton accessibilityRole="button" accessibilityLabel={visible ? 'View Captain allocations' : 'Captain vaults, balance hidden'} onPress={onVaults} testID="wallet-vault-balance" style={[styles.bucket, compact && styles.compactBucket]}>
        <View style={[styles.bucketIcon, compact && styles.compactBucketIcon]}><LockKeyhole size={compact ? 15 : 17} color={W.ink} /></View><View style={styles.bucketCopy}><Text style={[styles.bucketValue, compact && styles.compactBucketValue]} numberOfLines={1}>{visible ? formatUsdc(vault) : '••••'}</Text><Text style={[styles.bucketLabel, compact && styles.compactBucketLabel]} numberOfLines={compact ? 2 : 1}>Captain vaults</Text></View>
      </AuthButton>
      <AuthButton accessibilityRole="button" accessibilityLabel="View Captain vaults" onPress={onVaults} style={styles.vaultArrow}><View style={styles.arrowCircle}><ChevronRight size={19} color={W.ink} /></View></AuthButton>
    </View>
  </View>;
}

function BalanceCompass() {
  return <Svg width={140} height={155} viewBox="0 0 140 155">
    <G fill="none" stroke={W.balanceCompass} strokeOpacity={0.18} strokeWidth={0.7}>
      <Path d="M35 0C40 55-14 39 12 82S120 62 109 125M45 0C50 55-4 45 22 83S130 63 119 125M55 0C60 55 6 48 32 85S140 67 129 125M65 0C70 55 16 55 42 89S150 75 139 125" />
    </G>
    <G transform="translate(29 41)" stroke={W.balanceCompass} strokeWidth={0.7} opacity={0.6}>
      <Circle cx={54} cy={54} r={34} fill="none" strokeOpacity={0.5} /><Circle cx={54} cy={54} r={29} fill="none" strokeDasharray="1 6" strokeOpacity={0.45} />
      <Line x1={10} y1={54} x2={98} y2={54} /><Line x1={54} y1={10} x2={54} y2={98} />
      <Path d="M54 13 61 47 89 54 61 61 54 95 47 61 19 54 47 47Z" fill="none" />
      <Path d="M54 13 54 54 61 47ZM89 54 54 54 61 61ZM54 95 54 54 47 61ZM19 54 54 54 47 47Z" fill={W.balanceCompass} fillOpacity={0.2} />
      <Circle cx={54} cy={54} r={3} fill={W.balanceCard[0]} />
      {[['N', 54, 4], ['E', 108, 58], ['S', 54, 112], ['W', 0, 58]].map(([label, x, y]) => <SvgText key={label} x={x} y={y} textAnchor="middle" stroke="none" fill={W.balanceCompass} fontSize={9} fontFamily={BrandFont.editorial}>{label}</SvgText>)}
    </G>
  </Svg>;
}
const styles = StyleSheet.create({
  card: { borderRadius: 24, borderCurve: 'continuous', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 16, borderWidth: 1, borderColor: W.balanceBorder, overflow: 'hidden', backgroundColor: W.balanceCard[0], boxShadow: W.balanceShadow },
  compass: { position: 'absolute', right: 4, top: 12, opacity: 0.7 },
  compactCompass: { right: -2, opacity: 0.55, transform: [{ scale: 0.83 }] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -6, marginBottom: -2 }, labelRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  label: { flexShrink: 1, fontFamily: BrandFont.editorial, fontSize: 11, color: W.ink, letterSpacing: 0.6 }, preview: { fontFamily: InterFont.regular, fontSize: 10, letterSpacing: 0, color: W.secondary }, iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  balance: { fontFamily: BrandFont.editorial, fontSize: W.balanceSize, fontVariant: ['lining-nums', 'tabular-nums'], lineHeight: 50, letterSpacing: -0.7, color: W.ink, maxWidth: '85%' },
  changePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: W.gainSurface },
  change: { fontFamily: InterFont.medium, fontSize: 11, color: W.gain }, changeCaption: { fontFamily: InterFont.regular, fontSize: 10, color: W.secondary, marginTop: 5, marginBottom: 16 }, error: { fontFamily: InterFont.regular, fontSize: 11, color: W.error, marginBottom: 10 },
  tradingHeading: { fontFamily: InterFont.medium, fontSize: 10, lineHeight: 14, color: W.secondary, marginTop: 16, marginBottom: 8 },
  breakdown: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: W.balanceLine, paddingTop: 12 }, bucket: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 44 }, bucketIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: W.balanceIcon },
  bucketCopy: { flex: 1, minWidth: 0, gap: 2 }, bucketValue: { fontFamily: BrandFont.editorial, fontSize: 16, fontVariant: ['lining-nums', 'tabular-nums'], color: W.ink }, bucketLabel: { fontFamily: InterFont.regular, fontSize: 10, lineHeight: 14, color: W.secondary }, divider: { width: 1, height: 23, backgroundColor: W.balanceLine }, vaultArrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, arrowCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: W.balanceIcon },
  compactBreakdown: { gap: 6 }, compactBucket: { gap: 5 }, compactBucketIcon: { width: 24, height: 24, borderRadius: 12 }, compactBucketValue: { fontSize: 14 }, compactBucketLabel: { fontSize: 9, lineHeight: 12 },
});
