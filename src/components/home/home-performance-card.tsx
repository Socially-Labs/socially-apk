import { Eye, EyeOff, ArrowUpRight } from 'lucide-react-native';
import { useMemo, type ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { TimeSeriesChart } from '@/components/shared/charts/time-series-chart';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont, InterFont } from '@/constants/fonts';
import { CaptainHomePalette as C, DiscoverPalette as D } from '@/constants/theme';

const periods = ['7D', '30D', '90D', 'ALL'] as const;
type HomePeriod = (typeof periods)[number];
type Metric = { label: string; value: string; testID?: string; icon?: ReactNode };

/** Shared presentation for Captain AUM and Crew personal value. */
export function HomePerformanceCard({ label, balance, change, changeCaption, positive, values, timestamps, chartDescription,
  metrics, hidden, canToggle, onToggle, onOverview, overviewLabel, period, onPeriod, compact, error,
  testIDPrefix, summaryTestID, balanceTestID, changeTestID, overviewTestID, badge = 'Sample', chartMessage, variant = 'default', periodOptions = periods, minimumChartRange = 1, formatChartValue }: {
  label: string; balance: string; change: string; changeCaption: string; positive: boolean;
  values: number[]; timestamps?: string[]; chartDescription: string; metrics: readonly [Metric, Metric];
  hidden: boolean; canToggle: boolean; onToggle: () => void; onOverview: () => void; overviewLabel: string;
  period: HomePeriod; onPeriod: (period: HomePeriod) => void; compact: boolean; error: string | null;
  testIDPrefix: string; summaryTestID: string; balanceTestID: string; changeTestID: string; overviewTestID: string;
  badge?: string; chartMessage?: string;
  variant?: 'default' | 'frosted' | 'frosted-pills';
  periodOptions?: readonly HomePeriod[]; minimumChartRange?: number; formatChartValue?: (value: number) => string;
}) {
  const frosted = variant !== 'default';
  const pillPeriods = variant === 'frosted-pills';
  const color = frosted ? positive ? C.gain : C.loss : positive ? D.heroPositive : D.heroNegative;
  const periodControls = <View accessibilityRole={frosted ? 'tablist' : undefined} accessibilityLabel={frosted ? `${label} chart period` : undefined}
    style={[styles.periods, frosted && glass.periods, pillPeriods && glass.pillPeriods]}>{periodOptions.map(item => <AuthButton key={item} testID={`${testIDPrefix}-period-${item}`} accessibilityRole={frosted ? 'tab' : 'button'}
    accessibilityLabel={`${item === 'ALL' ? 'All time' : item} performance`} accessibilityState={{ selected: item === period }}
    aria-selected={frosted ? item === period : undefined}
    onPress={() => onPeriod(item)} style={[styles.period, frosted && glass.period, pillPeriods && glass.pillPeriod, item === period && (frosted ? glass.selectedPeriod : styles.selectedPeriod), pillPeriods && item === period && glass.selectedPillPeriod]}>
    <Text style={[styles.periodText, frosted && glass.periodText, item === period && (frosted ? glass.selectedPeriodText : styles.selectedPeriodText)]}>{frosted ? item : item === 'ALL' ? 'All' : item}</Text>
    {frosted && !pillPeriods && item === period ? <View style={glass.periodIndicator}><View style={glass.periodDot} /></View> : null}
  </AuthButton>)}</View>;
  return <LinearGradient colors={frosted ? C.card : D.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, frosted && glass.card]} testID={summaryTestID}>
    <View style={[styles.row, frosted && glass.row]}>
      <Text style={[styles.label, frosted && glass.label]}>{label} <Text style={[styles.preview, frosted && glass.secondary]}>{badge ? `· ${badge}` : ''}</Text></Text>
      <AuthButton testID={`${testIDPrefix}-balance-visibility`} accessibilityRole="button" accessibilityLabel={hidden ? 'Show portfolio balances' : 'Hide portfolio balances'}
        disabled={!canToggle} accessibilityState={{ disabled: !canToggle }} onPress={onToggle} style={[styles.iconButton, frosted && glass.visibility]}>
        <View style={frosted && glass.eye}>{hidden ? <EyeOff size={19} color={frosted ? C.ink : D.heroSecondary} /> : <Eye size={19} color={frosted ? C.ink : D.heroSecondary} />}</View>
      </AuthButton>
    </View>
    <Text testID={balanceTestID} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[styles.balance, compact && styles.compactBalance, frosted && glass.balance, frosted && compact && glass.compactBalance]}>{hidden ? '••••••' : balance}</Text>
    <View style={styles.returnRow}>
      <View style={frosted && [glass.returnPill, { backgroundColor: positive ? C.gainSurface : C.lossSurface }]}>
        <Text testID={changeTestID} style={[styles.return, frosted && glass.return, { color }]}>{hidden ? '••••' : change}</Text>
      </View>
      <Text style={[styles.caption, frosted && glass.secondary]}>{changeCaption}</Text>
    </View>
    {frosted ? periodControls : null}
    {chartMessage ? <Text style={[styles.chartMessage, frosted && glass.secondary]}>{chartMessage}</Text> : <PortfolioChart values={values} timestamps={timestamps} hidden={hidden} color={frosted ? C.chart : color} description={chartDescription} testID={`${testIDPrefix}-performance-chart`} frosted={frosted} minimumRange={minimumChartRange} formatValue={formatChartValue} />}
    {frosted ? null : periodControls}
    <View style={[styles.metrics, frosted && glass.metrics]}>
      {metrics.map((metric, index) => <View key={metric.label} style={[styles.metric, index === 0 && styles.investedMetric, frosted && glass.metric, frosted && index === 0 && glass.firstMetric]}>
        {frosted && metric.icon && !compact ? <View style={glass.metricIcon}>{metric.icon}</View> : null}
        <View style={frosted ? glass.metricCopy : styles.metricCopy}>
          <Text style={[styles.caption, frosted && glass.metricCaption]}>{metric.label}</Text><Text testID={metric.testID} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}
            style={[styles.metricValue, compact && styles.compactMetricValue, frosted && glass.metricValue]}>{metric.value}</Text>
        </View>
      </View>)}
      <AuthButton testID={overviewTestID} accessibilityRole="button" accessibilityLabel={overviewLabel} onPress={onOverview} style={[styles.overview, frosted && glass.overview]}>
        <ArrowUpRight size={22} color={frosted ? C.chart : D.heroInk} />
      </AuthButton>
    </View>
    {error ? <Text accessibilityRole="alert" style={[styles.error, frosted && glass.error]}>{error}</Text> : null}
  </LinearGradient>;
}

