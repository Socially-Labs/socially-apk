import { DrawdownIcon, FundVaultIcon, ReserveIcon, TradingAuthorityIcon } from '@/components/shared/icons/product-icons';
import { TokenIcon } from '@/components/shared/markets/market-graphics';
import { AuthButton } from '@/components/shared/motion';
import { money, type DiscoverCaptain, type Period } from '@/constants/discover';
import { InterFont } from '@/constants/fonts';
import { DiscoverPalette as D } from '@/constants/theme';
import { ArrowDownLeft, ArrowUpRight, Check, ChevronRight, Clock3, Info, Target } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { CaptainPerformance } from './captain-performance';
import { sharedStyles } from './captain-profile-styles';
import { type Detail, type ProfileTab } from './captain-profile-types';
import { DetailRow, Note, Reason, Section } from './captain-profile-ui';
import { Metric, discoveryStyles as S, Tag } from './discover-ui';

export function CaptainProfileTabContent({ captain, period, tab, onPeriod, onDetail }: {
  captain: DiscoverCaptain; period: Period; tab: ProfileTab; onPeriod: (period: Period) => void; onDetail: (detail: Detail) => void;
}) {
  return <>
    {tab === 'Overview' ? <>
      <CaptainPerformance captain={captain} period={period} onPeriod={onPeriod}
        onChoosePeriod={() => onDetail({ kind: 'period' })} onMetrics={() => onDetail({ kind: 'metrics' })} onRisk={() => onDetail({ kind: 'risk' })} />
      <Section title="Strategy" eyebrow>
        <AuthButton onPress={() => onDetail({ kind: 'strategy' })} accessibilityRole="button" accessibilityLabel="Read Captain strategy" style={styles.strategyRow}>
          <View style={styles.reasonIcon}><Target size={22} color={D.ink} /></View><View style={{ flex: 1, gap: 4 }}><Text style={styles.cardHeading}>Strategy Focus</Text><Text style={S.label}>{captain.fund} · {captain.tags.join(', ')}</Text></View><ChevronRight size={17} color={D.ink} />
        </AuthButton>
      </Section>
      <Section title="The track record" trailing={<Tag label="Sample history" />}>
        <View style={styles.metricGrid}><Metric label="Assets managed" value={money(captain.aum)} /><Metric label="Crew members" value={String(captain.crew)} /><Metric label="Trades · 30D" value={String(captain.trades)} /><Metric label="Volume · 30D" value={money(captain.volume)} /></View>
      </Section>
      <Section title="Behind the numbers">
        <Reason icon={Clock3} title={`${captain.months} months in market`} copy={captain.months < 12 ? 'A short history. More time is needed to judge consistency.' : 'A longer window to observe how this strategy behaves.'} />
        <Reason icon={Check} title={`${captain.positiveMonths} of ${captain.months} positive months`} copy="Monthly returns across the sample track record." />
        <Reason icon={ReserveIcon} title={`${captain.holdings.find(item => item.symbol === 'USDC')?.weight ?? 0}% stablecoin reserve`} copy="A reserve may reduce exposure. Stablecoins also carry risk." />
      </Section>
      <AuthButton accessibilityRole="button" onPress={() => onDetail({ kind: 'risk' })} style={styles.riskCard}><DrawdownIcon size={24} color={captain.risk === 'Higher' ? D.riskHigher : D.secondary} /><View style={{ flex: 1, gap: 6 }}><Text style={styles.cardHeading}>{captain.risk} risk, explained</Text><Text style={S.label}>Understand drawdown, concentration, and the limits of this history.</Text></View><ChevronRight size={18} color={D.risk} /></AuthButton>
    </> : null}
    {tab === 'Holdings' ? <>
      <Section title="Holdings" trailing={<Tag label={`${captain.holdings.length} assets`} />}>
        <Text style={S.body}>How the sample vault is allocated right now.</Text>
        <View style={styles.allocation} accessibilityRole="image" accessibilityLabel={captain.holdings.map(item => `${item.name} ${item.weight} percent`).join(', ')}>
          {captain.holdings.map((item, i) => <View key={item.symbol} style={{ flex: item.weight, backgroundColor: D.allocation[i], height: 10 }} />)}
        </View>
        {captain.holdings.map((holding, i) => <AuthButton key={holding.symbol} accessibilityRole="button" accessibilityLabel={`${holding.name}, ${holding.weight} percent allocation. View holding.`} onPress={() => onDetail({ kind: 'holding', holding })} style={styles.holding} testID={`holding-${holding.symbol.toLowerCase()}`}>
          <TokenIcon symbol={holding.symbol} size={38} /><View style={{ flex: 1, gap: 5 }}><Text style={styles.cardHeading}>{holding.symbol}</Text><Text style={S.label}>{holding.name}</Text></View><View style={{ alignItems: 'flex-end', gap: 5 }}><Text style={styles.cardHeading}>{holding.weight}%</Text><Text style={S.label}>{money(captain.aum * holding.weight / 100)}</Text></View><View style={[styles.holdingDot, { backgroundColor: D.allocation[i] }]} />
        </AuthButton>)}
      </Section>
      <Note icon={Info} title="A snapshot, not a promise" copy="Allocations change when the Captain trades. Wrapped assets add custody and bridge exposure alongside market risk." />
    </> : null}
    {tab === 'Trades' ? <>
      <Section title="Trading at a glance"><View style={styles.metricGrid}><Metric label="Trades · 30D" value={String(captain.trades)} /><Metric label="Volume · 30D" value={money(captain.volume)} /><Metric label="Avg. slippage · 30D" value={`${captain.slippage.toFixed(2)}%`} /><Metric label="Trading style" value={captain.trades > 180 ? 'Active' : 'Measured'} /></View></Section>
      <Section title="Recent trades" trailing={<Tag label="Sample trades" />}>
        {captain.activity.map(trade => <AuthButton key={trade.id} accessibilityRole="button" accessibilityLabel={`${trade.side} ${trade.symbol}, ${money(trade.amount)}, ${trade.ago}. View trade details.`} onPress={() => onDetail({ kind: 'trade', trade })} style={styles.trade} testID={`trade-${trade.id}`}>
          <View style={[styles.tradeIcon, { backgroundColor: trade.side === 'Buy' ? D.accentTint : D.soft }]}>{trade.side === 'Buy' ? <ArrowDownLeft size={20} color={D.accent} /> : <ArrowUpRight size={20} color={D.secondary} />}</View>
          <View style={{ flex: 1, gap: 5 }}><Text style={styles.cardHeading}>{trade.side} {trade.symbol}</Text><Text style={S.label}>{trade.ago}</Text></View><Text style={styles.cardHeading}>{money(trade.amount)}</Text><ChevronRight size={15} color={D.secondary} />
        </AuthButton>)}
      </Section>
      <Note icon={TradingAuthorityIcon} title="Execution matters" copy="Slippage is the difference between an expected price and the executed price. High activity and volume do not, by themselves, imply better returns." />
    </> : null}
    {tab === 'Vault' ? <>
      <View style={styles.vaultCard}><View style={styles.vaultIcon}><FundVaultIcon size={26} color={D.accent} /></View><Text style={styles.vaultEyebrow}>THE VAULT BEHIND THE CAPTAIN</Text><Text style={styles.vaultName}>{captain.fund}</Text><Text style={[S.body, { textAlign: 'center' }]}>One shared portfolio. Managed by {captain.name}.</Text><Tag label="Solana · preview vault" /></View>
      <Section title="Vault details"><DetailRow label="Assets under management" value={money(captain.aum)} /><DetailRow label="Crew" value={String(captain.crew)} /><DetailRow label="Strategy" value={captain.strategy} /><DetailRow label="Sample performance fee" value={`${captain.fee}%`} /><DetailRow label="Management fee" value="0% in this preview" /></Section>
      <AuthButton onPress={() => onDetail({ kind: 'authority' })} accessibilityRole="button" accessibilityLabel="Learn about Captain trading authority" style={styles.authorityCard}>
        <TradingAuthorityIcon size={22} color={D.accent} /><View style={{ flex: 1, gap: 6 }}><Text style={styles.cardHeading}>Permission to trade. No withdrawal access.</Text><Text style={S.label}>What a Captain can do, and what the vault must enforce.</Text></View><ChevronRight size={18} color={D.secondary} />
      </AuthButton>
      <Note icon={Info} title="A look at what’s ahead" copy="This is a sample vault. Deposits, withdrawals, fee terms, and on-chain permissions will be available once live vaults are connected." />
    </> : null}
  </>;
}

const styles = StyleSheet.create({
  ...sharedStyles,
  strategyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 24, columnGap: 16 },
  riskCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderRadius: 20, backgroundColor: D.riskTint },
  allocation: { flexDirection: 'row', gap: 3, overflow: 'hidden', borderRadius: 5, marginVertical: 6 },
  holding: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72, borderTopWidth: 1, borderTopColor: D.line, paddingTop: 12 },
  holdingDot: { width: 5, height: 5, borderRadius: 3 },
  trade: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 70, paddingVertical: 12, borderTopWidth: 1, borderTopColor: D.line },
  tradeIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  vaultCard: { padding: 26, borderRadius: 24, backgroundColor: D.accentTint, alignItems: 'center', gap: 14 },
  vaultIcon: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: D.surface },
  vaultEyebrow: { fontFamily: InterFont.semiBold, fontSize: 9, letterSpacing: 1.3, color: D.accent, textAlign: 'center' },
  vaultName: { fontFamily: InterFont.semiBold, fontSize: 24, lineHeight: 31, letterSpacing: -0.6, color: D.ink, textAlign: 'center' },
  authorityCard: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 20, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.line },
});
