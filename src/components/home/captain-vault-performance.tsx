import { ShipLoader } from '@/components/shared/refresh/ship-loader';
import { ChevronRight, Compass, Ship, Waves } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import type { CaptainRange } from '@/api/captain-dashboard';
import { amountSign, periodLabel, portfolioMoney, portfolioPercent } from '@/api/captain-portfolio-display';
import type { useCaptainDashboard } from '@/hooks/use-captain-dashboard';
import { AuthButton } from '@/components/shared/motion';
import { InterFont, BrandFont } from '@/constants/fonts';
import { CaptainHomePalette as C } from '@/constants/theme';

const icons = [Ship, Compass, Waves];
export function CaptainVaultPerformance({ data, period, onPeriod, hidden, onVault }: {
  data: ReturnType<typeof useCaptainDashboard>; period: CaptainRange; onPeriod: (period: CaptainRange) => void; hidden: boolean; onVault: (id: string) => void;
}) {
  const selected = data.portfolio?.range === period ? data.portfolio : null;
  const money = (value: string | null | undefined, signed = false) => hidden ? '••••' : portfolioMoney(value, signed);
  const color = (value: string | null) => hidden ? C.secondary : amountSign(value) === -1 ? C.loss : amountSign(value) === 1 ? C.gain : C.secondary;
  return <View testID="captain-vault-contributions" style={s.content}>
    <View style={s.heading}><Text style={s.label}>Net P&amp;L · {periodLabel(period).toLowerCase()}</Text><View style={s.periods} accessibilityRole="tablist" accessibilityLabel="Vault contribution period">
      {(['7D', '30D', 'ALL'] as const).map(value => <AuthButton key={value} accessibilityRole="tab" accessibilityLabel={`${periodLabel(value)} vault performance`} aria-selected={period === value}
        accessibilityState={{ selected: period === value }} onPress={() => onPeriod(value)} style={[s.period, period === value && s.selected]}><Text style={[s.periodText, period === value && s.selectedText]}>{value}</Text></AuthButton>)}
    </View></View>
    <Text testID="captain-contribution-total" style={[s.total, { color: color(selected?.netPnlUsdc ?? null) }]}>{money(selected?.netPnlUsdc, true)}</Text>
    <Text style={s.copy}>Each vault’s contribution to investment P&amp;L. Completed vaults stay in performance history; Captain fee income is separate.</Text>
    {data.contributionRevision && selected && data.contributionRevision !== selected.revision ? <View><Text style={s.note}>Vault values were updated separately from the summary.</Text><AuthButton accessibilityRole="button" onPress={data.refresh} style={s.retry}><Text style={s.buttonText}>Refresh vault values</Text></AuthButton></View> : null}
    {data.detailError ? <View style={s.errorBox}><Text accessibilityRole="alert" style={s.error}>{data.detailError}</Text><AuthButton accessibilityRole="button" onPress={data.refresh} style={s.retry}><Text style={s.buttonText}>Retry vault performance</Text></AuthButton></View> : null}
    {data.detailLoading && !data.loadingMore ? <ShipLoader compact label="Updating vault performance…"/> : null}
    {!data.detailLoading && !data.detailError && data.contributions.length === 0 ? <Text style={s.copy}>Your vault performance will appear here once a vault is valued.</Text> : null}
    <View style={s.rows}>{data.contributions.map((vault, index) => {
      const Icon = icons[index % icons.length];
      return <AuthButton key={vault.vaultId} testID={`captain-contribution-${vault.vaultId}`} accessibilityRole="button" accessibilityLabel={`View ${vault.name} vault details`}
        onPress={() => onVault(vault.vaultId)} style={s.row}>
        <View style={s.icon}><Icon size={21} color={C.icon} strokeWidth={1.7} /></View>
        <View style={s.info}><Text numberOfLines={2} style={s.name}>{vault.name}</Text><Text style={s.copy}>AUM {money(vault.aumUsdc)}</Text><Text style={s.phase}>{vault.phase.toLowerCase()}{vault.valuationStatus !== 'CURRENT' ? ` · ${vault.valuationStatus.toLowerCase()}` : ''}</Text></View>
        <View style={s.values}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[s.pnl, { color: color(vault.netPnlUsdc) }]}>{money(vault.netPnlUsdc, true)}</Text><Text style={s.percent}>{hidden ? '••••' : portfolioPercent(vault.netReturnPercent)}</Text></View>
        <ChevronRight size={16} color={C.ink} />
      </AuthButton>;
    })}</View>
    {data.loadingMore ? <ShipLoader compact label="Loading more vaults…"/> : null}
    {data.contributionCursor ? <AuthButton testID="captain-contributions-more" accessibilityRole="button" disabled={data.loadingMore} onPress={() => { void data.loadMore('contributions'); }} style={s.retry}><Text style={s.buttonText}>{data.loadingMore ? 'Loading…' : 'Load more vaults'}</Text></AuthButton> : null}
    <Text style={s.note}>Returns use recorded valuations. Missing marks stay unavailable.</Text>
  </View>;
}
const s = StyleSheet.create({
  content: { gap: 10 }, heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 4 },
  label: { fontFamily: InterFont.medium, color: C.secondary, fontSize: 11, lineHeight: 17, flexShrink: 1 },
  total: { fontFamily: BrandFont.editorial, fontSize: 36, lineHeight: 42, fontVariant: ['lining-nums', 'tabular-nums'] },
  copy: { fontFamily: InterFont.regular, color: C.secondary, fontSize: 11, lineHeight: 17 },
  periods: { flexDirection: 'row', gap: 2 }, period: { minWidth: 42, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  periodText: { fontFamily: InterFont.regular, color: C.secondary, fontSize: 11 }, selected: { backgroundColor: C.tileIcon }, selectedText: { fontFamily: InterFont.semiBold, color: C.ink },
  rows: { gap: 8, paddingVertical: 4 }, row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 13, borderRadius: 17, backgroundColor: C.iconSurface, minHeight: 80 },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.tileIcon, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, minWidth: 0, gap: 2 }, name: { fontFamily: InterFont.semiBold, color: C.ink, fontSize: 12, lineHeight: 17 },
  phase: { fontFamily: InterFont.regular, color: C.secondary, fontSize: 9, lineHeight: 14, textTransform: 'capitalize' },
  values: { alignItems: 'flex-end', maxWidth: '36%', gap: 3 }, pnl: { fontFamily: InterFont.semiBold, fontSize: 12, lineHeight: 18, fontVariant: ['tabular-nums'] },
  percent: { fontFamily: InterFont.regular, fontSize: 10, lineHeight: 15, color: C.secondary },
  note: { fontFamily: InterFont.regular, color: C.secondary, fontSize: 10, lineHeight: 16 },
  errorBox: { gap: 4 }, error: { fontFamily: InterFont.regular, color: C.loss, fontSize: 11, lineHeight: 17 },
  retry: { minHeight: 44, backgroundColor: C.tileIcon, borderRadius: 14, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  buttonText: { fontFamily: InterFont.semiBold, color: C.ink, fontSize: 12, lineHeight: 18 },
});
