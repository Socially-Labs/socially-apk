import { useState } from 'react';
import { Users } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { useAccountSettings } from '@/components/settings/settings-provider';
import { selectionFeedback } from '@/components/shared/feedback';
import { FundVaultIcon } from '@/components/shared/icons/product-icons';
import { captainAumPerformance, captainChange, captainMoney, captainPercent, captainTotals, sampleCaptainVaults, type CaptainPeriod, type CaptainVault } from '@/constants/captain-dashboard';
import { BrandFont, InterFont } from '@/constants/fonts';
import { CaptainHomePalette as C, DiscoverPalette as D } from '@/constants/theme';
import { HomePerformanceCard } from './home-performance-card';
import { CaptainActions } from './captain-home-sections';
import { CaptainDashboardSheet } from './captain-dashboard-sheet';
import type { CaptainPanel } from './captain-home-types';

export function CaptainOverview({ compact, heroSpace, panel, onPanel }: {
  compact: boolean; heroSpace: number; panel: CaptainPanel | null; onPanel: (panel: CaptainPanel | null) => void;
}) {
  const { settings, ready, saving, updateSettings } = useAccountSettings();
  const [vaults, setVaults] = useState<CaptainVault[]>(() => [...sampleCaptainVaults]);
  const [period, setPeriod] = useState<CaptainPeriod>('30D');
  const [locallyHidden, setLocallyHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hidden = !ready || settings.hideBalances || locallyHidden;
  const total = captainTotals(vaults);
  const performance = captainAumPerformance(period, total.aumCents);
  function showPanel(next: CaptainPanel | null) { selectionFeedback(); onPanel(next); }
  async function toggleBalances() {
    const next = !hidden;
    if (next) setLocallyHidden(true);
    setError(null);
    try { await updateSettings({ hideBalances: next }); setLocallyHidden(false); }
    catch { setError(next ? 'Hidden here. Your preference couldn’t be saved.' : 'Couldn’t show balances. Try again.'); }
  }
  function createDraft(name: string, strategy: CaptainVault['strategy']) {
    const id = `draft-${vaults.filter(vault => vault.status === 'Draft').length + 1}`;
    setVaults(current => [...current, { id, name, strategy, status: 'Draft', aumCents: 0, crew: 0, exits: 0, earnedCents: 0,
      returns: { '7D': 0, '30D': 0, '90D': 0, ALL: 0 }, holdings: [] }]);
    showPanel({ kind: 'vault', id });
  }
  function toggleDeposits(id: string) {
    selectionFeedback();
    setVaults(current => current.map(vault => vault.id === id && vault.status !== 'Draft'
      ? { ...vault, status: vault.status === 'Active' ? 'Deposits paused' : 'Active' } : vault));
  }
  return <View testID="captain-home">
    <View style={[styles.hero, { minHeight: heroSpace }]}>
      <Text accessibilityRole="header" style={[styles.title, compact && styles.compactTitle]}>Lead the{'\n'}voyage.</Text>
      <Text style={styles.copy}>Trade. Grow. Build your Crew.</Text>
    </View>
    <HomePerformanceCard variant="frosted" label="Assets under management" balance={captainMoney(total.aumCents)}
      change={`${captainChange(performance.changeCents)} (${captainPercent(performance.percent)})`} positive={performance.changeCents >= 0}
      changeCaption={`AUM change · ${period === 'ALL' ? 'all time' : period}`}
      values={performance.values} chartDescription={`Sample assets under management from ${captainMoney(performance.values[0])} to ${captainMoney(total.aumCents)}. Includes allocations and value changes.`}
      metrics={[{ label: 'Active vaults', value: String(total.active), testID: 'captain-active-vaults', icon: <FundVaultIcon size={18} color={C.icon} strokeWidth={1.7} /> },
        { label: 'Crew members', value: String(total.crew), icon: <Users size={19} color={C.icon} strokeWidth={1.7} /> }]}
      hidden={hidden} canToggle={ready && !saving} onToggle={() => { void toggleBalances(); }} onOverview={() => showPanel({ kind: 'overview' })} overviewLabel="View assets under management breakdown"
      period={period} onPeriod={value => { selectionFeedback(); setPeriod(value); }} compact={compact} error={error}
      testIDPrefix="captain" summaryTestID="captain-aum-card" balanceTestID="captain-aum-value" changeTestID="captain-aum-change" overviewTestID="captain-overview" />
    <CaptainActions vaults={vaults} hidden={hidden} compact={compact} onPanel={showPanel} />
    <CaptainDashboardSheet panel={panel} vaults={vaults} hidden={hidden} onClose={() => showPanel(null)} onPanel={showPanel} onCreate={createDraft} onToggleDeposits={toggleDeposits} />
  </View>;
}

const styles = StyleSheet.create({
  hero: { paddingTop: 25, paddingBottom: 28, paddingHorizontal: 3 },
  title: { fontFamily: BrandFont.editorial, fontSize: 40, lineHeight: 40, letterSpacing: -0.4, color: D.ink },
  compactTitle: { fontSize: 34, lineHeight: 35 },
  copy: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 18, color: D.ink, marginTop: 10 },
});
