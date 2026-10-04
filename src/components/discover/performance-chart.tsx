import { drawdown, percent, performanceSeries, periodLabel, type DiscoverCaptain, type Period } from '@/constants/discover';
import { DiscoverPalette as D } from '@/constants/theme';
import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, Path, Stop, LinearGradient as SvgGradient } from 'react-native-svg';

export function PerformanceChart({ captain, period, height = 92, dark = false, grid = false, color: chartColor }: {
  captain: DiscoverCaptain; period: Period; height?: number; dark?: boolean; grid?: boolean; color?: string;
}) {
  const id = `performance-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const series = performanceSeries(captain, period);
  const min = Math.min(...series), max = Math.max(...series), span = Math.max(max - min, 1);
  const chartHeight = 90;
  const points = series.map((value, i) => [4 + i / (series.length - 1) * 312, 100 - (value - min) / span * chartHeight]);
  const path = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const color = chartColor ?? (dark ? D.heroChart : captain.returns[period] >= 0 ? D.positive : D.negative);
  const end = points[points.length - 1];
  return <View style={{ height }} accessible accessibilityRole="image"
    accessibilityLabel={`${captain.name} sample portfolio chart. ${periodLabel(period)} ${percent(captain.returns[period])}. Maximum drawdown ${drawdown(captain, period).toFixed(1)} percent.`}>
    <Svg width="100%" height="100%" viewBox="0 0 320 112" preserveAspectRatio="none">
      <Defs><SvgGradient id={id} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={color} stopOpacity={dark ? 0.22 : 0.12} /><Stop offset="1" stopColor={color} stopOpacity={0} /></SvgGradient></Defs>
      {grid ? [18, 56, 94].map(y => <Line key={y} x1={0} x2={320} y1={y} y2={y} stroke={dark ? D.heroLine : D.line} strokeDasharray="3 5" />) : null}
      <Path d={`${path} L316 112 L4 112 Z`} fill={`url(#${id})`} />
      {dark ? <><Path d={path} fill="none" stroke={color} strokeWidth={10} strokeOpacity={0.04} /><Path d={path} fill="none" stroke={color} strokeWidth={5} strokeOpacity={0.1} /></> : null}
      <Path d={path} fill="none" stroke={color} strokeWidth={dark ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={end[0]} cy={end[1]} r={3} fill={color} />
    </Svg>
  </View>;
}
