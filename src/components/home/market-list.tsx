import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AuthButton } from '@/components/shared/motion';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { MarketSparkline, TokenIcon } from '@/components/shared/markets/market-graphics';
import { InterFont } from '@/constants/fonts';
import { stakedMarkets, type StakedMarket } from '@/constants/portfolio';
import { Dashboard } from '@/constants/theme';

export function MarketList() {
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const [selected, setSelected] = useState<StakedMarket | null>(null);
  return (
    <>
      <View style={styles.list}>
        {stakedMarkets.map((market) => (
          <AuthButton key={market.symbol} testID={`market-${market.symbol}`} accessibilityRole="button"
            accessibilityLabel={`${market.name}, ${market.amount}, ${market.allocation}% allocation, ${market.change}. View details.`}
            onPress={() => setSelected(market)} style={styles.row}>
            <View style={[styles.token, compact && styles.compactToken]}><TokenIcon symbol={market.symbol} size={compact ? 36 : 40} /></View>
            <View style={styles.nameColumn}>
              <Text style={styles.symbol}>{market.symbol}</Text><Text style={styles.caption}>{market.name}</Text>
            </View>
            <View style={styles.valueColumn}>
              <Text style={styles.amount}>{market.amount}</Text><Text style={styles.caption}>{market.allocation}% allocation</Text>
            </View>
            {compact ? null : <View style={styles.chart}><MarketSparkline market={market} /></View>}
            <View style={[styles.badge, { backgroundColor: market.positive ? Dashboard.positiveTint : Dashboard.negativeTint }]}>
              <Text style={[styles.change, { color: market.positive ? Dashboard.positive : Dashboard.negative }]}>{market.change}</Text>
            </View>
            <ChevronRight size={16} color={Dashboard.secondary} style={styles.chevron} strokeWidth={1.8} />
          </AuthButton>
        ))}
      </View>
      <DashboardSheet visible={selected !== null} title={selected ? `${selected.name} market` : 'Market'} onClose={() => setSelected(null)}>
        {selected ? <View style={styles.details}>
          <TokenIcon symbol={selected.symbol} size={52} />
          <Text style={styles.detailLabel}>Your stake</Text><Text style={styles.detailAmount}>{selected.amount}</Text>
          <MarketSparkline market={selected} width={240} height={100} />
          <Text style={styles.detailLabel}>{selected.allocation}% of your portfolio</Text>
          <Text style={[styles.detailChange, { color: selected.positive ? Dashboard.positive : Dashboard.negative }]}>{selected.change}</Text>
        </View> : null}
      </DashboardSheet>
    </>
  );
}

const styles = StyleSheet.create({
  list: { gap: 7 },
  row: { minHeight: 60, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, backgroundColor: Dashboard.glass, flexDirection: 'row', alignItems: 'center' },
  token: { marginRight: 16 },
  compactToken: { marginRight: 10 },
  nameColumn: { flex: 1, minWidth: 38, gap: 3 },
  valueColumn: { width: 80, gap: 3 },
  symbol: { fontFamily: InterFont.medium, fontSize: 13, lineHeight: 17, color: Dashboard.ink },
  amount: { fontFamily: InterFont.medium, fontSize: 13, lineHeight: 17, color: Dashboard.ink, fontVariant: ['tabular-nums'] },
  caption: { fontFamily: InterFont.regular, fontSize: 10, lineHeight: 14, color: Dashboard.secondary },
  chart: { marginLeft: 7 },
  badge: { minWidth: 42, minHeight: 23, marginLeft: 9, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  change: { fontFamily: InterFont.medium, fontSize: 9, lineHeight: 13 },
  chevron: { marginLeft: 7 },
  details: { alignItems: 'center', gap: 14, paddingVertical: 10 },
  detailLabel: { fontFamily: InterFont.regular, fontSize: 14, color: Dashboard.secondary },
  detailAmount: { fontFamily: InterFont.medium, fontSize: 34, color: Dashboard.ink },
  detailChange: { fontFamily: InterFont.semiBold, fontSize: 18 },
});
