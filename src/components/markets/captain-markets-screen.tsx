import { router, useFocusEffect } from 'expo-router';
import { Bookmark, ChevronDown, SlidersHorizontal } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, Platform, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountSettings } from '@/components/settings/settings-provider';
import { AuthButton } from '@/components/shared/motion';
import type { Token } from '@/api/markets';
import { useMarkets } from '@/hooks/use-markets';
import { filterTokens } from './market-data';
import { defaultMarketFilters, type MarketFilters, type MarketPeriod, type MarketTab } from '@/constants/captain-markets';
import { DiscoverPalette as D } from '@/constants/theme';
import { CaptainMarketsPalette as M } from '@/constants/theme/captain-markets';
import { MarketHero, MarketRow, MarketVaultCard } from './market-components';
import { MarketOptionsSheet, type MarketOptionSheet } from './market-options-sheet';
import { MarketTradeSheet } from './market-trade-sheet';
import { marketStyles as s } from './market-styles';

export default function CaptainMarketsScreen() {
  const insets = useSafeAreaInsets(), { width } = useWindowDimensions();
  const { settings, ready, saving, updateSettings } = useAccountSettings();
  const hidden = !ready || settings.hideBalances;
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<MarketTab>('top');
  const [period, setPeriod] = useState<MarketPeriod>('24H');
  const [filters, setFilters] = useState<MarketFilters>(defaultMarketFilters);
  const [savedOnly, setSavedOnly] = useState(false);
  const [options, setOptions] = useState<MarketOptionSheet>(null);
  const [tradeToken, setTradeToken] = useState<Token | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeSession, setTradeSession] = useState(0);
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(''), [focused, setFocused] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setDebouncedQuery(query.trim()), 400); return () => clearTimeout(timer); }, [query]);
  const data = useMarkets(debouncedQuery), context = data.context;
  const markets = useMemo(() => filterTokens(data.tokens, context, filters, tab === 'invested', savedOnly, data.saved, period), [data.tokens, context, filters, tab, savedOnly, data.saved, period]);
  const liveTradeToken = tradeToken ? data.tokens.find(token => token.mint === tradeToken.mint) ?? tradeToken : null;
  const filterCount = Number(filters.category !== 'All') + Number(filters.liquidity !== 0) + Number(filters.sort !== 'Volume');
  useFocusEffect(useCallback(() => { setFocused(true); return () => { setFocused(false); setOptions(null); setTradeOpen(false); Keyboard.dismiss(); }; }, []));
  const selectToken = useCallback((token: Token) => {
    Keyboard.dismiss();
    if (token.instrumentId === 'USDC' && context) { setOptions('cash'); return; }
    setTradeToken(token); setTradeSession(value => value + 1); setTradeOpen(true);
  }, [context]);
  const renderItem = useCallback(({ item, index }: { item: Token; index: number }) => <MarketRow token={item} context={context} invested={tab === 'invested'} hidden={hidden} period={period} compact={width < 360} first={index === 0} last={index === markets.length - 1} onSelect={selectToken} api={data.api} active={focused} />, [context, tab, hidden, period, width, selectToken, markets.length, data.api, focused]);
  const reset = () => { setQuery(''); setFilters(defaultMarketFilters); setSavedOnly(false); };
  const togglePrivacy = async () => {
    setPrivacyError(null);
    try { await updateSettings({ hideBalances: !settings.hideBalances }); }
    catch { setPrivacyError('Could not update balance visibility. Try again.'); }
  };
  return <View style={s.screen} testID="captain-markets-screen">
    <FlatList data={markets} keyExtractor={item => item.mint} renderItem={renderItem} style={{ flex: 1 }} contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom + 142, 154) }]} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} testID="captain-markets-list" ListHeaderComponent={<>
      <MarketHero top={Math.max(insets.top, 16) + 12} query={query} onQuery={setQuery} />
      <MarketVaultCard context={context} hidden={hidden} canToggle={ready && !saving} onToggle={togglePrivacy} onSelect={() => { Keyboard.dismiss(); setOptions('vault'); }} onInvested={() => { reset(); setTab('invested'); }} />
      {data.error || data.privateError ? <Text style={s.error} accessibilityRole="alert">{data.error ?? data.privateError}</Text> : null}
      <AuthButton accessibilityRole="button" onPress={data.refresh} style={s.secondary}><Text style={s.secondaryText}>Refresh markets</Text></AuthButton>
      {data.subject ? <AuthButton accessibilityRole="button" onPress={()=>router.push('/vaults/create')} style={s.primary}><Text style={s.primaryText}>Create a vault round</Text></AuthButton> : null}
      {privacyError ? <Text style={s.error} accessibilityRole="alert">{privacyError}</Text> : null}
      <View style={s.tabs}>{([{ id: 'top', label: 'Top traded' }, { id: 'invested', label: 'Invested markets' }] as const).map(item => <AuthButton key={item.id} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: item.id === tab }} testID={`market-tab-${item.id}`} onPress={() => setTab(item.id)} style={[s.tab, tab === item.id && s.selectedTab]}><Text style={[s.tabText, tab === item.id && s.selectedTabText]}>{item.label}</Text></AuthButton>)}</View>
      <View style={s.toolbar}><AuthButton accessibilityRole="button" accessibilityLabel={`Change market timeframe, currently ${period}`} testID="market-period-select" onPress={() => { Keyboard.dismiss(); setOptions('period'); }} style={[s.toolbarButton, width < 360 && s.compactToolbarButton]}><Text style={[s.label, s.toolbarLabel, width < 360 && s.compactToolbarLabel]}>{tab === 'top' ? 'Top' : 'Performance'} · {period}</Text><ChevronDown size={14} color={M.ink} /></AuthButton><View style={s.toolbarActions}><AuthButton accessibilityRole="button" accessibilityLabel={savedOnly ? 'Show all markets' : 'Show saved markets'} accessibilityState={{ selected: savedOnly }} testID="market-saved-only" onPress={() => setSavedOnly(value => !value)} style={[s.iconButton, s.toolbarSaved, savedOnly && { backgroundColor: D.accentTint }]}><Bookmark size={18} color={M.ink} fill={savedOnly ? M.ink : 'transparent'} /></AuthButton><AuthButton accessibilityRole="button" accessibilityLabel={`Market filters${filterCount ? `, ${filterCount} active` : ''}`} testID="market-filters-open" onPress={() => { Keyboard.dismiss(); setOptions('filters'); }} style={[s.toolbarButton, width < 360 && s.compactToolbarButton, filterCount > 0 && { backgroundColor: D.accentTint }]}><SlidersHorizontal size={16} color={M.ink} /><Text style={[s.label, s.toolbarLabel, width < 360 && s.compactToolbarLabel]}>Filter{filterCount ? ` · ${filterCount}` : ''}</Text></AuthButton></View></View>
    </>} ListEmptyComponent={<View style={s.empty} testID="market-empty"><Text style={s.emptyTitle}>{data.loading ? 'Loading markets…' : savedOnly ? 'No saved markets here' : tab === 'invested' && !query ? 'No matching positions' : 'No markets found'}</Text><Text style={s.emptyText}>Try a token name, symbol or mint address,{ '\n' }or clear your filters to see more markets.</Text><AuthButton accessibilityRole="button" accessibilityLabel="Clear search and market filters" testID="market-empty-reset" onPress={reset} style={s.secondary}><Text style={s.secondaryText}>Clear search & filters</Text></AuthButton></View>} ListFooterComponent={<Text style={s.sample}>Live supported markets · USD prices · paper trading</Text>} />
    <MarketOptionsSheet kind={options} onClose={() => setOptions(null)} context={context} funds={data.funds} onVault={data.selectFund} hidden={hidden} period={period} onPeriod={setPeriod} filters={filters} onFilters={setFilters} onExplore={() => { reset(); setTab('top'); }} />
    {liveTradeToken ? <MarketTradeSheet key={`${data.subject}-${context?.fund.id}-${liveTradeToken.mint}-${tradeSession}`} visible={tradeOpen} token={liveTradeToken} context={context} hidden={hidden} initialPeriod={period} saved={data.saved.includes(liveTradeToken.mint)} onSaved={() => { void data.toggleSaved(liveTradeToken.mint); }} onClose={() => setTradeOpen(false)} api={data.api} subject={data.subject} onTerminal={data.refresh} /> : null}
  </View>;
}
