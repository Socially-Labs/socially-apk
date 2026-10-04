import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { DrawdownIcon, FundVaultIcon, TradingAuthorityIcon } from '@/components/shared/icons/product-icons';
import { TokenIcon } from '@/components/shared/markets/market-graphics';
import { AuthButton } from '@/components/shared/motion';
import { money, percent, type DiscoverCaptain, type Period } from '@/constants/discover';
import { DiscoverPalette as D } from '@/constants/theme';
import { ChevronRight, LockKeyhole, Users } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { sharedStyles } from './captain-profile-styles';
import { type Detail } from './captain-profile-types';
import { DetailRow, Reason } from './captain-profile-ui';
import { PeriodControl, RiskLabel, discoveryStyles as S, Tag } from './discover-ui';

export function CaptainDetailSheet({ captain, period, detail, worst, onClose, onDetail, onPeriod, onVault }: {
  captain: DiscoverCaptain; period: Period; detail: Detail | null; worst: number; onClose: () => void;
  onDetail: (detail: Detail) => void; onPeriod: (period: Period) => void; onVault: () => void;
}) {
  const detailTitle = detail?.kind === 'trade' ? `${detail.trade.side} ${detail.trade.symbol}` : detail?.kind === 'holding' ? detail.holding.name : detail?.kind === 'risk' ? 'Risk, in perspective' : detail?.kind === 'authority' ? 'Who controls the vault?' : detail?.kind === 'period' ? 'Performance window' : detail?.kind === 'actions' ? captain.name : detail?.kind === 'strategy' ? 'Strategy focus' : 'Understanding performance';
  return (
    <DashboardSheet visible={detail !== null} title={detailTitle} onClose={onClose}>
      <View style={{ gap: 20 }}>
        {detail?.kind === 'period' ? <PeriodControl value={period} captain={captain} onChange={onPeriod} /> : null}
        {detail?.kind === 'actions' ? <>
          <AuthButton onPress={onVault} accessibilityRole="button" style={styles.menuRow}><FundVaultIcon size={20} color={D.ink} /><Text style={styles.cardHeading}>View the fund vault</Text><ChevronRight size={17} color={D.secondary} /></AuthButton>
          <AuthButton onPress={() => onDetail({ kind: 'risk' })} accessibilityRole="button" style={styles.menuRow}><DrawdownIcon size={20} color={D.ink} /><Text style={styles.cardHeading}>Understand this Captain’s risk</Text></AuthButton>
          <Text style={S.label}>Sample profile. Following and saves stay in this preview session.</Text>
        </> : null}
        {detail?.kind === 'strategy' ? <><Text style={S.heading}>{captain.fund}</Text><Text style={S.body}>{captain.description}</Text><View style={styles.tags}><Tag label={captain.strategy} />{captain.tags.map(tag => <Tag key={tag} label={tag} />)}</View></> : null}
        {detail?.kind === 'metrics' ? <>
          <Text style={S.body}>Return measures the change in the sample portfolio’s value over your selected period. Charts start at a value of 100 and end at the displayed return.</Text>
          <DetailRow label="Selected window" value={period === 'ALL' ? 'Since inception' : period} /><DetailRow label="Portfolio return" value={percent(captain.returns[period])} /><DetailRow label="Max drawdown" value={`−${worst.toFixed(1)}%`} />
          <Text style={S.body}>Drawdown is calculated from the same illustrated portfolio values. Fees, deposits, withdrawals, and a benchmark are not modeled in this preview. Live returns will require a documented methodology and on-chain records.</Text>
          <Text style={S.label}>AUM means assets under management. Crew is the number of members allocating to a vault. Neither metric guarantees safety.</Text>
        </> : null}
        {detail?.kind === 'risk' ? <>
          <RiskLabel captain={captain} /><Text style={S.body}>This sample strategy is classified as {captain.risk.toLowerCase()} risk based on its intended exposure and trading style. This is an illustrative label, not a validated risk assessment.</Text>
          <DetailRow label={`${period} max drawdown`} value={`−${worst.toFixed(1)}%`} /><DetailRow label="Largest asset allocation" value={`${Math.max(...captain.holdings.map(item => item.weight))}%`} /><DetailRow label="History" value={`${captain.months} months`} />
          <Text style={S.body}>Maximum drawdown is the largest fall from a previous peak. Actual losses can exceed a historical drawdown. Crypto assets, stablecoins, smart contracts, and wrapped assets each carry their own risks.</Text>
        </> : null}
        {detail?.kind === 'holding' ? <>
          <View style={S.row}><TokenIcon symbol={detail.holding.symbol} size={48} /><View style={{ gap: 5 }}><Text style={S.heading}>{detail.holding.symbol}</Text><Text style={S.label}>{captain.fund}</Text></View></View>
          <DetailRow label="Portfolio weight" value={`${detail.holding.weight}%`} /><DetailRow label="Sample position value" value={money(captain.aum * detail.holding.weight / 100)} />
          <Text style={S.body}>{detail.holding.symbol === 'USDC' ? 'The stablecoin reserve can reduce directional exposure and provide liquidity for future trades. It is not risk-free.' : 'This position is part of the Captain’s strategy. Its weight and value change with market prices and trades.'}</Text>
          <Text style={S.label}>Illustrative allocation. No live token account or market price is connected.</Text>
        </> : null}
        {detail?.kind === 'trade' ? <>
          <View style={S.row}><TokenIcon symbol={detail.trade.symbol} size={44} /><Text style={S.heading}>{detail.trade.side} {detail.trade.symbol}</Text></View>
          <DetailRow label="Trade value" value={money(detail.trade.amount)} /><DetailRow label="Slippage" value={`${detail.trade.slippage.toFixed(2)}%`} /><DetailRow label="When" value={detail.trade.ago} />
          <Text style={S.body}>A sample market swap from the vault’s trading history. Live trades will link to their Solana transaction for independent verification.</Text><Tag label="Illustrative · no on-chain transaction" />
        </> : null}
        {detail?.kind === 'authority' ? <>
          <Reason icon={Users} title="Crew supplies the capital" copy="Members join a shared fund and receive shares representing their portion of its portfolio." />
          <Reason icon={TradingAuthorityIcon} title="Captain gets trading permission" copy="The intended protocol lets Captains swap approved assets inside the fund. They cannot withdraw Crew funds or transfer them to another wallet." />
          <Reason icon={LockKeyhole} title="The program enforces the limits" copy="The Solana program must enforce approved assets, trading limits, and fund exits. Trade proceeds must stay inside the fund." />
          <Text style={S.body}>This preview does not connect to a deployed vault. Always review a live vault’s actual permissions and withdrawal terms before allocating.</Text>
        </> : null}
      </View>
    </DashboardSheet>
  );
}

const styles = StyleSheet.create({
  ...sharedStyles,
  menuRow: { minHeight: 48, flexDirection: 'row', gap: 10, alignItems: 'center' },
});
