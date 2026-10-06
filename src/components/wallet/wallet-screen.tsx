import { useAccountSettings } from '@/components/settings/settings-provider';
import { errorFeedback, selectionFeedback } from '@/components/shared/feedback';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont, InterFont } from '@/constants/fonts';
import { Dashboard, WalletPalette as W } from '@/constants/theme';
import { type WalletAsset } from '@/constants/wallet';
import { useWalletFunding } from '@/hooks/use-wallet-funding';
import { formatUsdc, walletTotals } from '@/api/wallet';
import { paymentStatus } from './qr-deposit-panel';
import { TokenIcon } from '@/components/shared/markets/market-graphics';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronDown, ChevronRight, History, Plus, Settings, Wallet } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WalletActions } from './wallet-actions';

import { WalletBalanceCard } from './wallet-balance-card';
import { sharedStyles } from './wallet-section-styles';
import { WalletSheet } from './wallet-sheet';
import { tabs, type NetworkFilter, type WalletSheet as WalletSheetKind, type WalletTab } from './wallet-types';

export default function WalletScreen() {
  const router = useRouter();
  const funding = useWalletFunding();
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(null);
  const totals = funding.summary ? walletTotals(funding.summary) : null;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const [sheet, setSheet] = useState<WalletSheetKind | null>(null);
  const [tab, setTab] = useState<WalletTab>('Assets');
  const [network, setNetwork] = useState<NetworkFilter>('All Networks');
  const [hiddenTokens, setHiddenTokens] = useState<WalletAsset['symbol'][]>([]);
  const { settings: accountSettings, ready, saving, updateSettings } = useAccountSettings();
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [locallyHidden, setLocallyHidden] = useState(false);
  const visibilityWriting = useRef(false);
  const balanceVisible = ready && !locallyHidden && !accountSettings.hideBalances;
  async function toggleBalances() {
    if (!ready || saving || visibilityWriting.current) return;
    visibilityWriting.current = true;
    setVisibilityError(null);
    const hideBalances = balanceVisible;
    // Keep a failed hide masked until the user explicitly reveals balances.
    if (hideBalances) setLocallyHidden(true);
    selectionFeedback();
    try { await updateSettings({ hideBalances }); setLocallyHidden(false); }
    catch { errorFeedback(); setVisibilityError(hideBalances ? 'Balance hidden here. Your preference couldn’t be saved.' : 'Balance couldn’t be revealed. Please try again.'); }
    finally { visibilityWriting.current = false; }
  }
  function showSheet(next: WalletSheetKind) { selectionFeedback(); setSheet(next); }
  function changeTab(next: WalletTab) { if (next !== tab) selectionFeedback(); setTab(next); }
  function setTokenVisibility(symbol: WalletAsset['symbol'], visible: boolean) {
    selectionFeedback();
    setHiddenTokens(current => visible ? current.filter(item => item !== symbol) : [...new Set([...current, symbol])]);
  }
  const liveAssets: WalletAsset[] = funding.summary ? [{ symbol: 'USDC', name: 'Test USDC', network: 'Solana', value: Number(funding.summary.available.amount), quantity: `${formatUsdc(funding.summary.available.amount)} USDC`, positive: true, chart: '' }] : [];
  const assets = liveAssets.filter(asset => !hiddenTokens.includes(asset.symbol) && (network === 'All Networks' || asset.network === network));
  const navigationClearance = Math.max(insets.bottom + 12, 42) + 60 + 20;
  return <View style={styles.screen} testID="wallet-dashboard"><StatusBar style="dark" />
    <ScrollView testID="wallet-scroll" style={styles.scroll} removeClippedSubviews={false} showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 8, 48), paddingBottom: navigationClearance }]}>
      <View style={styles.header} testID="wallet-header">
        <View style={styles.headerIcon}><Wallet size={23} color={W.selectedInk} strokeWidth={1.8} /></View>
        <View style={styles.headingCopy}>
          <Text style={styles.title} accessibilityRole="header">Wallet</Text>
          <Text style={styles.subtitle}>Your USDC trading balance · Devnet</Text>
        </View>
        <AuthButton accessibilityRole="button" accessibilityLabel="Open settings" testID="wallet-settings"
          onPress={() => router.navigate('/settings')} style={styles.settingsButton} hitSlop={4}>
          <Settings size={22} color={W.selectedInk} strokeWidth={1.9} />
        </AuthButton>
      </View>
      <WalletBalanceCard visible={balanceVisible} compact={compact} canToggle={ready && !saving} error={visibilityError ?? funding.error ?? (funding.summary && !funding.summary.enabled ? 'Devnet funding is not configured.' : null)} total={totals?.total ?? null} available={totals?.available ?? null} vault={totals?.vault ?? null}
        onToggle={() => { void toggleBalances(); }} onMore={() => showSheet('options')} onVaults={() => changeTab('Vaults')} />
      <WalletActions onAction={showSheet} compact={compact} />
      <View style={styles.sectionHeading}>
        <View style={[styles.tabs, compact && styles.compactTabs]} testID="wallet-tabs">
          {tabs.map((item, index) => <AuthButton key={item} accessibilityRole="button" accessibilityState={{ selected: tab === item }} onPress={() => changeTab(item)} testID={`wallet-tab-${item.toLowerCase()}`} style={[styles.tab, compact && styles.compactTab, tab === item && styles.activeTab]}><Text style={[styles.tabText, compact && styles.compactTabText, tab === item && styles.activeTabText]}>{item}</Text>{index === 1 && tab === 'Assets' ? <View style={styles.tabDivider} pointerEvents="none" /> : null}</AuthButton>)}
        </View>
        {tab === 'Assets' ? <AuthButton accessibilityRole="button" accessibilityLabel={`Filter assets. ${network} selected`} testID="wallet-networks" onPress={() => showSheet('networks')} style={[styles.filter, compact && styles.compactFilter]}>
          <Text style={[styles.filterLabel, compact && styles.compactFilterLabel]} numberOfLines={1}>{network}</Text><ChevronDown size={13} color={W.ink} />
        </AuthButton> : null}
      </View>
      <View style={styles.tabContent} testID={`wallet-content-${tab.toLowerCase()}`}>
        {tab === 'Assets' ? <>
          <View style={styles.assetList}>
            {assets.map(asset => <AuthButton key={asset.symbol} accessibilityRole="button" onPress={() => showSheet(asset)} style={styles.liveAsset} testID="wallet-asset-usdc"><TokenIcon symbol="USDC" size={36} /><View style={styles.headingCopy}><Text style={styles.manageTitle}>USDC</Text><Text style={styles.caption}>Solana devnet · Available to trade</Text></View><Text style={styles.manageTitle}>{balanceVisible ? formatUsdc(funding.summary?.available.amount) : '••••'}</Text><ChevronRight size={16} color={W.secondary} /></AuthButton>)}
            {assets.length === 0 ? <View style={styles.empty}><Wallet size={28} color={W.secondary} /><Text style={styles.emptyTitle}>{funding.summary ? 'No tokens shown' : funding.error ? 'Wallet unavailable' : 'Loading wallet…'}</Text><Text style={styles.detailCopy}>{funding.summary ? 'Show USDC in Manage tokens.' : funding.error ?? 'Fetching your trading balance.'}</Text></View> : null}
          </View>
          <AuthButton accessibilityRole="button" accessibilityLabel="Manage tokens" testID="wallet-manage-tokens" onPress={() => showSheet('manage')} style={styles.manage}>
            <View style={styles.manageIcon}><Plus size={22} strokeWidth={1.5} color={W.ink} /></View><View style={styles.manageCopy}><Text style={styles.manageTitle}>Manage tokens</Text><Text style={styles.caption}>Show, hide or add custom tokens</Text></View><ChevronRight size={18} color={W.ink} />
          </AuthButton>
        </> : tab === 'Vaults' && funding.summary?.positions.length ? <View style={styles.assetList}>{funding.summary.positions.map(position => <View key={position.fundId} style={styles.liveAsset}><Wallet size={24} color={W.selectedInk} /><View style={styles.headingCopy}><Text style={styles.manageTitle}>{position.name}</Text><Text style={styles.caption}>Captain allocation</Text></View><Text style={styles.manageTitle}>{!balanceVisible ? '••••' : position.valuationStatus === 'CURRENT' ? `${formatUsdc(position.estimatedValueUsdc)} USDC` : 'Value unavailable'}</Text></View>)}</View> : tab === 'Vaults' ? <View style={styles.empty}>
          <Wallet size={28} color={W.selectedInk} /><Text style={styles.emptyTitle}>Your Captain vaults</Text><Text style={styles.detailCopy}>You haven’t allocated to a Captain’s fund yet. Explore their strategy and track record before joining the Crew.</Text>
          <AuthButton accessibilityRole="button" testID="wallet-discover-captains" onPress={() => router.navigate('/explore')} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Discover Captains</Text><ChevronRight size={17} color={W.heroInk} /></AuthButton>
        </View> : funding.summary?.deposits.length ? <View style={styles.assetList}>{funding.summary.deposits.map(deposit => <AuthButton key={deposit.id} accessibilityRole="button" onPress={() => { setSelectedDepositId(deposit.id); showSheet('deposit'); }} style={styles.liveAsset}><History size={22} color={W.selectedInk} /><View style={styles.headingCopy}><Text style={styles.manageTitle}>{paymentStatus[deposit.status]}</Text><Text style={styles.caption}>{new Date(deposit.createdAt).toLocaleDateString()}</Text></View><Text style={styles.manageTitle}>{balanceVisible ? `${formatUsdc(deposit.status === 'CONFIRMED' ? deposit.creditedAmount : deposit.amount)} USDC` : '••••'}</Text></AuthButton>)}</View> : <View style={styles.empty}><History size={28} color={W.selectedInk} /><Text style={styles.emptyTitle}>{funding.summary ? 'No deposits yet' : 'Activity unavailable'}</Text><Text style={styles.detailCopy}>Your deposit requests and verified payments will appear here.</Text></View>}
      </View>
    </ScrollView>
    <WalletSheet funding={funding} assets={liveAssets} selectedDepositId={selectedDepositId} onSelectDeposit={setSelectedDepositId} sheet={sheet} network={network} hiddenTokens={hiddenTokens} balanceVisible={balanceVisible}
      onClose={() => setSheet(null)} onShowSheet={showSheet} onTokenVisibility={setTokenVisibility}
      onNetwork={filter => { if (filter !== network) selectionFeedback(); setNetwork(filter); setSheet(null); }}
      onSettings={() => { setSheet(null); router.navigate('/settings'); }}
      onActivity={() => { setSheet(null); changeTab('Activity'); }} />
  </View>;
}

