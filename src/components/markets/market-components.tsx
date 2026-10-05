import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, ChevronDown, Eye, EyeOff, Search, X } from 'lucide-react-native';
import { memo } from 'react';
import { Text, TextInput, View } from 'react-native';
import { AuthButton } from '@/components/shared/motion';
import type { CaptainVault } from '@/constants/captain-dashboard';
import { availableCash, compactMarketMoney, holdingValue, holdingWeight, marketChange, marketMoney, marketPrice, type MarketPeriod, type MarketToken } from '@/constants/captain-markets';
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

export function MarketVaultCard({ vault, hidden, canToggle, onToggle, onSelect, onInvested }: { vault: CaptainVault; hidden: boolean; canToggle: boolean; onToggle: () => void; onSelect: () => void; onInvested: () => void }) {
  const active = vault.status === 'Active';
  return <LinearGradient colors={M.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.vaultCard} testID="market-vault-card">
    <View style={s.vaultHeader}>
      <AuthButton accessibilityRole="button" accessibilityLabel={`Select trading vault. Current vault: ${vault.name}`} testID="market-vault-select" onPress={onSelect} style={s.vaultSelector}><Text numberOfLines={1} style={s.vaultName}>{vault.name}</Text><ChevronDown size={16} color={M.ink} /></AuthButton>
      <AuthButton accessibilityRole="button" accessibilityLabel={hidden ? 'Show vault balances' : 'Hide vault balances'} testID="market-balance-visibility" disabled={!canToggle} onPress={onToggle} style={s.vaultVisibility}>{hidden ? <EyeOff size={19} color={M.ink} /> : <Eye size={19} color={M.ink} />}</AuthButton>
    </View>
    <Text style={s.heroLabel}>Available to trade</Text>
    <Text testID="market-available-balance" style={s.balance} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{hidden ? '••••••' : marketMoney(availableCash(vault))}</Text>
    <Text style={s.heroCaption}>USDC · Vault reserve</Text>
    <AuthButton accessibilityRole="button" accessibilityLabel={`View ${vault.holdings.length} invested markets for ${vault.name}`} onPress={onInvested} style={s.cardFooter} testID="market-vault-invested">
      <View style={[s.vaultStatus, !active && s.draftStatus]}><View style={[s.statusDot, !active && s.draftDot]} /><Text style={[s.statusLabel, !active && s.draftLabel]}>{vault.status} · {vault.holdings.length} invested markets</Text></View>
      <View style={s.vaultArrow}><ArrowRight size={20} color={M.ink} /></View>
    </AuthButton>
  </LinearGradient>;
}

export const MarketRow = memo(function MarketRow({ token, vault, invested, hidden, period, compact, first, last, onSelect }: { token: MarketToken; vault: CaptainVault; invested: boolean; hidden: boolean; period: MarketPeriod; compact: boolean; first: boolean; last: boolean; onSelect: (token: MarketToken) => void }) {
  const change = token.changes[period];
  return <AuthButton accessibilityRole="button" accessibilityLabel={`${token.symbol}, ${token.name}, ${marketPrice(token.price)}, ${marketChange(change)} over ${period}.${invested ? hidden ? ' Vault position hidden.' : ` Vault position ${marketMoney(holdingValue(vault, token.symbol))}, ${holdingWeight(vault, token.symbol)} percent allocation.` : ''} ${token.symbol === 'USDC' ? 'View cash reserve.' : 'Open chart and trade.'}`} onPress={() => onSelect(token)} style={[s.row, compact && s.compactRow, first && s.firstRow, last && s.lastRow]} testID={`market-row-${token.symbol}`}>
    <View style={s.rowTop}>
      <MarketTokenIcon symbol={token.symbol} size={compact ? 32 : 36} />
      <View style={s.tokenName}><Text style={s.symbol}>{token.symbol}</Text><Text style={s.tokenSubtitle} numberOfLines={1}>{token.name}</Text></View>
      {!compact ? <MarketChart token={token} period={period} small /> : null}
      <View style={s.priceColumn}><Text style={s.price} testID={`market-price-${token.symbol}`}>{marketPrice(token.price)}</Text><Text style={[s.change, { color: change < 0 ? D.negative : D.positive }]}>{marketChange(change)}</Text></View>
    </View>
    <View style={s.rowMeta}>{invested ? <><Text style={s.metaText}>Position <Text style={{ color: D.ink }}>{hidden ? '••••' : marketMoney(holdingValue(vault, token.symbol))}</Text></Text><Text style={s.metaText}>{hidden ? '••••' : `${holdingWeight(vault, token.symbol)}%`} allocation</Text></> : <><Text style={s.metaText}>24h vol {compactMarketMoney(token.volume)}</Text><Text style={s.metaText}>Liquidity {compactMarketMoney(token.liquidity)}</Text></>}</View>
    {!last ? <View style={s.rowSeparator} pointerEvents="none" /> : null}
  </AuthButton>;
});
