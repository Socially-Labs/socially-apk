import { router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Bookmark, Box, ChevronDown, Compass, Flame, Info, Leaf, Search, SlidersHorizontal, TrendingUp, X } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Keyboard, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { selectionFeedback } from '@/components/shared/feedback';
import { AuthButton } from '@/components/shared/motion';
import { BalancedIcon, type AppIcon } from '@/components/shared/icons/product-icons';
import { InterFont } from '@/constants/fonts';
import { Dashboard, DiscoverPalette as D } from '@/constants/theme';
import { categories, emptyFilters, filterCount, selectCaptains, sorts,
  type Category, type DiscoverCaptain, type Filters, type Period, type Sort, type Strategy } from '@/constants/discover';
import { FilterSheet, OptionRow } from './discover-filters';
import { useDiscover } from './discover-provider';
import { CaptainCard, DiscoverSurface, PeriodControl, discoveryStyles as S } from './discover-ui';
import { CaptainCarousel } from './captain-carousel';

const strategyIcons: Record<Strategy, AppIcon> = { Momentum: TrendingUp, Balanced: BalancedIcon, 'Long term': Leaf, DeFi: Box, Memecoins: Flame };
const strategyOrder: readonly Strategy[] = ['Momentum', 'DeFi', 'Long term', 'Memecoins', 'Balanced'];

