import { useRouter } from 'expo-router';
import { Check, ChevronDown, ChevronRight, Eye, EyeOff, History, LayoutGrid, Settings, Wallet } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, LinearTransition, useReducedMotion } from 'react-native-reanimated';

import { errorFeedback, selectionFeedback } from '@/components/shared/feedback';

import { AuthButton } from '@/components/shared/motion';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { DashboardShell } from '@/components/shared/dashboard/dashboard-shell';
import { MarketSparkline, TokenIcon } from '@/components/shared/markets/market-graphics';
import { WalletActions } from '@/components/wallet/wallet-actions';
import { InterFont } from '@/constants/fonts';
import { Dashboard, WalletPalette as W } from '@/constants/theme';
import { formatWalletValue, walletAssets, walletBalance, type WalletAsset } from '@/constants/wallet';
import { useAccountSettings } from '@/components/settings/settings-provider';

type WalletSheet = 'deposit-contact' | 'withdraw-contact' | 'scan' | 'receive' | 'history' | 'networks' | WalletAsset;
const filters = ['All Networks', 'Solana', 'Solana (Wormhole)'] as const;
type NetworkFilter = typeof filters[number];

export default function WalletScreen() {
  const router = useRouter();
  const [sheet, setSheet] = useState<WalletSheet | null>(null);
  const [network, setNetwork] = useState<NetworkFilter>('All Networks');
  const { settings: accountSettings, ready, saving, updateSettings } = useAccountSettings();
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const [locallyHidden, setLocallyHidden] = useState(false);
  const visibilityWriting = useRef(false);
  const balanceVisible = ready && !locallyHidden && !accountSettings.hideBalances;
  async function toggleBalances() {
    if (!ready || saving || visibilityWriting.current) return;
    visibilityWriting.current = true;
    setVisibilityError(null);
    const hideBalances = balanceVisible;
    // Mask sensitive content immediately, including while persistence is pending.
    // A failed hide stays masked until the user explicitly chooses to reveal it.
    if (hideBalances) setLocallyHidden(true);
    selectionFeedback();
    try {
      await updateSettings({ hideBalances });
      setLocallyHidden(false);
    } catch {
      errorFeedback();
      setVisibilityError(hideBalances
        ? 'Balance hidden here. Your preference couldn’t be saved.'
        : 'Balance couldn’t be revealed. Please try again.');
    } finally { visibilityWriting.current = false; }
  }
  const { height, width } = useWindowDimensions();
  const compact = width < 360;
  const assets = network === 'All Networks' ? walletAssets : walletAssets.filter(asset => asset.network === network);
  const title = sheet === null ? '' : typeof sheet === 'object' ? sheet.name : {
    'deposit-contact': 'Deposit from a contact', 'withdraw-contact': 'Withdraw to a contact', scan: 'Scan QR', receive: 'Receive on Solana', history: 'Activity', networks: 'Networks',
  }[sheet];

  return (
    <DashboardShell testID="wallet-dashboard" variant="wallet">
      <View style={styles.header} testID="wallet-header">
        <View style={styles.headerIcon}><Wallet size={23} color={W.selectedInk} strokeWidth={1.8} /></View>
        <View style={styles.headingCopy}>
          <Text style={styles.title} accessibilityRole="header">Wallet</Text>
          <Text style={styles.subtitle}>Your on-chain balance</Text>
        </View>
        <AuthButton accessibilityRole="button" accessibilityLabel="Open settings" testID="wallet-settings"
          onPress={() => router.navigate('/settings')} style={styles.settings}>
          <Settings size={22} strokeWidth={1.9} color={W.selectedInk} />
        </AuthButton>
      </View>
      <View style={[styles.hero, { marginTop: Math.max(66, Math.min(124, height * 0.138)) }]}>
        <View style={styles.balanceHeading}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <AuthButton accessibilityRole="button" accessibilityLabel={balanceVisible ? 'Hide balance' : 'Show balance'}
            testID="wallet-balance-visibility" disabled={!ready || saving} onPress={() => { void toggleBalances(); }} style={styles.visibility}>
            {balanceVisible ? <Eye size={19} color={W.secondary} strokeWidth={2} /> : <EyeOff size={19} color={W.secondary} strokeWidth={2} />}
          </AuthButton>
        </View>
        <Animated.Text key={balanceVisible ? 'visible' : 'hidden'}
          entering={balanceVisible && !reduceMotion ? FadeIn.duration(160) : undefined}
          style={[styles.balance, compact && styles.compactBalance]} testID="wallet-balance"
          numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{balanceVisible ? walletBalance : '••••••'}</Animated.Text>
        {visibilityError ? <Text accessibilityRole="alert" style={styles.previewNote}>{visibilityError}</Text> : null}
      </View>
      <View style={styles.receiveCard} testID="wallet-funding-card">
        <AuthButton accessibilityRole="button" accessibilityLabel="Receive on Solana"
          testID="wallet-receive" onPress={() => setSheet('receive')} style={styles.receive}>
          <View style={styles.receiveIcon}><LayoutGrid size={23} color={W.ink} strokeWidth={2.2} /></View>
          <View style={styles.receiveCopy}>
            <Text style={styles.receiveTitle}>Receive on Solana</Text>
            <Text style={[styles.receiveSubtitle, compact && styles.compactReceiveSubtitle]}>Deposit from any wallet or exchange</Text>
          </View>
          <ChevronRight size={21} color={W.secondary} strokeWidth={1.8} />
        </AuthButton>
      </View>
      <WalletActions onContact={mode => setSheet(mode === 'deposit' ? 'deposit-contact' : 'withdraw-contact')}
        onScan={() => setSheet('scan')} onReceive={() => setSheet('receive')} />
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Assets</Text>
        <AuthButton accessibilityRole="button" accessibilityLabel={`Filter assets. ${network} selected`}
          testID="wallet-networks" onPress={() => setSheet('networks')} style={styles.filter} hitSlop={7}>
          <Text style={styles.filterLabel} numberOfLines={1}>{network}</Text>
          <ChevronDown size={15} color={W.secondary} strokeWidth={2} />
        </AuthButton>
      </View>
      <View style={styles.assetList}>
        {assets.map(asset => (
          <WalletAssetRow key={asset.symbol} asset={asset} visible={balanceVisible}
            compact={compact} reduceMotion={reduceMotion} onSelect={setSheet} />
        ))}
      </View>
      <DashboardSheet visible={sheet !== null} title={title} onClose={() => setSheet(null)}>
        {sheet === 'networks' ? filters.map(filter => (
          <AuthButton key={filter} accessibilityRole="button" accessibilityState={{ selected: filter === network }}
            onPress={() => { if (filter !== network) selectionFeedback(); setNetwork(filter); setSheet(null); }} style={styles.networkOption}>
            <Text style={styles.networkLabel}>{filter}</Text>
            {filter === network ? <Check size={20} color={W.selectedInk} /> : null}
          </AuthButton>
        )) : typeof sheet === 'object' && sheet !== null ? (
          <View style={styles.detail}>
            <TokenIcon symbol={sheet.symbol} size={56} glossy />
            <Text style={styles.detailValue}>{balanceVisible ? formatWalletValue(sheet.value) : '••••'}</Text>
            <Text style={styles.detailCopy}>{balanceVisible ? sheet.quantity : '••••'}</Text>
            <Text style={styles.detailCopy}>{sheet.network}</Text>
            <Text style={styles.previewNote}>Preview holding</Text>
            <AuthButton accessibilityRole="button" accessibilityLabel="View wallet activity" testID="wallet-history"
              onPress={() => setSheet('history')} style={styles.activity}>
              <History size={17} color={W.secondary} /><Text style={styles.activityLabel}>View activity</Text>
            </AuthButton>
          </View>
        ) : (
          <View style={styles.detail}>
            {sheet === 'history' ? <History size={32} color={W.secondary} /> : <Wallet size={32} color={W.secondary} />}
            <Text style={styles.detailHeading}>{sheet === 'history' ? 'No transactions yet' : 'Connect your wallet'}</Text>
            <Text style={styles.detailCopy}>{sheet === 'history'
              ? 'Your deposits and withdrawals will appear here once your wallet is connected.'
              : sheet === 'withdraw-contact' || sheet === 'scan'
                ? 'Connect your wallet to withdraw funds to a contact or scan a Solana payment QR code.'
                : 'Connect your wallet to get your Solana deposit address.'}</Text>
            <Text style={styles.previewNote}>You’re viewing a preview portfolio.</Text>
          </View>
        )}
      </DashboardSheet>
    </DashboardShell>
  );
}

