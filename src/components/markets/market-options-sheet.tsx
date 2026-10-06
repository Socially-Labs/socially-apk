import { Check, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { AuthButton } from '@/components/shared/motion';
import type { Fund, TradingContext } from '@/api/markets';
import { formatUsdc } from '@/api/wallet';
import { defaultMarketFilters, marketPeriods, type MarketFilters, type MarketPeriod } from '@/constants/captain-markets';
import { DiscoverPalette as D } from '@/constants/theme';
import { MarketTokenIcon } from './market-graphics';
import { TradeDetail } from './market-trade-sheet';
import { marketStyles as s } from './market-styles';

export type MarketOptionSheet = 'vault' | 'period' | 'filters' | 'cash' | null;
export function MarketOptionsSheet({ kind, onClose, context, funds, onVault, hidden, period, onPeriod, filters, onFilters, onExplore }: { kind: MarketOptionSheet; onClose: () => void; context: TradingContext | null; funds: Fund[]; onVault: (id: string) => void; hidden: boolean; period: MarketPeriod; onPeriod: (period: MarketPeriod) => void; filters: MarketFilters; onFilters: (filters: MarketFilters) => void; onExplore: () => void }) {
  const title = kind === 'vault' ? 'Trading vault' : kind === 'period' ? 'Market timeframe' : kind === 'cash' ? 'USDC reserve' : 'Market filters';
  return <DashboardSheet visible={kind !== null} title={title} onClose={onClose}>
    {kind === 'vault' ? <><Text style={s.context}>Choose the vault whose funds and positions you want to view.</Text>{funds.map(item => <AuthButton key={item.id} testID={`market-select-vault-${item.id}`} accessibilityRole="button" accessibilityLabel={`${item.name}, ${item.status}`} accessibilityState={{ selected: item.id === context?.fund.id }} onPress={() => { onVault(item.id); onClose(); }} style={[s.sheetOption, item.id === context?.fund.id && s.selectedOption]}><View style={s.optionText}><Text style={s.optionTitle}>{item.name}</Text><Text style={s.optionHint}>{item.status}</Text><Text style={s.optionHint}>Trial ends {new Date(item.trialEnd).toLocaleDateString()}</Text></View>{item.id === context?.fund.id ? <Check size={18} color={D.accent} /> : <ChevronRight size={18} color={D.muted} />}</AuthButton>)}{!funds.length ? <Text style={s.emptyText}>No captain trials yet. Start a paper trial from Markets.</Text> : null}<Text style={s.optionHint}>Frozen vaults allow eligible sells. Completed trials cannot trade.</Text></> : null}
    {kind === 'period' ? <><Text style={s.context}>Price changes and market sorting use this timeframe. Volume is always measured over 24 hours.</Text>{marketPeriods.map(item => <AuthButton key={item} accessibilityRole="button" accessibilityLabel={`${item} market timeframe`} accessibilityState={{ selected: item === period }} testID={`market-select-period-${item}`} onPress={() => { onPeriod(item); onClose(); }} style={[s.sheetOption, item === period && s.selectedOption]}><Text style={[s.optionTitle, { flex: 1 }]}>{item === '1H' ? 'Past hour' : item === '24H' ? 'Past 24 hours' : item === '7D' ? 'Past 7 days' : 'Past 30 days'}</Text>{item === period ? <Check size={18} color={D.accent} /> : null}</AuthButton>)}</> : null}
    {kind === 'filters' ? <FilterForm initial={filters} onApply={value => { onFilters(value); onClose(); }} /> : null}
    {kind === 'cash' && context ? <><View style={[s.chartHeading, { marginBottom: 20 }]}><MarketTokenIcon symbol="USDC" size={42} /><View><Text style={s.symbol}>USDC · USD Coin</Text><Text style={s.label}>Your vault’s trading reserve</Text></View></View><TradeDetail label="Vault" value={context.fund.name} /><TradeDetail label="Available to trade" value={hidden ? '••••' : `${formatUsdc(context.cashUsdc)} USDC`} /><View style={s.notice}><Text style={s.noticeText}>Buy markets using this reserve. Selling a position returns USDC to the selected vault.</Text></View><AuthButton accessibilityRole="button" accessibilityLabel="Explore markets to trade with USDC" onPress={() => { onExplore(); onClose(); }} style={[s.primary, { marginTop: 20 }]} testID="market-cash-explore"><Text style={s.primaryText}>Explore markets</Text></AuthButton></> : null}
  </DashboardSheet>;
}

function FilterForm({ initial, onApply }: { initial: MarketFilters; onApply: (value: MarketFilters) => void }) {
  const [draft, setDraft] = useState(initial);
  return <>
    <Text style={s.sectionTitle}>Asset type</Text><View style={s.chipRow}>{(['All', 'Major assets', 'Tokens', 'Memecoins'] as const).map(value => <FilterChip key={value} label={value} selected={draft.category === value} onPress={() => setDraft({ ...draft, category: value })} />)}</View>
    <Text style={s.sectionTitle}>Minimum liquidity</Text><View style={s.chipRow}>{([0, 25000000, 100000000] as const).map(value => <FilterChip key={value} label={value === 0 ? 'Any' : value === 25000000 ? '$25M+' : '$100M+'} selected={draft.liquidity === value} onPress={() => setDraft({ ...draft, liquidity: value })} />)}</View>
    <Text style={s.sectionTitle}>Sort by</Text><View style={s.chipRow}>{(['Volume', 'Gainers', 'Losers'] as const).map(value => <FilterChip key={value} label={value === 'Volume' ? '24h volume' : value} selected={draft.sort === value} onPress={() => setDraft({ ...draft, sort: value })} />)}</View>
    <View style={s.footerRow}><AuthButton accessibilityRole="button" accessibilityLabel="Reset market filters" testID="market-filter-reset" onPress={() => setDraft(defaultMarketFilters)} style={[s.secondary, { flex: 1 }]}><Text style={s.secondaryText}>Reset</Text></AuthButton><AuthButton accessibilityRole="button" accessibilityLabel="Apply market filters" testID="market-filter-apply" onPress={() => onApply(draft)} style={[s.primary, { flex: 2 }]}><Text style={s.primaryText}>Apply filters</Text></AuthButton></View>
  </>;
}
function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <AuthButton accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} testID={`market-filter-${label}`} onPress={onPress} style={[s.chip, selected && s.selectedChip]}><Text style={[s.chipText, selected && s.selectedChipText]}>{label}</Text></AuthButton>;
}
