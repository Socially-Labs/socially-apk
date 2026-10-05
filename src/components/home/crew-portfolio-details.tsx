import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { selectionFeedback } from '@/components/shared/feedback';
import { AuthButton } from '@/components/shared/motion';
import { crewGainCents, crewInvestedCents, crewMoney, crewPercent, crewPerformance, crewPeriods, crewPositions, crewSignedMoney, crewTotalCents, type CrewPeriod } from '@/constants/crew-portfolio';
import { BrandFont, InterFont } from '@/constants/fonts';
import { Dashboard, DashboardSheetTheme as S } from '@/constants/theme';
import { PortfolioChart } from './home-performance-card';

/** The chosen sheet's composition, backed by the same data and privacy as Home. */
export function CrewPortfolioDetails({ hidden }: { hidden: boolean }) {
  const [period, setPeriod] = useState<CrewPeriod>('30D');
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const performance = crewPerformance(period);
  const gainColor = performance.gainCents >= 0 ? S.positive : S.negative;
  const caption = period === 'ALL' ? 'since invested' : `past ${period === '7D' ? '7' : period === '30D' ? '30' : '90'} days`;
  const metrics = [
    { label: 'You invested', value: hidden ? '••••' : crewMoney(crewInvestedCents), id: 'invested', color: S.ink },
    { label: 'Total gain', value: hidden ? '••••' : crewSignedMoney(crewGainCents), id: 'gain', color: crewGainCents >= 0 ? S.positive : S.negative },
    { label: 'Captain vaults', value: String(crewPositions.length), id: 'vaults', color: S.ink },
  ];
  return <View style={[styles.content, compact && styles.compactContent]} testID="portfolio-sheet-details">
    <Text style={styles.sample}>Sample portfolio</Text>
    <Text testID="portfolio-sheet-value" style={[styles.balance, compact && styles.compactBalance]}
      numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{hidden ? '••••••' : crewMoney(crewTotalCents)}</Text>
    <View style={styles.returnRow}>
      <Text testID="portfolio-sheet-return" style={[styles.change, { color: gainColor }]}>
        {hidden ? '••••' : `${crewSignedMoney(performance.gainCents)} (${crewPercent(performance.percent)})`}
      </Text>
      <Text style={styles.caption}>{caption}</Text>
    </View>
    <View style={styles.chartPanel}>
      <PortfolioChart values={performance.values} hidden={hidden} color={performance.gainCents >= 0 ? Dashboard.positive : S.negative}
        description={`Sample portfolio ${caption}, from ${crewMoney(performance.values[0])} to ${crewMoney(crewTotalCents)}`}
        testID="portfolio-sheet-chart" light height={compact ? 72 : 104} />
      <View style={styles.periods} accessibilityRole="tablist" accessibilityLabel="Portfolio performance period">
        {crewPeriods.map(item => <AuthButton key={item} testID={`portfolio-sheet-period-${item}`}
          accessibilityRole="tab" accessibilityLabel={`${item === 'ALL' ? 'All time' : item} performance`}
          accessibilityState={{ selected: item === period }} aria-selected={item === period}
          onPress={() => { selectionFeedback(); setPeriod(item); }} style={[styles.period, item === period && styles.selectedPeriod]}>
          <Text style={[styles.periodText, item === period && styles.selectedPeriodText]}>{item === 'ALL' ? 'All' : item}</Text>
        </AuthButton>)}
      </View>
    </View>
    <View style={[styles.metrics, compact && styles.compactMetrics]}>
      {metrics.map((metric, index) => <View key={metric.id} style={[styles.metric, index === 0 && styles.invested, index === 2 && styles.vaultCount,
        index > 0 && styles.dividedMetric, compact && styles.compactMetric, compact && index > 0 && styles.dividedCompactMetric]}>
        <Text style={styles.metricLabel}>{metric.label}</Text>
        <Text testID={`portfolio-sheet-${metric.id}`} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}
          style={[styles.metricValue, { color: metric.color }, compact && styles.compactMetricValue]}>{metric.value}</Text>
      </View>)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  compactContent: { gap: 12 },
  sample: { fontFamily: InterFont.regular, fontSize: 14, lineHeight: 20, color: S.secondary, textAlign: 'center', marginTop: -4 },
  balance: { fontFamily: BrandFont.editorial, fontSize: 48, lineHeight: 54, letterSpacing: -0.9, color: S.ink,
    textAlign: 'center', fontVariant: ['lining-nums', 'tabular-nums'], marginTop: 2 },
  compactBalance: { fontSize: 40, lineHeight: 46 },
  returnRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 4, marginTop: -8 },
  change: { fontFamily: InterFont.semiBold, fontSize: 14, lineHeight: 20, fontVariant: ['tabular-nums'] },
  caption: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 20, color: S.secondary },
  chartPanel: { borderRadius: S.bodyRadius, borderWidth: 1, borderColor: S.border, backgroundColor: S.chartSurface,
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
  periods: { flexDirection: 'row', gap: 4, marginTop: 8 },
  period: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 14 },
  selectedPeriod: { backgroundColor: S.periodSelected },
  periodText: { fontFamily: InterFont.regular, fontSize: 14, lineHeight: 20, color: S.secondary },
  selectedPeriodText: { fontFamily: InterFont.semiBold, color: S.ink },
  metrics: { flexDirection: 'row', borderRadius: S.bodyRadius, borderWidth: 1, borderColor: S.bodyBorder,
    backgroundColor: S.body, paddingHorizontal: 14, paddingVertical: 16 },
  metric: { flex: 1.2, minWidth: 0, gap: 5, justifyContent: 'space-between' },
  invested: { flex: 1.45 },
  vaultCount: { flex: 0.85 },
  dividedMetric: { marginLeft: 10, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: S.bodyBorder },
  metricLabel: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 17, color: S.secondary },
  metricValue: { fontFamily: BrandFont.editorial, fontSize: 22, lineHeight: 28, fontVariant: ['lining-nums', 'tabular-nums'] },
  compactMetrics: { flexDirection: 'column', paddingVertical: 6 },
  compactMetric: { flex: 0, flexBasis: 'auto', flexShrink: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingVertical: 7, marginLeft: 0, paddingLeft: 0, borderLeftWidth: 0 },
  dividedCompactMetric: { borderTopWidth: 1, borderTopColor: S.bodyBorder },
  compactMetricValue: { fontSize: 23, lineHeight: 28 },
});
