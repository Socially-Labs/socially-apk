import { useFocusEffect } from 'expo-router';
import { Bookmark, ChevronDown, SlidersHorizontal } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Keyboard, Platform, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccountSettings } from '@/components/settings/settings-provider';
import { AuthButton } from '@/components/shared/motion';
import { sampleCaptainVaults } from '@/constants/captain-dashboard';
import { defaultMarketFilters, selectMarkets, type MarketFilters, type MarketPeriod, type MarketTab, type MarketToken, type TokenSymbol } from '@/constants/captain-markets';
import { DiscoverPalette as D } from '@/constants/theme';
import { MarketHero, MarketRow, MarketVaultCard } from './market-components';
import { MarketOptionsSheet, type MarketOptionSheet } from './market-options-sheet';
import { MarketTradeSheet } from './market-trade-sheet';
import { marketStyles as s } from './market-styles';

export default function CaptainMarketsScreen() {
  const insets = useSafeAreaInsets(), { width } = useWindowDimensions();
  const { settings, ready, saving, updateSettings } = useAccountSettings();
  const hidden = !ready || settings.hideBalances;
  const [vaultId, setVaultId] = useState('horizon');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<MarketTab>('top');
  const [period, setPeriod] = useState<MarketPeriod>('24H');
  const [filters, setFilters] = useState<MarketFilters>(defaultMarketFilters);
  const [saved, setSaved] = useState<TokenSymbol[]>(['SOL', 'JUP']);
  const [savedOnly, setSavedOnly] = useState(false);
  const [options, setOptions] = useState<MarketOptionSheet>(null);
  const [tradeToken, setTradeToken] = useState<MarketToken | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeSession, setTradeSession] = useState(0);
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const vault = sampleCaptainVaults.find(item => item.id === vaultId) ?? sampleCaptainVaults[0];
  const markets = useMemo(() => selectMarkets({ vault, tab, query, period, filters, savedOnly, saved }), [vault, tab, query, period, filters, savedOnly, saved]);
  const filterCount = Number(filters.category !== 'All') + Number(filters.liquidity !== 0) + Number(filters.sort !== 'Volume');
  useFocusEffect(useCallback(() => () => { setOptions(null); setTradeOpen(false); Keyboard.dismiss(); }, []));
  const selectToken = useCallback((token: MarketToken) => {
    Keyboard.dismiss();
    if (token.symbol === 'USDC') { setOptions('cash'); return; }
    setTradeToken(token); setTradeSession(value => value + 1); setTradeOpen(true);
  }, []);
  const renderItem = useCallback(({ item }: { item: MarketToken }) => <MarketRow token={item} vault={vault} invested={tab === 'invested'} hidden={hidden} period={period} compact={width < 360} onSelect={selectToken} />, [vault, tab, hidden, period, width, selectToken]);
  const reset = () => { setQuery(''); setFilters(defaultMarketFilters); setSavedOnly(false); };
  const togglePrivacy = async () => {
    setPrivacyError(null);
    try { await updateSettings({ hideBalances: !settings.hideBalances }); }
    catch { setPrivacyError('Could not update balance visibility. Try again.'); }
  };
  return <View style={s.screen} testID="captain-markets-screen">
    <FlatList data={markets} keyExtractor={item => item.symbol} renderItem={renderItem} style={{ flex: 1 }} contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom + 142, 154) }]} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} testID="captain-markets-list" ListHeaderComponent={<>
      <MarketHero top={Math.max(insets.top, 16) + 12} query={query} onQuery={setQuery} />
      <MarketVaultCard vault={vault} hidden={hidden} canToggle={ready && !saving} onToggle={togglePrivacy} onSelect={() => { Keyboard.dismiss(); setOptions('vault'); }} onInvested={() => { reset(); setTab('invested'); }} />
      {privacyError ? <Text style={s.error} accessibilityRole="alert">{privacyError}</Text> : null}
      <View style={s.tabs}>{([{ id: 'top', label: 'Top traded' }, { id: 'invested', label: 'Invested markets' }] as const).map(item => <AuthButton key={item.id} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: item.id === tab }} testID={`market-tab-${item.id}`} onPress={() => setTab(item.id)} style={[s.tab, tab === item.id && s.selectedTab]}><Text style={[s.tabText, tab === item.id && s.selectedTabText]}>{item.label}</Text></AuthButton>)}</View>
      <View style={s.toolbar}><AuthButton accessibilityRole="button" accessibilityLabel={`Change market timeframe, currently ${period}`} testID="market-period-select" onPress={() => { Keyboard.dismiss(); setOptions('period'); }} style={s.toolbarButton}><Text style={s.label}>{tab === 'top' ? 'Top' : 'Performance'} · {period}</Text><ChevronDown size={14} color={D.secondary} /></AuthButton><View style={{ flexDirection: 'row', gap: 7 }}><AuthButton accessibilityRole="button" accessibilityLabel={savedOnly ? 'Show all markets' : 'Show saved markets'} accessibilityState={{ selected: savedOnly }} testID="market-saved-only" onPress={() => setSavedOnly(value => !value)} style={[s.iconButton, savedOnly && { backgroundColor: D.accentTint }]}><Bookmark size={18} color={D.accent} fill={savedOnly ? D.accent : 'transparent'} /></AuthButton><AuthButton accessibilityRole="button" accessibilityLabel={`Market filters${filterCount ? `, ${filterCount} active` : ''}`} testID="market-filters-open" onPress={() => { Keyboard.dismiss(); setOptions('filters'); }} style={[s.toolbarButton, { paddingHorizontal: 9 }, filterCount > 0 && { backgroundColor: D.accentTint }]}><SlidersHorizontal size={16} color={D.accent} /><Text style={[s.label, { color: D.accent }]}>Filter{filterCount ? ` · ${filterCount}` : ''}</Text></AuthButton></View></View>
    </>} ListEmptyComponent={<View style={s.empty} testID="market-empty"><Text style={s.emptyTitle}>{savedOnly ? 'No saved markets here' : tab === 'invested' && !query ? 'No matching positions' : 'No markets found'}</Text><Text style={s.emptyText}>Try a token name, symbol or mint address,{ '\n' }or clear your filters to see more markets.</Text><AuthButton accessibilityRole="button" accessibilityLabel="Clear search and market filters" testID="market-empty-reset" onPress={reset} style={s.secondary}><Text style={s.secondaryText}>Clear search & filters</Text></AuthButton></View>} ListFooterComponent={<Text style={s.sample}>Sample market data · Jupiter trading preview</Text>} />
    <MarketOptionsSheet kind={options} onClose={() => setOptions(null)} vault={vault} onVault={setVaultId} hidden={hidden} period={period} onPeriod={setPeriod} filters={filters} onFilters={setFilters} onExplore={() => { reset(); setTab('top'); }} />
    {tradeToken ? <MarketTradeSheet key={`${vault.id}-${tradeToken.symbol}-${tradeSession}`} visible={tradeOpen} token={tradeToken} vault={vault} hidden={hidden} initialPeriod={period} saved={saved.includes(tradeToken.symbol)} onSaved={() => setSaved(items => items.includes(tradeToken.symbol) ? items.filter(symbol => symbol !== tradeToken.symbol) : [...items, tradeToken.symbol])} onClose={() => setTradeOpen(false)} /> : null}
  </View>;
}
