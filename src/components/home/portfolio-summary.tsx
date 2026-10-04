import { HoldingsIcon } from '@/components/shared/icons/product-icons';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { portfolio, stakedMarkets } from '@/constants/portfolio';
import { Dashboard } from '@/constants/theme';
import { ChartNoAxesColumn, TrendingUp, Users } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

export function PortfolioSummary({ compact, onOverview }: { compact: boolean; onOverview: () => void }) {
  return (
    <View style={styles.summary} testID="portfolio-summary">
      <Text style={styles.totalLabel}>Total Staked</Text>
      <Text style={[styles.total, compact && styles.compactTotal]} maxFontSizeMultiplier={1.4}>{portfolio.totalStaked}</Text>
      <AuthButton testID="portfolio-overview" accessibilityRole="button" accessibilityLabel="View portfolio overview"
        onPress={onOverview} style={styles.overview} hitSlop={4}>
        <ChartNoAxesColumn size={22} color="#687C9D" strokeWidth={2.4} />
      </AuthButton>
      <View style={styles.metrics}>
        <View style={[styles.metric, compact && styles.compactMetric]}>
          <HoldingsIcon size={20} color={Dashboard.icon} />
          <View style={styles.metricText}><Text style={styles.metricLabel}>Markets</Text><Text style={styles.metricValue}>{stakedMarkets.length}</Text></View>
        </View>
        <View style={styles.metricDivider} />
        <View style={[styles.metric, styles.middleMetric, compact && styles.compactMetric]}>
          <TrendingUp size={20} color={Dashboard.icon} strokeWidth={1.8} />
          <View style={styles.metricText}><Text style={styles.metricLabel}>Total PnL</Text><Text style={styles.profit}>{portfolio.pnl}</Text></View>
        </View>
        <View style={styles.metricDivider} />
        <View style={[styles.metric, styles.lastMetric, compact && styles.compactMetric]}>
          <Users size={20} color={Dashboard.icon} strokeWidth={1.8} />
          <View style={styles.metricText}><Text style={styles.metricLabel}>Crew Members</Text><Text style={styles.metricValue}>{portfolio.crewMembers}</Text></View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { borderRadius: 18, backgroundColor: Dashboard.glass, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 17 },
  totalLabel: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 17, color: Dashboard.secondary },
  total: { fontFamily: InterFont.medium, fontSize: 32, lineHeight: 42, letterSpacing: -0.8, color: Dashboard.ink, marginTop: 1, fontVariant: ['tabular-nums'] },
  compactTotal: { fontSize: 28 },
  overview: { position: 'absolute', top: 23, right: 17, width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.84)' },
  metrics: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  metric: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  middleMetric: { paddingLeft: 12 },
  lastMetric: { paddingLeft: 12 },
  compactMetric: { flexDirection: 'column', alignItems: 'flex-start', paddingLeft: 4, gap: 6 },
  metricText: { flex: 1, gap: 3 },
  metricLabel: { fontFamily: InterFont.regular, fontSize: 9, lineHeight: 12, color: Dashboard.secondary },
  metricValue: { fontFamily: InterFont.medium, fontSize: 14, lineHeight: 18, color: Dashboard.ink },
  profit: { fontFamily: InterFont.medium, fontSize: 12, lineHeight: 18, color: Dashboard.positive },
  metricDivider: { width: 1, height: 36, backgroundColor: Dashboard.line },
});
