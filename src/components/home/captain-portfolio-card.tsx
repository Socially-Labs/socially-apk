import { Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { CaptainPortfolio } from '@/api/captain-portfolio';
import type { CaptainRange } from '@/api/captain-dashboard';
import { amountSign, periodLabel, portfolioMoney, portfolioPercent } from '@/api/captain-portfolio-display';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont, InterFont } from '@/constants/fonts';
import { CaptainHomePalette as C } from '@/constants/theme';
import { CaptainPortfolioChart } from './captain-portfolio-chart';

const periods = ['7D', '30D', 'ALL'] as const;
const noPoints: CaptainPortfolio['points'] = [];
const tone = (value: string | null | undefined) => amountSign(value) === -1 ? C.loss : amountSign(value) === 1 ? C.gain : C.secondary;
export function CaptainPortfolioCard({ portfolio, period, loading, hidden, canToggle, compact, error, onPeriod, onToggle, onRetry }: {
  portfolio: CaptainPortfolio | null; period: CaptainRange; loading: boolean; hidden: boolean; canToggle: boolean; compact: boolean;
  error: string | null; onPeriod: (period: CaptainRange) => void; onToggle: () => void; onRetry: () => void;
}) {
  const { height } = useWindowDimensions();
  const dense = height < 800, tiny = height < 680;
  const selected = portfolio?.range === period ? portfolio : null;
  const waiting = loading && !selected;
  const pnl = selected?.netPnlUsdc, percent = selected?.netReturnPercent;
  const money = (value: string | null | undefined, signed = false) => hidden ? '••••' : portfolioMoney(value, signed);
  const status = portfolio?.valuationStatus;
  return <LinearGradient colors={C.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.card, dense && s.denseCard, tiny && s.tinyCard]} testID="captain-aum-card">
    <View style={s.heading}><Text style={s.label}>Total assets managed <Text style={s.paper}>· Paper</Text></Text>
      <AuthButton testID="captain-balance-visibility" accessibilityRole="button" accessibilityLabel={hidden ? 'Show portfolio balances' : 'Hide portfolio balances'} disabled={!canToggle}
        accessibilityState={{ disabled: !canToggle }} onPress={onToggle} style={s.eyeButton}>{hidden ? <EyeOff size={19} color={C.ink} /> : <Eye size={19} color={C.ink} />}</AuthButton>
    </View>
    <Text testID="captain-aum-value" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={[s.balance, compact && s.compactBalance]}>{hidden ? '••••••' : portfolioMoney(portfolio?.aumUsdc)}</Text>
    <View style={s.pnlRow}><Text style={s.pnlLabel}>Net P&amp;L</Text><Text testID="captain-net-pnl" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[s.pnl, { color: hidden ? C.secondary : tone(pnl) }]}>{money(pnl, true)}</Text>
      <View style={[s.pill, { backgroundColor: hidden || amountSign(percent) == null || amountSign(percent) === 0 ? C.tileIcon : amountSign(percent) === -1 ? C.lossSurface : C.gainSurface }]}>
        <Text testID="captain-aum-change" style={[s.percent, { color: hidden ? C.secondary : tone(percent) }]}>{hidden ? '••••' : portfolioPercent(percent)}</Text>
      </View>
    </View>
    <View style={s.chartHeader}><Text style={s.chartTitle}>Net return · {periodLabel(period).toLowerCase()}</Text><View accessibilityRole="tablist" accessibilityLabel="Portfolio performance period" style={s.periods}>
      {periods.map(value => <AuthButton key={value} accessibilityRole="tab" accessibilityLabel={`${periodLabel(value)} performance`} accessibilityState={{ selected: period === value }}
        aria-selected={period === value} testID={`captain-period-${value}`} onPress={() => onPeriod(value)} style={[s.period, period === value && s.periodSelected]}><Text style={[s.periodText, period === value && s.periodSelectedText]}>{value}</Text></AuthButton>)}
    </View></View>
    <CaptainPortfolioChart height={dense ? 72 : 80} points={selected?.points ?? noPoints} hidden={hidden} loading={waiting} unavailable={!!error || status !== 'CURRENT' || selected?.coverage === 'PARTIAL' && selected.netReturnPercent === null} />
    {!tiny ? <View style={s.metrics}>
      <View style={[s.metric, s.firstMetric]}><Text style={s.metricLabel}>Settled vault P&amp;L</Text><Text testID="captain-settled-pnl" adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={[s.metricValue, { color: hidden ? C.secondary : tone(selected?.settledVaultPnlUsdc) }]}>{money(selected?.settledVaultPnlUsdc, true)}</Text></View>
      <View style={s.metric}><Text style={s.metricLabel}>Open vault P&amp;L</Text><Text testID="captain-open-pnl" adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={[s.metricValue, { color: hidden ? C.secondary : tone(selected?.openVaultPnlUsdc) }]}>{money(selected?.openVaultPnlUsdc, true)}</Text></View>
    </View> : null}
    {error ? <View style={s.footer}><AuthButton accessibilityRole="button" accessibilityLabel="Retry" accessibilityHint={error} onPress={onRetry} style={s.retry}><Text style={s.retryText}>Retry</Text></AuthButton></View> : null}
  </LinearGradient>;
}
const s = StyleSheet.create({
  card: { height: 310, borderRadius: 24, borderCurve: 'continuous', borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingTop: 10, overflow: 'hidden', boxShadow: C.shadow },
  denseCard: { height: 290 },
  tinyCard: { height: 268 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 20 },
  label: { flex: 1, fontFamily: InterFont.semiBold, fontSize: 11, lineHeight: 18, color: C.ink },
  paper: { fontFamily: InterFont.regular, color: C.secondary, fontSize: 10 },
  eyeButton: { position: 'absolute', right: -10, top: -10, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  balance: { fontFamily: BrandFont.editorial, fontSize: 40, lineHeight: 43, letterSpacing: -1, color: C.ink, fontVariant: ['lining-nums', 'tabular-nums'] },
  compactBalance: { fontSize: 36 },
  pnlLabel: { fontFamily: InterFont.medium, fontSize: 10, lineHeight: 16, color: C.secondary },
  pnlRow: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 27 },
  pnl: { fontFamily: BrandFont.editorial, fontSize: 23, lineHeight: 27, flexShrink: 1, fontVariant: ['lining-nums', 'tabular-nums'] },
  pill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  percent: { fontFamily: InterFont.semiBold, fontSize: 10, lineHeight: 16, fontVariant: ['tabular-nums'] },
  chartHeader: { height: 31, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartTitle: { fontFamily: InterFont.medium, fontSize: 10, color: C.secondary, lineHeight: 16 },
  periods: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  period: { minWidth: 40, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  periodSelected: { backgroundColor: C.tileIcon }, periodText: { fontFamily: InterFont.regular, color: C.secondary, fontSize: 10 },
  periodSelectedText: { color: C.ink, fontFamily: InterFont.semiBold },
  metrics: { flexDirection: 'row', height: 35, gap: 12, marginTop: 3 },
  metric: { flex: 1, minWidth: 0 }, firstMetric: { borderRightWidth: 1, borderRightColor: C.line, paddingRight: 8 },
  metricLabel: { fontFamily: InterFont.regular, color: C.secondary, fontSize: 9, lineHeight: 12 },
  metricValue: { fontFamily: BrandFont.editorial, fontSize: 19, lineHeight: 22, fontVariant: ['lining-nums', 'tabular-nums'] },
  footer: { flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center' },
  retry: { minWidth: 44, minHeight: 40, alignItems: 'center', justifyContent: 'center' }, retryText: { fontFamily: InterFont.semiBold, color: C.ink, fontSize: 11 },
});
