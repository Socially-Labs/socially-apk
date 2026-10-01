import { Check, ChevronDown, ChevronRight, History, LayoutGrid, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AuthButton } from '@/components/shared/motion';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { DashboardShell } from '@/components/shared/dashboard/dashboard-shell';
import { TokenIcon } from '@/components/shared/markets/market-graphics';
import { WalletActions } from '@/components/wallet/wallet-actions';
import { InterFont } from '@/constants/fonts';
import { Dashboard, WalletPalette as W } from '@/constants/theme';
import { formatWalletValue, walletAssets, walletBalance, type WalletAsset } from '@/constants/wallet';

type WalletSheet = 'deposit-contact' | 'withdraw-contact' | 'scan' | 'receive' | 'history' | 'networks' | WalletAsset;
const filters = ['All Networks', 'Solana', 'Solana (Wormhole)'] as const;
type NetworkFilter = typeof filters[number];

export default function WalletScreen() {
  const [sheet, setSheet] = useState<WalletSheet | null>(null);
  const [network, setNetwork] = useState<NetworkFilter>('All Networks');
  const { height, width } = useWindowDimensions();
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
        <AuthButton accessibilityRole="button" accessibilityLabel="View wallet activity" testID="wallet-history"
          onPress={() => setSheet('history')} style={styles.history}>
          <History size={21} strokeWidth={1.8} color={W.secondary} />
        </AuthButton>
      </View>
      <View style={[styles.hero, { marginTop: Math.max(48, Math.min(96, height * 0.095)) }]}>
        <Text style={[styles.balance, width < 360 && styles.compactBalance]} testID="wallet-balance"
          numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{walletBalance}</Text>
      </View>
      {/* The receive row and money actions share one surface, with independent tap targets. */}
      <View style={styles.receiveCard} testID="wallet-funding-card">
        <AuthButton accessibilityRole="button" accessibilityLabel="Receive on Solana"
          testID="wallet-receive" onPress={() => setSheet('receive')} style={styles.receive}>
          <View style={styles.receiveIcon}><LayoutGrid size={23} color={W.ink} strokeWidth={2.2} /></View>
          <Text style={styles.receiveTitle}>Receive on Solana</Text>
          <ChevronRight size={21} color={W.secondary} strokeWidth={1.8} />
        </AuthButton>
        <View style={styles.cardDivider} />
        <WalletActions onContact={mode => setSheet(mode === 'deposit' ? 'deposit-contact' : 'withdraw-contact')}
          onScan={() => setSheet('scan')} onReceive={() => setSheet('receive')} />
      </View>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Assets</Text>
        <AuthButton accessibilityRole="button" accessibilityLabel={`Filter assets. ${network} selected`}
          testID="wallet-networks" onPress={() => setSheet('networks')} style={styles.filter}>
          <Text style={styles.filterLabel} numberOfLines={1}>{network}</Text>
          <ChevronDown size={15} color={W.secondary} strokeWidth={2} />
        </AuthButton>
      </View>
      <View style={styles.assetList}>
        {assets.map(asset => (
          <AuthButton key={asset.symbol} accessibilityRole="button"
            accessibilityLabel={`${asset.name}, ${asset.quantity}, ${formatWalletValue(asset.value)}, ${asset.network}`}
            testID={`wallet-asset-${asset.symbol.toLowerCase()}`} onPress={() => setSheet(asset)} style={styles.asset}>
            <TokenIcon symbol={asset.symbol} size={42} />
            <View style={styles.assetName}>
              <Text style={styles.assetSymbol}>{asset.symbol}</Text>
              <Text style={styles.caption}>{asset.network}</Text>
            </View>
            <View style={styles.assetAmount}>
              <Text style={styles.assetValue}>{formatWalletValue(asset.value)}</Text>
              <Text style={styles.caption}>{asset.quantity}</Text>
            </View>
            <ChevronRight size={19} color={W.secondary} strokeWidth={1.8} />
          </AuthButton>
        ))}
      </View>
      <DashboardSheet visible={sheet !== null} title={title} onClose={() => setSheet(null)}>
        {sheet === 'networks' ? filters.map(filter => (
          <AuthButton key={filter} accessibilityRole="button" accessibilityState={{ selected: filter === network }}
            onPress={() => { setNetwork(filter); setSheet(null); }} style={styles.networkOption}>
            <Text style={styles.networkLabel}>{filter}</Text>
            {filter === network ? <Check size={20} color={W.selectedInk} /> : null}
          </AuthButton>
        )) : typeof sheet === 'object' && sheet !== null ? (
          <View style={styles.detail}>
            <TokenIcon symbol={sheet.symbol} size={56} />
            <Text style={styles.detailValue}>{formatWalletValue(sheet.value)}</Text>
            <Text style={styles.detailCopy}>{sheet.quantity}</Text>
            <Text style={styles.detailCopy}>{sheet.network}</Text>
            <Text style={styles.previewNote}>Preview holding</Text>
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

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingHorizontal: 3, gap: 11 },
  headerIcon: { width: 47, height: 47, borderRadius: 24, backgroundColor: W.muted, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1, gap: 3 },
  history: { width: 44, height: 44, borderRadius: 13, backgroundColor: W.surface, alignItems: 'center', justifyContent: 'center' },
  hero: { paddingHorizontal: 12 },
  title: { fontFamily: InterFont.semiBold, fontSize: W.headerTitleSize, lineHeight: 23, color: W.ink },
  subtitle: { fontFamily: InterFont.regular, fontSize: W.captionSize, lineHeight: 17, color: W.secondary },
  balance: { fontFamily: InterFont.semiBold, fontSize: W.balanceSize, lineHeight: 52, letterSpacing: -1.7, color: W.ink, fontVariant: ['tabular-nums'] },
  compactBalance: { fontSize: 36 },
  receiveCard: { marginTop: 24, padding: 14, borderRadius: 24, backgroundColor: W.surface, boxShadow: W.shadow },
  receive: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 13 },
  receiveIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: W.muted, alignItems: 'center', justifyContent: 'center' },
  receiveTitle: { flex: 1, fontFamily: InterFont.medium, fontSize: W.bodySize, lineHeight: 20, color: W.ink },
  cardDivider: { height: 1, backgroundColor: W.border, marginTop: 12 },
  caption: { fontFamily: InterFont.regular, fontSize: W.captionSize, lineHeight: 17, color: W.secondary },
  sectionHeading: { marginTop: 18, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  sectionTitle: { fontFamily: InterFont.medium, fontSize: 20, lineHeight: 28, color: W.ink },
  filter: { minHeight: 44, maxWidth: '62%', paddingHorizontal: 13, borderRadius: 24, backgroundColor: W.muted, flexDirection: 'row', alignItems: 'center', gap: 7 },
  filterLabel: { flexShrink: 1, fontFamily: InterFont.medium, fontSize: 11, color: W.secondary },
  assetList: { gap: 7 },
  asset: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 58, paddingVertical: 8, paddingLeft: 14, paddingRight: 10, borderRadius: 17, backgroundColor: W.surface },
  assetName: { flex: 1, gap: 3 },
  assetSymbol: { fontFamily: InterFont.medium, fontSize: 14, lineHeight: 19, color: W.ink },
  assetAmount: { alignItems: 'flex-end', gap: 3 },
  assetValue: { fontFamily: InterFont.medium, fontSize: 14, lineHeight: 19, color: W.ink, fontVariant: ['tabular-nums'] },
  networkLabel: { fontFamily: InterFont.medium, fontSize: W.bodySize, color: W.ink },
  networkOption: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Dashboard.line },
  detail: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  detailValue: { fontFamily: InterFont.semiBold, fontSize: 32, color: W.ink },
  detailHeading: { fontFamily: InterFont.semiBold, fontSize: 18, lineHeight: 25, color: W.ink, textAlign: 'center' },
  detailCopy: { fontFamily: InterFont.regular, fontSize: W.bodySize, lineHeight: 22, color: W.secondary, textAlign: 'center' },
  previewNote: { fontFamily: InterFont.regular, fontSize: W.captionSize, color: W.secondary, marginTop: 12 },
});