const categoryCopy: Record<Category, string> = {
  'All Captains': 'Different approaches. A shared horizon.', 'Top performers': 'Positive returns, ranked for this period.', Consistent: 'Positive months, with smaller swings.',
  Rising: 'Newer Captains. Shorter track records.', 'Most followed': 'Captains with the largest Crew.',
  Active: 'Frequent trades. More market exposure.', Proven: 'At least a year of meaningful history.', Saved: 'Your shortlist, ready for a closer look.',
};
const sortCopy: Record<Sort, string> = {
  Featured: 'Editorial sample order · not a performance score', 'Highest return': 'Portfolio return over the selected period',
  'Lowest drawdown': 'Smallest peak-to-trough loss in the selected period', 'Most Crew': 'Number of Crew members',
  'Highest AUM': 'Total assets under management', 'Highest volume': 'Trading volume over the last 30 days',
};
function openCaptain(captain: DiscoverCaptain, period: Period) {
  Keyboard.dismiss(); selectionFeedback();
  router.push({ pathname: '/captain/[id]', params: { id: captain.id, period } });
}
export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [viewportHeight, setViewportHeight] = useState(0);
  const [introHeight, setIntroHeight] = useState(135);
  const [bodyHeight, setBodyHeight] = useState(0);
  const topPadding = Math.max(insets.top + 12, 50);
  // Reserve the floating navigator's 60px height and its safe-area placement.
  const navigationClearance = Math.max(insets.bottom + 12, 42) + 60 + 14;
  const pathname = usePathname();
  const input = useRef<TextInput>(null);
  const { saved, toggleSaved } = useDiscover();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [period, setPeriod] = useState<Period>('90D');
  const [category, setCategory] = useState<Category>('All Captains');
  const [sort, setSort] = useState<Sort>('Featured');
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters });
  const [sheet, setSheet] = useState<'filters' | 'sort' | 'about' | null>(null);
  const matches = useMemo(() => selectCaptains({ query, category, period, sort, filters, saved }), [query, category, period, sort, filters, saved]);
  const applied = filterCount(filters);
  const browsing = category === 'All Captains' && !query.trim() && applied === 0;
  // FlatList headers have an unconstrained height on native. Use measured
  // sections rather than flex-grow, which can leave the spare height unused.
  const heroSpace = browsing && bodyHeight > 0
    ? Math.max(0, (viewportHeight || height) - topPadding - navigationClearance - introHeight - bodyHeight)
    : 0;
  const renderItem = useCallback(({ item }: { item: DiscoverCaptain }) => <CaptainCard captain={item} period={period}
    saved={saved.includes(item.id)} onSave={() => toggleSaved(item.id)} onOpen={() => openCaptain(item, period)} style={styles.result} />,
  [period, saved, toggleSaved]);
  function changeCategory(next: Category) { selectionFeedback(); setCategory(next); }
  function reset() { setQuery(''); setFilters({ ...emptyFilters }); setCategory('All Captains'); setSort('Featured'); }
  function showSheet(next: typeof sheet) { Keyboard.dismiss(); setSheet(next); }

  const header = <View testID="discover-dashboard">
    <View testID="discover-intro" onLayout={event => {
      if (event.nativeEvent.layout.height > 0) setIntroHeight(event.nativeEvent.layout.height);
    }}>
    <View style={[S.between, styles.header]}>
      <Text style={styles.brand}>DISCOVER</Text>
      <AuthButton accessibilityRole="button" accessibilityLabel={`View saved Captains, ${saved.length} saved`} accessibilityState={{ selected: category === 'Saved' }}
        onPress={() => changeCategory(category === 'Saved' ? 'All Captains' : 'Saved')} testID="discover-saved" style={styles.savedButton}>
        <Bookmark size={18} color={D.ink} fill={category === 'Saved' ? D.ink : 'none'} />
      </AuthButton>
    </View>
    <Text accessibilityRole="header" style={styles.headline}>Find your{'\n'}Captain</Text>
    <Text style={styles.subtitle}>Pick a Captain. Join the Crew.{'\n'}Explore the fund behind each strategy.</Text>
    </View>
    <View testID="discover-body" style={{ marginTop: heroSpace }} onLayout={event => {
      if (browsing && event.nativeEvent.layout.height > 0) setBodyHeight(event.nativeEvent.layout.height);
    }}>
    <View style={[styles.search, focused && styles.searchFocused]}>
      <Search size={19} color={D.accent} />
      <TextInput ref={input} value={query} onChangeText={setQuery} style={styles.input} testID="captain-search"
        accessibilityLabel="Search Captains or strategies" placeholder="Search Captains, strategies, or assets…" placeholderTextColor={D.muted}
        autoCapitalize="none" autoCorrect={false} autoComplete="off" returnKeyType="search" submitBehavior="blurAndSubmit"
        onSubmitEditing={() => Keyboard.dismiss()} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        selectionColor={D.accent} underlineColorAndroid="transparent" />
      {query ? <AuthButton onPress={() => { setQuery(''); input.current?.focus(); }} accessibilityRole="button" accessibilityLabel="Clear search" style={styles.clear}><X size={18} color={D.secondary} /></AuthButton> : null}
    </View>
    <ScrollView horizontal style={styles.strategyScroll} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strategies}>
      <AuthButton accessibilityRole="button" accessibilityLabel="All strategies" accessibilityState={{ selected: filters.strategy === 'Any' }} testID="strategy-all"
        onPress={() => { selectionFeedback(); setFilters(current => ({ ...current, strategy: 'Any' })); }} style={[styles.strategyChip, filters.strategy === 'Any' && styles.activeCategory]}>
        <Compass size={16} color={filters.strategy === 'Any' ? D.heroInk : D.ink} /><Text style={[styles.categoryText, filters.strategy === 'Any' && styles.activeCategoryText]}>All</Text>
      </AuthButton>
      {strategyOrder.map(strategy => { const Icon = strategyIcons[strategy]; const active = filters.strategy === strategy;
        return <AuthButton key={strategy} accessibilityRole="button" accessibilityLabel={`${strategy} strategy`} accessibilityState={{ selected: active }}
          onPress={() => { selectionFeedback(); setFilters(current => ({ ...current, strategy })); }} testID={`strategy-${strategy.toLowerCase().replaceAll(' ', '-')}`}
          style={[styles.strategyChip, active && styles.activeCategory]}><Icon size={16} color={active ? D.heroInk : D.ink} /><Text style={[styles.categoryText, active && styles.activeCategoryText]}>{strategy}</Text></AuthButton>;
      })}
    </ScrollView>
    <View style={[S.between, styles.exploreHeader]}>
      <Text style={S.heading}>{category === 'Saved' ? 'Your shortlist' : query.trim() ? 'Search results' : category === 'All Captains' ? 'Top Captains' : category}</Text>
      <View style={styles.toolbar}>
        <AuthButton accessibilityRole="button" accessibilityLabel={`Performance period and ranking, ${period}, ${sort}`} onPress={() => showSheet('sort')} testID="discover-sort" style={styles.sort}>
          <Text numberOfLines={1} style={styles.toolText}>{period === 'ALL' ? 'All time' : period} return</Text><ChevronDown size={15} color={D.ink} />
        </AuthButton>
        <AuthButton accessibilityRole="button" accessibilityLabel={`Filters${applied ? `, ${applied} active` : ''}`} onPress={() => showSheet('filters')} testID="discover-filters" style={[styles.filter, applied > 0 && styles.activeFilter]}>
          <SlidersHorizontal size={16} color={D.ink} />{applied ? <Text style={styles.filterCount}>{applied}</Text> : null}
        </AuthButton>
      </View>
    </View>
    {applied > 0 ? <View style={styles.applied}><Text style={[S.label, { flex: 1 }]}>{[filters.risk !== 'Any' ? `${filters.risk} risk` : '', filters.strategy !== 'Any' ? filters.strategy : '', filters.aum !== 'Any' ? filters.aum : '', filters.proven ? '12+ months' : '', filters.positive ? 'Positive return' : ''].filter(Boolean).join(' · ')}</Text><AuthButton onPress={() => setFilters({ ...emptyFilters })} accessibilityRole="button" accessibilityLabel="Clear applied filters" style={styles.clear}><X size={16} color={D.secondary} /></AuthButton></View> : null}
    <View style={[S.between, styles.resultHeader]}><Text style={styles.resultCount} accessibilityLiveRegion="polite" testID="discover-result-count">{matches.length} Captain{matches.length === 1 ? '' : 's'}{query.trim() ? ` for “${query.trim()}”` : ''} · Sample data</Text>
      <AuthButton accessibilityRole="button" accessibilityLabel="About Captain discovery" onPress={() => showSheet('about')} style={styles.about}><Info size={13} color={D.secondary} /></AuthButton>
    </View>
    {period === '1Y' ? <Text style={styles.historyNote}>Captains with less than a year of history are excluded.</Text> : null}
    {browsing && matches.length > 0 ? <CaptainCarousel key={`${period}:${matches.map(captain => captain.id).join(',')}`}
      captains={matches} period={period} active={pathname === '/explore' && sheet === null && !focused}
      onOpen={captain => openCaptain(captain, period)} /> : null}
    </View>
  </View>;

  return <DiscoverSurface scenic sceneryHeight={(topPadding + introHeight + heroSpace + 145) * 0.95}
    onHeightChange={setViewportHeight}><StatusBar style="dark" />
    <FlatList data={browsing ? [] : matches} keyExtractor={item => item.id} renderItem={renderItem} ListHeaderComponent={header}
      contentContainerStyle={[styles.content, { paddingTop: topPadding, paddingBottom: navigationClearance }]}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false} initialNumToRender={4} windowSize={5}
      ListEmptyComponent={matches.length === 0 ? <View style={styles.empty} testID="discover-empty"><View style={styles.emptyIcon}>{category === 'Saved' ? <Bookmark size={24} color={D.accent} /> : <Compass size={26} color={D.accent} />}</View>
        <Text style={S.heading}>{category === 'Saved' && !saved.length ? 'Build your shortlist' : 'A different course?'}</Text>
        <Text style={[S.body, { textAlign: 'center' }]}>{category === 'Saved' && !saved.length ? 'Save a Captain to come back to their strategy, performance, and vault.' : 'No Captains match this combination. Try another strategy or broaden your filters.'}</Text>
        <AuthButton onPress={reset} accessibilityRole="button" testID="discover-reset" style={S.button}><Text style={S.buttonText}>Explore all Captains</Text></AuthButton>
      </View> : null}
    />
    <FilterSheet initial={filters} visible={sheet === 'filters'} onClose={() => setSheet(null)} onApply={next => { selectionFeedback(); setFilters(next); setSheet(null); }} count={draft => selectCaptains({ query, category, period, sort, filters: draft, saved }).length} />
    <DashboardSheet visible={sheet === 'sort'} title="Rank & explore" onClose={() => setSheet(null)}>
      <View style={{ gap: 16 }}><Text style={S.eyebrow}>PERFORMANCE WINDOW</Text>
        <PeriodControl value={period} onChange={next => { selectionFeedback(); setPeriod(next); setSheet(null); }} />
        <Text style={S.eyebrow}>BROWSE BY APPROACH</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {categories.map(item => <AuthButton key={item} accessibilityRole="button" accessibilityState={{ selected: category === item }}
            onPress={() => { changeCategory(item); setSheet(null); }} testID={`category-${item.toLowerCase().replaceAll(' ', '-')}`}
            style={[styles.category, category === item && styles.activeCategory]}><Text style={[styles.categoryText, category === item && styles.activeCategoryText]}>{item}</Text></AuthButton>)}
        </ScrollView><Text style={S.label}>{categoryCopy[category]}</Text>
        <Text style={S.eyebrow}>SORT CAPTAINS</Text>
        <View>{sorts.map(item => <OptionRow key={item} label={item} copy={sortCopy[item]} selected={sort === item} onPress={() => { selectionFeedback(); setSort(item); setSheet(null); }} />)}</View>
      </View>
    </DashboardSheet>
    <DashboardSheet visible={sheet === 'about'} title="Trading access. Separate custody." onClose={() => setSheet(null)}><View style={{ gap: 20 }}>
      <InfoBlock title="Choose the person behind the portfolio" copy="Crew members allocate to a shared fund and receive shares in its portfolio. A Captain is authorized to trade that fund. The intended protocol gives Captains no permission to withdraw Crew funds or send them to another wallet." />
      <InfoBlock title="Look beyond the return" copy="Consider drawdown, time in market, holdings, and trading activity together. A short history can make a strong return look more reliable than it is." />
      <InfoBlock title="Preview, with context" copy="These Captains, returns, holdings, and trades are illustrative. No live on-chain records or investment actions are connected. Featured is an editorial sample order; it is not a calculated trust score." />
      <InfoBlock title="Browse by approach" copy="Consistent: at least 75% positive months and no higher-risk classification. Rising: up to six months of positive history. Proven: at least 12 months, $100K AUM, and 70% positive months. Active: at least 180 trades in 30 days." />
    </View></DashboardSheet>
  </DiscoverSurface>;
}
function InfoBlock({ title, copy }: { title: string; copy: string }) { return <View style={{ gap: 8 }}><Text style={styles.infoTitle}>{title}</Text><Text style={S.body}>{copy}</Text></View>; }
const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, width: '100%', maxWidth: Dashboard.maxWidth, alignSelf: 'center' },
  header: { height: 22 }, brand: { fontFamily: InterFont.semiBold, fontSize: 10, letterSpacing: 2.6, color: D.accent },
  savedButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-end' },
  headline: { fontFamily: InterFont.bold, fontSize: 30, lineHeight: 32, letterSpacing: -1.2, color: D.ink, marginTop: 5 },
  subtitle: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 18, color: D.ink, marginTop: 8 },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: D.searchGlass, borderWidth: 1, borderColor: D.glassBorder, paddingLeft: 16, paddingRight: 4, borderRadius: 20, marginTop: 18, gap: 10, minHeight: 48 }, searchFocused: { borderColor: D.accent },
  input: { flex: 1, minWidth: 0, fontFamily: InterFont.regular, fontSize: 12, color: D.ink, paddingVertical: 13, outlineWidth: 0, outlineStyle: 'solid' }, clear: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  strategyScroll: { flexGrow: 0, flexShrink: 0 },
  strategies: { gap: 7, paddingTop: 12, paddingBottom: 4 }, strategyChip: { minHeight: 36, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 17, backgroundColor: D.glass, borderWidth: 1, borderColor: D.glassBorder },
  about: { width: 30, height: 30, alignItems: 'flex-end', justifyContent: 'center' },
  exploreHeader: { marginTop: 20, marginBottom: 2, flexWrap: 'wrap' },
  categories: { gap: 8, paddingBottom: 4 }, category: { minHeight: 42, justifyContent: 'center', borderRadius: 13, paddingHorizontal: 16, backgroundColor: D.surface, borderWidth: 1, borderColor: D.line }, activeCategory: { backgroundColor: D.ink, borderColor: D.ink },
  categoryText: { fontFamily: InterFont.medium, fontSize: 11, color: D.ink }, activeCategoryText: { color: D.heroInk },
  toolbar: { flexDirection: 'row', gap: 6, alignItems: 'center' }, sort: { minHeight: 40, borderRadius: 20, borderWidth: 1, borderColor: D.glassBorder, backgroundColor: D.glass, flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 12 },
  filter: { width: 36, minHeight: 40, borderRadius: 18, backgroundColor: D.glass, flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'center' }, activeFilter: { backgroundColor: D.accentTint }, filterCount: { fontFamily: InterFont.medium, fontSize: 9, color: D.accent }, toolText: { fontFamily: InterFont.medium, fontSize: 11, color: D.ink },
  applied: { flexDirection: 'row', alignItems: 'center', paddingLeft: 12, marginTop: 8, borderRadius: 12, backgroundColor: D.accentTint }, resultHeader: { marginBottom: 9 }, resultCount: { fontFamily: InterFont.regular, fontSize: 10, color: D.secondary, flexShrink: 1 }, historyNote: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: D.secondary, marginBottom: 12 },
  result: { marginBottom: 10 }, empty: { gap: 14, padding: 24, marginVertical: 8, borderRadius: 24, backgroundColor: D.surface, alignItems: 'center' }, emptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: D.accentTint, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontFamily: InterFont.semiBold, fontSize: 16, lineHeight: 22, color: D.ink },
});
