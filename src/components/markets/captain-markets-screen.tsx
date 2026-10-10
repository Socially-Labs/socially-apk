import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Bookmark, ChevronDown, SlidersHorizontal } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Platform, Text, View, useWindowDimensions, type ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountSettings } from '@/components/settings/settings-provider';
import { AuthButton } from '@/components/shared/motion';
import type { DiscoveryRequest, Period, Token } from '@/api/markets';
import { useMarkets } from '@/hooks/use-markets';
import { filterTokens } from './market-data';
import { defaultMarketFilters, type MarketFilters, type MarketTab } from '@/constants/captain-markets';
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
  const discoveryEnabled = process.env.EXPO_PUBLIC_MARKET_DISCOVERY_V1_ENABLED === 'true';
  const [feed, setFeed] = useState<'supported' | 'toptraded' | 'trending'>(discoveryEnabled ? 'toptraded' : 'supported');
  const [period, setPeriod] = useState<Period>('24H');
  const [filters, setFilters] = useState<MarketFilters>(defaultMarketFilters);
  const [savedOnly, setSavedOnly] = useState(false);
  const [options, setOptions] = useState<MarketOptionSheet>(null);
  const [tradeToken, setTradeToken] = useState<Token | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeSession, setTradeSession] = useState(0);
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(''), [focused, setFocused] = useState(false);
  const [visibleMints, setVisibleMints] = useState<Set<string>>(() => new Set());
  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 20, minimumViewTime: 200 }), []);
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken<Token>[] }) => {
    const next = new Set(viewableItems.filter(item => item.isViewable).slice(0, 6).map(item => item.item.mint));
    setVisibleMints(prior => prior.size === next.size && [...prior].every(mint => next.has(mint)) ? prior : next);
  }, []);
  useEffect(() => { const timer = setTimeout(() => setDebouncedQuery(query.trim()), 400); return () => clearTimeout(timer); }, [query]);
  const params = useLocalSearchParams<{ vaultId?: string }>();
  const discovery = useMemo<DiscoveryRequest | undefined>(() => discoveryEnabled ? {
    feed: tab === 'invested' || savedOnly ? 'supported' : feed,
    interval: period.toLowerCase(), sort: feed !== 'supported' && tab !== 'invested' && !savedOnly ? 'rank' : filters.sort.toLowerCase(),
    ...(filters.category !== 'All' ? { category: filters.category === 'Major assets' ? 'major' : filters.category === 'Memecoins' ? 'memecoin' : 'token' } : {}),
    ...(filters.liquidity ? { minLiquidityUsd: String(filters.liquidity) } : {}),
  } : undefined, [discoveryEnabled, tab, savedOnly, feed, period, filters]);
  const data = useMarkets(debouncedQuery, typeof params.vaultId === 'string' ? params.vaultId : null, discovery, savedOnly), context = data.context;
  const chooseFeed = (value: 'supported' | 'toptraded' | 'trending' | 'invested' | 'saved') => {
    setTab(value === 'invested' ? 'invested' : 'top'); setSavedOnly(value === 'saved');
    if (value === 'supported' || value === 'toptraded' || value === 'trending') setFeed(value);
    setPeriod('24H'); setFilters(defaultMarketFilters);
  };
  const markets = useMemo(() => filterTokens(data.tokens, context, filters, tab === 'invested', savedOnly, data.saved, period, data.feed?.sort === 'rank' || data.feed?.sort === 'relevance'), [data.tokens, context, filters, tab, savedOnly, data.saved, period, data.feed]);
  const liveTradeToken = tradeToken ? data.tokens.find(token => token.mint === tradeToken.mint) ?? tradeToken : null;
  const filterCount = Number(filters.category !== 'All') + Number(filters.liquidity !== 0) + Number(filters.sort !== 'Volume');
  useFocusEffect(useCallback(() => { setFocused(true); return () => { setFocused(false); setOptions(null); setTradeOpen(false); Keyboard.dismiss(); }; }, []));
  const selectToken = useCallback((token: Token) => {
    Keyboard.dismiss();
    if (token.instrumentId === 'USDC' && context) { setOptions('cash'); return; }
    setTradeToken(token); setTradeSession(value => value + 1); setTradeOpen(true);
  }, [context]);
  const renderItem = useCallback(({ item }: { item: Token }) => <MarketRow token={item} context={context} invested={tab === 'invested'} hidden={hidden} period={period} compact={width < 360} onSelect={selectToken} api={data.api} history={data.histories[item.mint] ?? null} active={focused && !tradeOpen && visibleMints.has(item.mint)} />, [context, tab, hidden, period, width, selectToken, data.api, data.histories, focused, tradeOpen, visibleMints]);
  const reset = () => { setQuery(''); setFilters(defaultMarketFilters); setSavedOnly(false); };
  const togglePrivacy = async () => {
    setPrivacyError(null);
    try { await updateSettings({ hideBalances: !settings.hideBalances }); }
    catch { setPrivacyError('Could not update balance visibility. Try again.'); }
  };
  return <View style={s.screen} testID="captain-markets-screen">
    <FlatList data={data.loading ? [] : markets} onEndReached={() => { if (focused && !tradeOpen && !data.loading && !data.loadingMore && !data.error) void data.loadMore(); }} onEndReachedThreshold={0.15} keyExtractor={item => item.mint} renderItem={renderItem} onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={viewabilityConfig} extraData={visibleMints} style={{ flex: 1 }} contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom + 142, 154) }]} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} testID="captain-markets-list" ListHeaderComponent={<>
      <MarketHero top={Math.max(insets.top, 16) + 12} query={query} onQuery={setQuery} />
      <MarketVaultCard context={context} hidden={hidden} canToggle={ready && !saving} onToggle={togglePrivacy} onSelect={() => { Keyboard.dismiss(); setOptions('vault'); }} onInvested={() => { reset(); setTab('invested'); }} />
      {context?.fund.phase === 'FUNDRAISING' ? <AuthButton accessibilityRole="button" onPress={() => router.push({ pathname: '/vaults/[id]', params: { id: context.fund.id } })} style={s.secondary}><Text style={s.secondaryText}>Trading opens after successful fundraising · View funding</Text></AuthButton> : null}
      {data.error || data.privateError ? <Text style={s.error} accessibilityRole="alert">{data.error ?? data.privateError}</Text> : null}
      <AuthButton accessibilityRole="button" onPress={data.refresh} style={s.secondary}><Text style={s.secondaryText}>Refresh markets</Text></AuthButton>
      {data.subject ? <AuthButton accessibilityRole="button" onPress={()=>router.push('/vaults/create')} style={s.primary}><Text style={s.primaryText}>Create a vault round</Text></AuthButton> : null}
      {privacyError ? <Text style={s.error} accessibilityRole="alert">{privacyError}</Text> : null}
      {data.feed ? <Text style={s.sample}>{data.feed.status === 'STALE' ? 'Cached · ' : ''}Updated {Math.max(0, Math.floor((data.now - Date.parse(data.feed.fetchedAt)) / 1000))}s ago{data.feed.rankingStatus === 'UNAVAILABLE' ? ' · History is still building; markets are unranked' : data.feed.rankingStatus === 'PARTIAL' ? ' · Some markets have incomplete history' : ''}{data.feed.scope === 'PROVIDER_CANDIDATES' ? ` · ${data.feed.candidateCount} provider candidates` : ''}</Text> : null}
      {discoveryEnabled ? <AuthButton accessibilityRole="button" accessibilityLabel="Choose market feed" onPress={() => setOptions('feed')} style={s.toolbarButton}><Text style={s.label}>{savedOnly ? 'Saved' : tab === 'invested' ? 'Invested' : feed === 'toptraded' ? 'Top traded' : feed === 'trending' ? 'Trending' : 'Supported'}</Text><ChevronDown size={14} color={M.ink} /></AuthButton> : <View style={s.tabs}>{([{ id: 'top', label: 'Supported' }, { id: 'invested', label: 'Invested markets' }] as const).map(item => <AuthButton key={item.id} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: item.id === tab }} testID={`market-tab-${item.id}`} onPress={() => setTab(item.id)} style={[s.tab, tab === item.id && s.selectedTab]}><Text style={[s.tabText, tab === item.id && s.selectedTabText]}>{item.label}</Text></AuthButton>)}</View>}
      <View style={s.toolbar}><AuthButton accessibilityRole="button" accessibilityLabel={`Change market timeframe, currently ${period}`} testID="market-period-select" onPress={() => { Keyboard.dismiss(); setOptions('period'); }} style={[s.toolbarButton, width < 360 && s.compactToolbarButton]}><Text style={[s.label, s.toolbarLabel, width < 360 && s.compactToolbarLabel]}>{tab === 'top' ? 'Markets' : 'Performance'} · {period}</Text><ChevronDown size={14} color={M.ink} /></AuthButton><View style={s.toolbarActions}><AuthButton accessibilityRole="button" accessibilityLabel={savedOnly ? 'Show all markets' : 'Show saved markets'} accessibilityState={{ selected: savedOnly }} testID="market-saved-only" onPress={() => setSavedOnly(value => !value)} style={[s.iconButton, s.toolbarSaved, savedOnly && { backgroundColor: D.accentTint }]}><Bookmark size={18} color={M.ink} fill={savedOnly ? M.ink : 'transparent'} /></AuthButton><AuthButton accessibilityRole="button" accessibilityLabel={`Market filters${filterCount ? `, ${filterCount} active` : ''}`} testID="market-filters-open" onPress={() => { Keyboard.dismiss(); setOptions('filters'); }} style={[s.toolbarButton, width < 360 && s.compactToolbarButton, filterCount > 0 && { backgroundColor: D.accentTint }]}><SlidersHorizontal size={16} color={M.ink} /><Text style={[s.label, s.toolbarLabel, width < 360 && s.compactToolbarLabel]}>Filter{filterCount ? ` · ${filterCount}` : ''}</Text></AuthButton></View></View>
    </>} ListEmptyComponent={data.loading ? <View style={s.empty} testID="market-batch-loading" accessibilityRole="progressbar" accessibilityLabel="Loading ten markets"><ActivityIndicator color={D.accent} /><Text style={s.emptyTitle}>Loading markets…</Text><Text style={s.emptyText}>Fetching token names and prices</Text></View> : <View style={s.empty} testID="market-empty"><Text style={s.emptyTitle}>{data.error ? 'Could not load markets' : savedOnly ? 'No saved markets here' : tab === 'invested' && !query ? 'No matching positions' : 'No markets found'}</Text><Text style={s.emptyText}>Try a token name, symbol or mint address,{ '\n' }or clear your filters to see more markets.</Text><AuthButton accessibilityRole="button" accessibilityLabel="Clear search and market filters" testID="market-empty-reset" onPress={reset} style={s.secondary}><Text style={s.secondaryText}>Clear search & filters</Text></AuthButton></View>} ListFooterComponent={<>{data.error && markets.length ? <AuthButton accessibilityRole="button" onPress={() => { if (data.feed?.nextCursor) void data.loadMore(); else data.refresh(); }} style={s.secondary}><Text style={s.secondaryText}>Retry loading markets</Text></AuthButton> : null}{data.loadingMore ? <View style={s.empty} testID="market-next-batch-loading" accessibilityRole="progressbar" accessibilityLabel="Loading next ten markets"><ActivityIndicator color={D.accent} /><Text style={s.label}>Loading next 10 markets…</Text></View> : null}<Text style={s.sample}>USD prices · paper trading</Text></>} />
    <MarketOptionsSheet kind={options} feed={savedOnly ? 'saved' : tab === 'invested' ? 'invested' : feed} onFeed={chooseFeed} discoveryEnabled={discoveryEnabled} onClose={() => setOptions(null)} context={context} funds={data.funds} onVault={data.selectFund} hidden={hidden} period={period} onPeriod={value => { setPeriod(value); if (discoveryEnabled && (value === '7D' || value === '30D')) { setFeed('supported'); setFilters(prior => ({ ...prior, sort: prior.sort === 'Volume' ? 'Gainers' : prior.sort })); } }} filters={filters} onFilters={value => { setFilters(value); if (discoveryEnabled && value.sort !== 'Volume') setFeed('supported'); if (discoveryEnabled && value.sort === 'Volume' && (period === '7D' || period === '30D')) setPeriod('24H'); }} onExplore={() => { reset(); setTab('top'); }} />
    {liveTradeToken ? <MarketTradeSheet key={`${data.subject}-${context?.fund.id}-${liveTradeToken.mint}-${tradeSession}`} visible={tradeOpen} token={liveTradeToken} context={context} hidden={hidden} saved={data.saved.includes(liveTradeToken.mint)} onSaved={() => { void data.toggleSaved(liveTradeToken.mint); }} onClose={() => setTradeOpen(false)} onChooseVault={() => { setTradeOpen(false); setOptions("vault"); }} api={data.api} subject={data.subject} onTerminal={data.refresh} /> : null}
  </View>;
}
