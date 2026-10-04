import { MarketSparkline, TokenIcon } from '@/components/shared/markets/market-graphics';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont } from '@/constants/fonts';
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
    <AuthButton accessibilityRole="button" accessibilityLabel={visible ? `${asset.name}, ${asset.quantity}, ${formatWalletValue(asset.value)}, ${asset.network}` : `${asset.name}, balances hidden, ${asset.network}`} testID={`wallet-asset-${asset.symbol.toLowerCase()}`} onPress={() => onSelect(asset)} style={styles.asset}>
      <TokenIcon symbol={asset.symbol} size={compact ? 36 : 40} /><View style={styles.assetName}><Text style={styles.assetSymbol}>{asset.symbol}</Text><Text style={[styles.caption, compact && styles.compactCaption]} numberOfLines={1}>{asset.network}</Text></View>
      <View style={[styles.sparkline, compact && styles.compactSparkline]} testID={`wallet-chart-${asset.symbol.toLowerCase()}`}><MarketSparkline market={asset} width={compact ? 38 : 52} height={28} /></View>
      <Animated.View key={visible ? 'visible' : 'hidden'} entering={visible && !reduceMotion ? FadeIn.duration(160) : undefined} style={styles.assetAmount}>
        <Text style={styles.assetValue} numberOfLines={1}>{visible ? formatWalletValue(asset.value) : '••••'}</Text><Text style={styles.caption} numberOfLines={1}>{visible ? asset.quantity : '••••'}</Text>
      </Animated.View><ChevronRight size={17} color={W.ink} strokeWidth={1.6} />
    </AuthButton>
  </Animated.View>;
}

const styles = StyleSheet.create({
  ...sharedStyles,
  asset: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 64, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 22, backgroundColor: W.assetSurface },
  assetName: { flex: 1, gap: 2, minWidth: 0 },
  compactCaption: { fontSize: 8 },
  sparkline: { width: 52, alignItems: 'center', opacity: 0.85 },
  compactSparkline: { width: 38 },
  assetAmount: { alignItems: 'flex-end', gap: 2, maxWidth: '38%' },
  assetValue: { fontFamily: BrandFont.editorial, fontSize: 18, fontVariant: ['lining-nums', 'tabular-nums'], color: W.ink },
});
