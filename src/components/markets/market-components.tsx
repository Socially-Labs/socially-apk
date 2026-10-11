import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, X } from 'lucide-react-native';
import { memo, useEffect } from 'react';
import { Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { AuthButton } from '@/components/shared/motion';
import { TokenIcon } from '@/components/shared/markets/market-graphics';
import type { Token, TradingContext, Period, History, marketsApi } from '@/api/markets';
import { formatUsdc } from '@/api/wallet';
import { periodChange } from './market-data';
import { marketChange, marketPrice } from '@/constants/captain-markets';
import { DiscoverPalette as D } from '@/constants/theme';
import { CaptainMarketsPalette as M } from '@/constants/theme/captain-markets';
import { MarketTokenIcon } from './market-graphics';
import { HarbourMarketCard, MarketHarbourBoat } from './market-harbour-card';
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

export { MarketVaultCard } from './market-vault-card';

export const MarketRow = memo(function MarketRow({ token, context, invested, hidden, period, compact, onSelect, api, active, history }: { token: Token; context: TradingContext | null; invested: boolean; hidden: boolean; period: Period; compact: boolean; onSelect: (token: Token) => void; api: ReturnType<typeof marketsApi>; active: boolean; history: History | null }) {
  useEffect(() => { if (active && token.instrumentId) return api.watchInstrument(token.instrumentId); }, [api, active, token.instrumentId]);
  const change = periodChange(token, period, history), held = context?.holdings.find(h => h.mint === token.mint);
  const price = token.price?.priceUsd ? marketPrice(Number(token.price.priceUsd)) : '—';
  const changeText = change === null ? '—' : marketChange(Number(change));
  const notices = [
    !token.tradable ? token.instrumentId === 'USDC' ? 'Vault reserve' : token.tradeReason === 'registration_required' ? 'Open to trade' : 'Browse only' : null,
    token.price?.source === 'JUPITER_TOKENS_V2' ? 'Jupiter metadata price' : null,
    token.discovery?.metrics.status === 'STALE' ? 'Cached metrics · updating' : null,
    token.price?.status !== 'CURRENT' ? !token.tracked ? 'Live tracking unavailable' : token.price?.priceUsd ? 'Price updating · last known value' : 'Price unavailable' : null,
  ].filter(Boolean).join(' · ');
  return <HarbourMarketCard active={active} compact={compact} label={`${token.symbol}, ${token.name}, ${price}, ${changeText} over ${period}, ${token.price?.status ?? 'unavailable'}${notices ? `, ${notices}` : ''}. Open market.`} onPress={() => onSelect(token)} testID={`market-row-${token.symbol}`}>
    {(progress, tileStyle) => <>
    <View style={[s.rowTop, compact && s.compactRowTop]}>
      <Animated.View style={[s.tokenTile, tileStyle]}><LinearGradient colors={M.tokenGlass} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} /><View style={s.tokenMark}>{token.instrumentId === 'SOL' ? <TokenIcon symbol="SOL" size={34} solanaBackground="transparent" /> : <MarketTokenIcon symbol={token.symbol} icon={token.icon} tracked={token.tracked} size={30} />}</View></Animated.View>
      <View style={s.tokenName}><Text style={s.symbol} numberOfLines={1}>{token.symbol}</Text><Text style={s.tokenSubtitle} numberOfLines={1}>{token.name}</Text></View>
      <MarketHarbourBoat progress={progress} compact={compact} />
      <View style={s.priceColumn}>
        <Text style={[s.price, compact && s.compactPrice]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} testID={`market-price-${token.symbol}`}>{price}</Text>
        <View style={s.changeRow}><Text style={[s.change, { color: change === null ? D.muted : Number(change) < 0 ? D.negative : D.positive }]}>{changeText}</Text><Text style={s.changePeriod}>{period.toLowerCase()}</Text></View>
      </View>
    </View>
    {invested ? <View style={s.rowMeta}><Text style={s.metaText}>Position {hidden ? '••••' : held?.valueUsdc ? `${formatUsdc(held.valueUsdc)} USDC` : 'Unavailable'}</Text><Text style={s.metaText}>{hidden ? '••••' : held?.quantity ?? '—'} {token.symbol}</Text></View> : null}
    {notices ? <Text style={s.rowNotice}>{notices}</Text> : null}
    </>}
  </HarbourMarketCard>;
});