export function PortfolioChart({ values, timestamps, hidden, color, description, testID, frosted = false, light = false, height = 80, minimumRange = 1, formatValue }: {
  values: number[]; timestamps?: string[]; hidden: boolean; color: string; description: string; testID: string; frosted?: boolean; light?: boolean; height?: number; minimumRange?: number; formatValue?: (value: number) => string;
}) {
  const data = useMemo(() => {
    const times = timestamps?.length === values.length ? timestamps.map(value => Date.parse(value)) : null;
    const shortDate = (at: number) => new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return values.map((value, index) => ({ time: times ? times[index] : index, value,
      label: `${times && Number.isFinite(times[index]) ? shortDate(times[index]) : `Valuation ${index + 1}`} · ${formatValue ? formatValue(value) : value.toLocaleString()}` }));
  }, [values, timestamps, formatValue]);
  const date = (at: number | undefined) => at !== undefined && Number.isFinite(at) ? new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : undefined;
  if (hidden || data.filter(p => Number.isFinite(p.value) && Number.isFinite(p.time)).length < 2) return <View testID={testID} style={[styles.chart, { minHeight: height }]}><Text style={[styles.chartMessage, { color: frosted ? C.secondary : light ? D.secondary : D.heroSecondary }]}>{hidden ? 'Chart hidden' : 'History will appear as your vault is valued.'}</Text></View>;
  return <View style={[styles.chart, frosted && glass.chart]}>
    <TimeSeriesChart data={data} height={height} color={color} description={description} testID={testID} minimumRange={minimumRange}
      grid={!frosted} startLabel={timestamps ? date(data[0]?.time) : undefined} endLabel={timestamps ? date(data.at(-1)?.time) : undefined} />
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, paddingHorizontal: 21, paddingTop: 8, paddingBottom: 17, borderWidth: 1, borderColor: D.heroLine, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { flex: 1, marginRight: 8, fontFamily: InterFont.medium, fontSize: 13, lineHeight: 19, color: D.heroSecondary },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -9 },
  balance: { fontFamily: BrandFont.editorial, fontVariant: ['lining-nums', 'tabular-nums'], fontSize: 46, lineHeight: 52, letterSpacing: -1, color: D.heroInk },
  compactBalance: { fontSize: 40, lineHeight: 47 },
  returnRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 7, rowGap: 3, marginTop: 5 },
  return: { fontFamily: InterFont.medium, fontSize: 12, lineHeight: 18, fontVariant: ['tabular-nums'] },
  caption: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: D.heroSecondary },
  chartMessage: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: C.secondary, minHeight: 52, paddingVertical: 12 },
  chart: { marginTop: 9, marginBottom: 2 },
  periods: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  period: { flex: 1, minHeight: 44, maxWidth: 70, justifyContent: 'center', alignItems: 'center', borderRadius: 13 },
  selectedPeriod: { backgroundColor: D.heroPill },
  periodText: { fontFamily: InterFont.medium, fontSize: 11, color: D.heroSecondary },
  selectedPeriodText: { color: D.heroInk },
  metrics: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: D.heroLine },
  metric: { flex: 1, gap: 3, alignSelf: 'stretch', justifyContent: 'space-between' },
  metricCopy: { flex: 1, gap: 3, justifyContent: 'space-between' },
  investedMetric: { flex: 1.4 },
  metricValue: { fontFamily: InterFont.medium, fontSize: 15, lineHeight: 21, color: D.heroInk, fontVariant: ['tabular-nums'] },
  compactMetricValue: { fontSize: 13 },
  overview: { width: 44, height: 44, borderRadius: 22, backgroundColor: D.heroPill, alignItems: 'center', justifyContent: 'center' },
  preview: { fontFamily: InterFont.regular, fontSize: 10, color: D.heroSecondary, lineHeight: 14 },
  error: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 17, color: D.heroNegative, marginTop: 8 },
});

