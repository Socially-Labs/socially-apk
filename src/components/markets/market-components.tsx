import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, ChevronDown, Eye, EyeOff, Search, X } from 'lucide-react-native';
import { memo } from 'react';
import { Text, TextInput, View } from 'react-native';
import { AuthButton } from '@/components/shared/motion';
import type { Token, TradingContext, Period, marketsApi } from '@/api/markets';
import { formatUsdc } from '@/api/wallet';
import { useMarketHistory } from '@/hooks/use-market-history';
import { periodChange } from './market-data';
import { compactMarketMoney, marketChange, marketPrice } from '@/constants/captain-markets';
import { DiscoverPalette as D } from '@/constants/theme';
import { CaptainMarketsPalette as M } from '@/constants/theme/captain-markets';
import { MarketChart, MarketTokenIcon } from './market-graphics';
import { marketStyles as s } from './market-styles';

export function MarketHero({ top, query, onQuery }: { top: number; query: string; onQuery: (value: string) => void }) {
  return <View style={[s.hero, { paddingTop: top }]}>
    <Image source={require('../../../assets/images/discover/investment-coast.webp')} contentFit="cover" contentPosition="right top" style={s.heroArt} accessible={false} />
    <LinearGradient colors={['rgba(245,247,251,0.84)', 'rgba(245,247,251,0.62)', D.background]} style={s.heroArt} pointerEvents="none" />
    <Text style={s.heading} accessibilityRole="header">Markets</Text>
    <Text style={s.intro}>Find your next move. Trade from your vault.</Text>
    <View style={s.search}>
      <Search size={18} color={D.secondary} />
      <TextInput testID="market-search" accessibilityLabel="Search token or mint address" placeholder="Search token or mint address" placeholderTextColor={D.secondary} value={query} onChangeText={onQuery} autoCapitalize="none" autoCorrect={false} returnKeyType="search" style={s.searchInput} />
      {query ? <AuthButton accessibilityRole="button" accessibilityLabel="Clear market search" testID="market-search-clear" onPress={() => onQuery('')} style={s.iconButton}><X size={17} color={D.secondary} /></AuthButton> : null}
    </View>
  </View>;
}

export function MarketVaultCard({ context, hidden, canToggle, onToggle, onSelect, onInvested }: { context: TradingContext | null; hidden: boolean; canToggle: boolean; onToggle: () => void; onSelect: () => void; onInvested: () => void }) {
  return <LinearGradient colors={M.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.vaultCard} testID="market-vault-card">
    <View style={s.vaultHeader}><AuthButton accessibilityRole="button" accessibilityLabel="Select trading vault" testID="market-vault-select" onPress={onSelect} style={s.vaultSelector}><Text numberOfLines={1} style={s.vaultName}>{context?.fund.name ?? 'Select your vault'}</Text><ChevronDown size={16} color={M.ink} /></AuthButton>
      <AuthButton accessibilityRole="button" accessibilityLabel={hidden ? 'Show vault balances' : 'Hide vault balances'} testID="market-balance-visibility" disabled={!canToggle} onPress={onToggle} style={s.vaultVisibility}>{hidden ? <EyeOff size={19} color={M.ink} /> : <Eye size={19} color={M.ink} />}</AuthButton></View>
    <Text style={s.heroLabel}>Vault reserve</Text><Text testID="market-available-balance" style={s.balance} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{hidden ? '••••••' : context ? `${formatUsdc(context.cashUsdc)} USDC` : '—'}</Text>
    <Text style={s.heroCaption}>{context ? `Paper trading${context.pending.length ? ` · ${context.pending.length} pending orders` : ''}` : 'Start a captain trial to trade'}</Text>
    <AuthButton accessibilityRole="button" accessibilityLabel="View invested markets" onPress={onInvested} style={s.cardFooter} testID="market-vault-invested"><Text style={s.statusLabel}>{context ? `${context.fund.status} · ${context.holdings.length} positions` : 'No trading vault selected'}</Text><View style={s.vaultArrow}><ArrowRight size={20} color={M.ink} /></View></AuthButton>
  </LinearGradient>;
}
export const MarketRow = memo(function MarketRow({ token, context, invested, hidden, period, compact, first, last, onSelect, api, active }: { token: Token; context: TradingContext | null; invested: boolean; hidden: boolean; period: Period; compact: boolean; first: boolean; last: boolean; onSelect: (token: Token) => void; api: ReturnType<typeof marketsApi>; active: boolean }) {
  const { history } = useMarketHistory(api, token.mint, token.tracked, period, token.price, active);
  const change = periodChange(token, period, history), held = context?.holdings.find(h => h.mint === token.mint);
  const price = token.price?.priceUsd ? marketPrice(Number(token.price.priceUsd)) : '—';
  const changeText = change === null ? '—' : marketChange(Number(change));
  return <AuthButton accessibilityRole="button" accessibilityLabel={`${token.symbol}, ${token.name}, ${price}, ${token.price?.status ?? 'unavailable'}. Open market.`} onPress={() => onSelect(token)} style={[s.row, compact && s.compactRow, first && s.firstRow, last && s.lastRow]} testID={`market-row-${token.symbol}`}>
    <View style={s.rowTop}><MarketTokenIcon symbol={token.symbol} tracked={token.tracked} size={compact ? 32 : 36} /><View style={s.tokenName}><Text style={s.symbol}>{token.symbol}</Text><Text style={s.tokenSubtitle} numberOfLines={1}>{token.name}</Text></View>
      {!compact ? <MarketChart token={token} period={period} history={history} small /> : null}
      <View style={s.priceColumn}><Text style={s.price} testID={`market-price-${token.symbol}`}>{price}</Text><Text style={[s.change, { color: change === null ? D.muted : Number(change) < 0 ? D.negative : D.positive }]}>{changeText}</Text></View></View>
    <View style={s.rowMeta}>{invested ? <><Text style={s.metaText}>Position {hidden ? '••••' : held?.valueUsdc ? `${formatUsdc(held.valueUsdc)} USDC` : 'Unavailable'}</Text><Text style={s.metaText}>{hidden ? '••••' : held?.quantity ?? '—'} {token.symbol}</Text></> : <><Text style={s.metaText}>24h vol {token.metrics.volume24h === null ? '—' : compactMarketMoney(Number(token.metrics.volume24h))}</Text><Text style={s.metaText}>Liquidity {token.metrics.liquidity === null ? '—' : compactMarketMoney(Number(token.metrics.liquidity))}</Text></>}</View>
    {token.price?.status !== 'CURRENT' ? <Text style={[s.metaText, { marginTop: 4 }]}>{token.tracked ? 'Price updating · last known value' : 'Search result · live tracking unavailable'}</Text> : null}
    {!last ? <View style={s.rowSeparator} pointerEvents="none" /> : null}
  </AuthButton>;
});
