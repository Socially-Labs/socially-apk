import { MarketSparkline, TokenIcon } from '@/components/shared/markets/market-graphics';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont, InterFont } from '@/constants/fonts';
import { WalletPalette as W } from '@/constants/theme';
import { formatWalletValue, type WalletAsset } from '@/constants/wallet';
import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { sharedStyles } from './wallet-section-styles';

export function WalletAssetRow({ asset, visible, compact, reduceMotion, onSelect }: {
  asset: WalletAsset; visible: boolean; compact: boolean; reduceMotion: boolean; onSelect: (asset: WalletAsset) => void;
}) {
  return <Animated.View layout={reduceMotion ? undefined : LinearTransition.duration(180)}>
    <AuthButton accessibilityRole="button" accessibilityLabel={visible ? `${asset.name}, ${asset.quantity}, ${formatWalletValue(asset.value)}, ${asset.network}` : `${asset.name}, balances hidden, ${asset.network}`} testID={`wallet-asset-${asset.symbol.toLowerCase()}`} onPress={() => onSelect(asset)} style={[styles.asset, compact && styles.compactAsset]}>
      <TokenIcon symbol={asset.symbol} size={compact ? 30 : 36} /><View style={styles.assetName}><Text style={styles.assetSymbol}>{asset.symbol}</Text><Text style={[styles.caption, compact && styles.compactCaption]} numberOfLines={compact ? 2 : 1}>{asset.network}</Text></View>
      <View style={[styles.sparkline, compact && styles.compactSparkline]} testID={`wallet-chart-${asset.symbol.toLowerCase()}`}><MarketSparkline market={asset} width={compact ? 28 : 44} height={28} /></View>
      <Animated.View key={visible ? 'visible' : 'hidden'} entering={visible && !reduceMotion ? FadeIn.duration(160) : undefined} style={[styles.assetAmount, compact && styles.compactAmount]}>
        <Text style={[styles.assetValue, compact && styles.compactValue]} testID={`wallet-value-${asset.symbol.toLowerCase()}`} numberOfLines={1}>{visible ? formatWalletValue(asset.value) : '••••'}</Text><Text style={[styles.caption, styles.quantity, compact && styles.compactCaption]} testID={`wallet-quantity-${asset.symbol.toLowerCase()}`} numberOfLines={1}>{visible ? asset.quantity : '••••'}</Text>
      </Animated.View><ChevronRight size={compact ? 14 : 15} color={W.secondary} strokeWidth={1.6} />
    </AuthButton>
  </Animated.View>;
}

const styles = StyleSheet.create({
  ...sharedStyles,
  asset: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 58, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, borderCurve: 'continuous', borderWidth: 1, borderColor: W.border, backgroundColor: W.assetSurface },
  compactAsset: { gap: 7, paddingHorizontal: 10 },
  assetName: { flex: 1, gap: 2, minWidth: 0 },
  compactCaption: { fontSize: 9, lineHeight: 12 },
  sparkline: { width: 44, alignItems: 'center', opacity: 0.85 },
  compactSparkline: { width: 28 },
  assetAmount: { width: 104, alignItems: 'flex-end', gap: 2 }, compactAmount: { width: 86 },
  quantity: { fontFamily: InterFont.regular, fontVariant: ['tabular-nums'] },
  assetValue: { fontFamily: BrandFont.editorial, fontSize: 18, lineHeight: 22, fontVariant: ['lining-nums', 'tabular-nums'], color: W.ink }, compactValue: { fontSize: 16, lineHeight: 20 },
});
