import { BarChart3, ChevronDown, Info, Users } from 'lucide-react-native';
import { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { DiscoverPalette as D } from '@/constants/theme';
import { drawdown, money, percent, performanceSeries, periodLabel, type DiscoverCaptain, type Period } from '@/constants/discover';
import { PeriodControl, RiskLabel, discoveryStyles as S } from './discover-ui';

export function CaptainPerformance({ captain, period, onPeriod, onChoosePeriod, onMetrics, onRisk }: {
  captain: DiscoverCaptain; period: Period; onPeriod: (period: Period) => void;
  onChoosePeriod: () => void; onMetrics: () => void; onRisk: () => void;
}) {
  return <View style={styles.panel} testID="captain-performance-panel">
    <View style={S.between}>
      <AuthButton onPress={onMetrics} accessibilityRole="button" accessibilityLabel="About performance metrics" style={styles.heading}>
        <Text style={styles.eyebrow}>PORTFOLIO PERFORMANCE</Text><Info size={14} color={D.secondary} />
      </AuthButton>
      <AuthButton onPress={onChoosePeriod} accessibilityRole="button" accessibilityLabel="Choose performance period" style={styles.period}>
        <Text style={styles.periodText}>{period}</Text><ChevronDown size={13} color={D.muted} />
      </AuthButton>
    </View>
    <View style={styles.returns}>
      <View style={styles.returnCopy}><Text style={[styles.return, { color: captain.returns[period] >= 0 ? D.positive : D.negative }]} testID="captain-profile-return">{percent(captain.returns[period])}</Text><Text style={styles.caption}>{periodLabel(period)}</Text></View>
      <AuthButton onPress={onRisk} accessibilityRole="button" accessibilityLabel="Understand maximum drawdown" style={styles.loss}>
        <Text style={styles.lossNumber}>−{drawdown(captain, period).toFixed(1)}%</Text><Text style={styles.caption}>Max drawdown</Text>
      </AuthButton>
    </View>
    <PortfolioPlot captain={captain} period={period} />
    <PeriodControl value={period} captain={captain} onChange={onPeriod} />
    <View style={styles.metrics}>
      <View style={styles.metric}><View style={styles.metricIcon}><BarChart3 size={17} color={D.ink} /></View><View style={styles.metricCopy}><Text style={styles.metricValue}>{money(captain.aum).replace('$', '')}</Text><Text style={styles.metricCaption}>AUM (USD)</Text></View></View>
      <View style={styles.metric}><View style={styles.metricIcon}><Users size={17} color={D.ink} /></View><View style={styles.metricCopy}><Text style={styles.metricValue}>{captain.crew}</Text><Text style={styles.metricCaption}>Crew members</Text></View></View>
      <AuthButton onPress={onRisk} accessibilityRole="button" accessibilityLabel={`${captain.risk} risk, explained`} style={styles.metric}>
        <View style={styles.metricCopy}><RiskLabel captain={captain} textColor={D.ink} /><Text style={styles.metricCaption}>Risk level</Text></View>
      </AuthButton>
    </View>
  </View>;
}

function PortfolioPlot({ captain, period }: { captain: DiscoverCaptain; period: Period }) {
  const gradientId = `profile-plot-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const values = performanceSeries(captain, period).map(value => value - 100);
  // Label the actual portfolio-return scale, including zero, rather than
  // decorating a normalized sparkline with unrelated percentages.
  const low = Math.min(0, ...values), high = Math.max(0, ...values);
  const rawStep = Math.max((high - low) / 3, 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 5, 10].find(value => value * magnitude >= rawStep)! * magnitude;
  const minimum = Math.floor(low / step) * step - step;
  const maximum = Math.ceil(high / step) * step;
  const y = (value: number) => 25 + (maximum - value) / (maximum - minimum) * 92;
  const points = values.map((value, index) => [index / (values.length - 1) * 280, y(value)]);
  const line = points.map(([x, pointY], index) => `${index ? 'L' : 'M'}${x.toFixed(2)} ${pointY.toFixed(2)}`).join(' ');
  const end = points[points.length - 1];
  const color = captain.returns[period] >= 0 ? D.positive : D.negative;
  const ticks = Array.from({ length: Math.round((maximum - minimum) / step) + 1 }, (_, index) => minimum + index * step);
  return <View testID="captain-performance-chart" style={styles.plot} accessible accessibilityRole="image" accessibilityLabel={`${captain.name} sample portfolio performance: ${percent(captain.returns[period])} ${periodLabel(period)}. Percentage axis includes zero.`}>
    <Svg width="100%" height={110} viewBox="0 0 320 130" preserveAspectRatio="none">
      <Defs><LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={color} stopOpacity={0.22} /><Stop offset="1" stopColor={color} stopOpacity={0} /></LinearGradient></Defs>
      {ticks.map(value => <ViewTick key={value} value={value} y={y(value)} />)}
      <Path d={`${line} L280 130 L0 130 Z`} fill={`url(#${gradientId})`} />
      <Path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={end[0]} cy={end[1]} r={3} fill={color} stroke={D.surface} strokeWidth={1} />
      <Rect x={243} y={Math.max(0, end[1] - 26)} width={45} height={20} rx={5} fill={D.surface} />
      <SvgText x={265.5} y={Math.max(0, end[1] - 26) + 13} textAnchor="middle" fontFamily={InterFont.semiBold} fontSize={10} fill={color}>{percent(captain.returns[period])}</SvgText>
    </Svg>
  </View>;
}
function ViewTick({ value, y }: { value: number; y: number }) {
  return <><Line x1={0} x2={280} y1={y} y2={y} stroke={D.line} strokeDasharray="3 4" /><SvgText x={319} y={y + 3} textAnchor="end" fontFamily={InterFont.regular} fontSize={10} fill={D.muted}>{value > 0 ? '+' : value < 0 ? '−' : ''}{Math.abs(value)}%</SvgText></>;
}
const styles = StyleSheet.create({
  panel: { backgroundColor: D.glass, borderRadius: 24, borderWidth: 1, borderColor: D.glassBorder, padding: 16, gap: 9 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40, flexShrink: 1 },
  eyebrow: { fontFamily: InterFont.semiBold, fontSize: 8, letterSpacing: 1.4, color: D.secondary, flexShrink: 1 },
  period: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 36, paddingHorizontal: 11, borderRadius: 10, backgroundColor: D.soft },
  periodText: { fontFamily: InterFont.semiBold, fontSize: 12, color: D.ink },
  returns: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, returnCopy: { gap: 5 },
  return: { fontFamily: InterFont.semiBold, fontSize: 32, letterSpacing: -1.1, fontVariant: ['tabular-nums'] }, caption: { fontFamily: InterFont.regular, fontSize: 11, color: D.secondary },
  loss: { gap: 5, minHeight: 44, justifyContent: 'center' }, lossNumber: { fontFamily: InterFont.medium, fontSize: 19, color: D.ink }, plot: { height: 110 },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, paddingTop: 3 }, metric: { flexDirection: 'row', gap: 6, alignItems: 'center', flexShrink: 1 },
  metricIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: D.soft, alignItems: 'center', justifyContent: 'center' },
  metricCopy: { gap: 3, flexShrink: 1 }, metricValue: { fontFamily: InterFont.medium, fontSize: 12, color: D.ink }, metricCaption: { fontFamily: InterFont.regular, fontSize: 9, color: D.secondary },
});
