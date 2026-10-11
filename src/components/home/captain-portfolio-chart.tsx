import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PortfolioPoint } from '@/api/captain-portfolio';
import { portfolioPercent } from '@/api/captain-portfolio-display';
import { InterFont } from '@/constants/fonts';
import { CaptainHomePalette as C } from '@/constants/theme';
import { TimeSeriesChart } from '@/components/shared/charts/time-series-chart';

const shortDate = (at: string) => new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
export const CaptainPortfolioChart = memo(function CaptainPortfolioChart({ points, hidden, loading, unavailable, height = 80, color = C.icon, interactive = true, testID = 'captain-performance-chart' }: {
  points: PortfolioPoint[]; hidden: boolean; loading: boolean; unavailable: boolean; height?: number; color?: string; interactive?: boolean; testID?: string;
}) {
  const data = useMemo(() => points.map(point => ({ time: Date.parse(point.at), value: point.netReturnPercent === null ? null : Number(point.netReturnPercent),
    gap: point.hasGap, segment: point.segment, label: `${shortDate(point.at)} · ${portfolioPercent(point.netReturnPercent)}` })), [points]);
  const valid = data.filter(p => !p.gap && p.value !== null && Number.isFinite(p.value));
  const message = hidden ? 'Chart hidden' : loading ? 'Loading performance…' : valid.length < 2
    ? unavailable ? 'Return history is unavailable for this period.' : 'Your chart will appear as valuation history builds.' : null;
  if (message) return <View testID={testID} style={[s.empty, { minHeight: height + 18 }]}><Text style={s.copy}>{message}</Text></View>;
  return <TimeSeriesChart data={data} height={height} color={color} axes interactive={interactive} minimumRange={0.000001} testID={testID}
    inspectionTestID={testID === 'captain-performance-chart' ? 'captain-chart-inspect' : undefined}
    tooltipTestID={testID === 'captain-performance-chart' ? 'captain-chart-tooltip' : undefined}
    description="Net return chart from recorded valuations. Deposits and withdrawals are excluded from investment returns."
    startLabel={shortDate(points[0].at)} endLabel={shortDate(points.at(-1)!.at)}
    gapLabel={points.some(p => p.hasGap || p.netReturnPercent === null) ? 'Gaps indicate unavailable valuations.' : undefined} />;
});
const s = StyleSheet.create({
  empty: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18 },
  copy: { fontFamily: InterFont.regular, color: C.secondary, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