// Pass privacy explicitly across the row boundary so each retained row updates
// its visual content and accessibility label together when visibility changes.
function WalletAssetRow({ asset, visible, compact, reduceMotion, onSelect }: {
  asset: WalletAsset; visible: boolean; compact: boolean; reduceMotion: boolean;
  onSelect: (asset: WalletAsset) => void;
}) {
  return (
          <Animated.View layout={reduceMotion ? undefined : LinearTransition.duration(180)}>
          <AuthButton accessibilityRole="button"
            accessibilityLabel={visible ? `${asset.name}, ${asset.quantity}, ${formatWalletValue(asset.value)}, ${asset.network}` : `${asset.name}, balances hidden, ${asset.network}`}
            testID={`wallet-asset-${asset.symbol.toLowerCase()}`} onPress={() => onSelect(asset)} style={styles.asset}>
            <TokenIcon symbol={asset.symbol} size={compact ? 36 : 42} glossy />
            <View style={styles.assetName}>
              <Text style={styles.assetSymbol}>{asset.symbol}</Text>
              <Text style={[styles.caption, compact && styles.compactCaption]} numberOfLines={1}>{asset.network}</Text>
            </View>
            <View style={styles.sparkline} testID={`wallet-chart-${asset.symbol.toLowerCase()}`}>
              <MarketSparkline market={asset} width={compact ? 32 : 42} height={26} />
            </View>
            <Animated.View key={visible ? 'visible' : 'hidden'} entering={visible && !reduceMotion ? FadeIn.duration(160) : undefined} style={styles.assetAmount}>
              <Text style={styles.assetValue}>{visible ? formatWalletValue(asset.value) : '••••'}</Text>
              <Text style={styles.caption}>{visible ? asset.quantity : '••••'}</Text>
            </Animated.View>
            <ChevronRight size={19} color={W.secondary} strokeWidth={1.8} />
          </AuthButton>
          </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 11 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: W.muted, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1, gap: 3 },
  settings: { width: 40, height: 40, borderRadius: 20, backgroundColor: W.surface, alignItems: 'center', justifyContent: 'center', boxShadow: W.shadow },
  hero: { paddingHorizontal: 8 },
  title: { fontFamily: InterFont.semiBold, fontSize: W.headerTitleSize, lineHeight: 24, color: W.ink },
  subtitle: { fontFamily: InterFont.regular, fontSize: W.captionSize, lineHeight: 17, color: W.secondary },
  balanceHeading: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 24 },
  balanceLabel: { fontFamily: InterFont.medium, fontSize: 13, color: W.secondary },
  visibility: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  balance: { fontFamily: InterFont.semiBold, fontSize: W.balanceSize, lineHeight: 52, letterSpacing: -1.7, color: W.ink, fontVariant: ['tabular-nums'] },
  compactBalance: { fontSize: 36 },
  receiveCard: { marginTop: 12, borderRadius: 32, backgroundColor: W.surface, boxShadow: W.shadow },
  receive: { minHeight: 58, paddingVertical: 7, paddingLeft: 11, paddingRight: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  receiveIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: W.muted, alignItems: 'center', justifyContent: 'center' },
  receiveCopy: { flex: 1, gap: 2 },
  receiveTitle: { fontFamily: InterFont.medium, fontSize: 13, lineHeight: 18, color: W.ink },
  receiveSubtitle: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: W.secondary },
  compactReceiveSubtitle: { fontSize: 9 },
  caption: { fontFamily: InterFont.regular, fontSize: W.captionSize, lineHeight: 17, color: W.secondary },
  sectionHeading: { marginTop: 20, marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  sectionTitle: { fontFamily: InterFont.semiBold, fontSize: 18, lineHeight: 25, color: W.ink },
  filter: { minHeight: 30, maxWidth: '62%', paddingHorizontal: 13, borderRadius: 24, backgroundColor: W.muted, flexDirection: 'row', alignItems: 'center', gap: 7 },
  filterLabel: { flexShrink: 1, fontFamily: InterFont.medium, fontSize: 11, color: W.secondary },
  assetList: { gap: 4 },
  asset: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56, paddingVertical: 7, paddingLeft: 12, paddingRight: 10, borderRadius: 21, backgroundColor: W.assetSurface },
  assetName: { flex: 1, gap: 3, minWidth: 0 },
  assetSymbol: { fontFamily: InterFont.medium, fontSize: 13, lineHeight: 18, color: W.ink },
  compactCaption: { fontSize: 9 },
  sparkline: { width: 42, alignItems: 'center', opacity: 0.8 },
  assetAmount: { alignItems: 'flex-end', gap: 3 },
  assetValue: { fontFamily: InterFont.medium, fontSize: 13, lineHeight: 18, color: W.ink, fontVariant: ['tabular-nums'] },
  activity: { alignSelf: 'center', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  activityLabel: { fontFamily: InterFont.medium, fontSize: 11, color: W.secondary },
  networkLabel: { fontFamily: InterFont.medium, fontSize: W.bodySize, color: W.ink },
  networkOption: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Dashboard.line },
  detail: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  detailValue: { fontFamily: InterFont.semiBold, fontSize: 32, color: W.ink },
  detailHeading: { fontFamily: InterFont.semiBold, fontSize: 18, lineHeight: 25, color: W.ink, textAlign: 'center' },
  detailCopy: { fontFamily: InterFont.regular, fontSize: W.bodySize, lineHeight: 22, color: W.secondary, textAlign: 'center' },
  previewNote: { fontFamily: InterFont.regular, fontSize: W.captionSize, color: W.secondary, marginTop: 12 },
});
