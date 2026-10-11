import { drawdown, percent, performanceSeries, periodLabel, type DiscoverCaptain, type Period } from '@/constants/discover';
import { DiscoverPalette as D } from '@/constants/theme';
import { useId, useMemo } from 'react';
import { chartGeometry } from '@/components/shared/charts/chart-geometry';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, Path, Stop, LinearGradient as SvgGradient } from 'react-native-svg';

export function PerformanceChart({ captain, period, height = 92, dark = false, grid = false, color: chartColor }: {
  captain: DiscoverCaptain; period: Period; height?: number; dark?: boolean; grid?: boolean; color?: string;
}) {
  const id = `performance-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const geometry = useMemo(() => chartGeometry(performanceSeries(captain, period).map((value, time) => ({ time, value, label: '' })), 320, 112), [captain, period]);
  const path = geometry.paths[0]?.line ?? '';
  const color = chartColor ?? (dark ? D.heroChart : captain.returns[period] >= 0 ? D.positive : D.negative);
  const end = geometry.points.at(-1);
  return <View style={{ height }} accessible accessibilityRole="image"
    accessibilityLabel={`${captain.name} sample portfolio chart. ${periodLabel(period)} ${percent(captain.returns[period])}. Maximum drawdown ${drawdown(captain, period).toFixed(1)} percent.`}>
    <Svg width="100%" height="100%" viewBox="0 0 320 112" preserveAspectRatio="none">
      <Defs><SvgGradient id={id} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={color} stopOpacity={dark ? 0.22 : 0.12} /><Stop offset="1" stopColor={color} stopOpacity={0} /></SvgGradient></Defs>
      {grid ? [18, 56, 94].map(y => <Line key={y} x1={0} x2={320} y1={y} y2={y} stroke={dark ? D.heroLine : D.line} strokeDasharray="3 5" />) : null}
      <Path d={`${path} L312 102 L6 102 Z`} fill={`url(#${id})`} />
      {dark ? <><Path d={path} fill="none" stroke={color} strokeWidth={10} strokeOpacity={0.04} /><Path d={path} fill="none" stroke={color} strokeWidth={5} strokeOpacity={0.1} /></> : null}
      <Path d={path} fill="none" stroke={color} strokeWidth={dark ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round" />
      {end ? <Circle cx={end.x} cy={end.y} r={3} fill={color} /> : null}
    </Svg>
  </View>;
}