const glass = StyleSheet.create({
  card: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, borderRadius: 24, borderCurve: 'continuous', borderColor: C.border, boxShadow: C.shadow },
  row: { minHeight: 28 },
  label: { fontFamily: InterFont.semiBold, fontSize: 12, lineHeight: 18, color: C.ink, marginRight: 38 },
  visibility: { position: 'absolute', right: -9, top: -8, marginRight: 0 },
  secondary: { color: C.secondary },
  eye: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(221,237,250,0.65)', alignItems: 'center', justifyContent: 'center' },
  balance: { color: C.ink, fontSize: 43, lineHeight: 44, letterSpacing: -1.2 },
  compactBalance: { fontSize: 36, lineHeight: 42 },
  returnPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderCurve: 'continuous' },
  return: { fontSize: 11, lineHeight: 16 },
  periods: { alignSelf: 'flex-end', justifyContent: 'flex-end', gap: 0, marginTop: 2 },
  period: { flex: 0, flexBasis: 44, flexShrink: 0, width: 44, borderRadius: 0 },
  selectedPeriod: { backgroundColor: 'transparent' },
  pillPeriods: { alignSelf: 'stretch', justifyContent: 'space-between', gap: 4, marginTop: 8 },
  pillPeriod: { flex: 1, flexBasis: 0, flexShrink: 1, width: 'auto', borderRadius: 13, borderCurve: 'continuous' },
  selectedPillPeriod: { backgroundColor: '#D5EAFB' },
  periodText: { fontFamily: InterFont.regular, fontSize: 10, color: C.secondary },
  selectedPeriodText: { fontFamily: InterFont.semiBold, color: C.ink },
  periodIndicator: { position: 'absolute', bottom: 7, width: 17, height: 1.5, backgroundColor: C.chart, alignItems: 'center', justifyContent: 'center' },
  periodDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.chart },
  chart: { marginTop: 4, marginBottom: 4 },
  metrics: { gap: 8, marginTop: 6, paddingTop: 8, borderTopColor: C.line },
  metric: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'flex-start' },
  firstMetric: { borderRightWidth: 1, borderRightColor: C.line, paddingRight: 8 },
  metricIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.iconSurface, alignItems: 'center', justifyContent: 'center' },
  metricCopy: { flex: 1, minWidth: 0, gap: 2 },
  metricCaption: { color: C.secondary, fontSize: 10, lineHeight: 14 },
  metricValue: { fontFamily: InterFont.semiBold, color: C.ink, fontSize: 15, lineHeight: 20 },
  overview: { backgroundColor: '#DCEFFC', borderWidth: 1, borderColor: '#D1E6F7' },
  error: { color: C.loss },
});