const styles = StyleSheet.create({
  ...sharedStyles,
  screen: { flex: 1, backgroundColor: Dashboard.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, width: '100%', maxWidth: Dashboard.maxWidth, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 11, marginBottom: 18 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: W.muted, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1, gap: 3 },
  title: { fontFamily: InterFont.semiBold, fontSize: W.headerTitleSize, lineHeight: 24, color: W.ink },
  subtitle: { fontFamily: InterFont.regular, fontSize: W.captionSize, lineHeight: 17, color: W.secondary },
  settingsButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: W.surface, alignItems: 'center', justifyContent: 'center', boxShadow: W.shadow },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  tabs: { flexDirection: 'row', backgroundColor: W.actionIcon, borderRadius: 16, borderCurve: 'continuous', borderWidth: 1, borderColor: W.border, padding: 2 },
  tab: { paddingHorizontal: 13, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  compactTabs: { flex: 1 },
  compactTab: { flex: 1, paddingHorizontal: 5 },
  compactFilter: { width: 100, paddingHorizontal: 7 },
  compactFilterLabel: { fontSize: 11 },
  activeTab: { backgroundColor: W.selected },
  tabText: { fontFamily: BrandFont.editorial, fontSize: 15, color: W.ink },
  compactTabText: { fontSize: 14 },
  activeTabText: { color: W.ink },
  tabDivider: { position: 'absolute', right: 0, width: 1, height: 14, backgroundColor: W.balanceLine },
  filter: { minHeight: 44, paddingHorizontal: 10, borderRadius: 22, backgroundColor: W.muted, flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '46%' },
  filterLabel: { flexShrink: 1, fontFamily: BrandFont.editorial, fontSize: 13, color: W.ink },
  tabContent: { gap: 12 },
  assetList: { gap: 6 },
  liveAsset: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 64, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: W.border, backgroundColor: W.assetSurface },
  manage: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: W.border, borderRadius: 18, borderCurve: 'continuous', paddingHorizontal: 12, minHeight: 56 },
  manageIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: W.muted, alignItems: 'center', justifyContent: 'center' },
  manageTitle: { fontFamily: InterFont.semiBold, fontSize: 13, lineHeight: 18, color: W.ink },
  empty: { alignItems: 'center', padding: 24, gap: 13, borderRadius: 22, backgroundColor: W.assetSurface },
  emptyTitle: { fontFamily: BrandFont.editorial, fontSize: 23, color: W.ink, textAlign: 'center' },
  primaryButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 22, paddingHorizontal: 18, backgroundColor: W.hero[1], marginTop: 5 },
  primaryButtonText: { fontFamily: InterFont.medium, fontSize: 12, color: W.heroInk },
});
