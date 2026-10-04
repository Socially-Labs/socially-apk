import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { TokenIcon } from '@/components/shared/markets/market-graphics';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont, InterFont } from '@/constants/fonts';
import { Dashboard, WalletPalette as W } from '@/constants/theme';
import { formatWalletValue, walletAssets, type WalletAsset } from '@/constants/wallet';
import { Check, ChevronRight, History, Plus, Settings, Wallet } from 'lucide-react-native';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { sharedStyles } from './wallet-section-styles';
import { filters, type NetworkFilter, type WalletSheet as WalletSheetKind } from './wallet-types';

export function WalletSheet({ sheet, network, hiddenTokens, balanceVisible, onClose, onNetwork, onSettings, onActivity, onTokenVisibility, onShowSheet }: {
  sheet: WalletSheetKind | null; network: NetworkFilter; hiddenTokens: WalletAsset['symbol'][]; balanceVisible: boolean;
  onClose: () => void; onNetwork: (filter: NetworkFilter) => void; onSettings: () => void; onActivity: () => void;
  onTokenVisibility: (symbol: WalletAsset['symbol'], visible: boolean) => void; onShowSheet: (sheet: WalletSheetKind) => void;
}) {
  const title = sheet === null ? '' : typeof sheet === 'object' ? sheet.name : {
    deposit: 'Deposit crypto', send: 'Send crypto', receive: 'Receive on Solana', swap: 'Swap assets', networks: 'Networks', options: 'Wallet options', manage: 'Manage tokens', 'custom-token': 'Add a custom token',
  }[sheet];

  return (
    <DashboardSheet visible={sheet !== null} title={title} onClose={onClose}>
      {sheet === 'networks' ? filters.map(filter => <AuthButton key={filter} accessibilityRole="button" accessibilityState={{ selected: filter === network }} onPress={() => onNetwork(filter)} style={styles.networkOption}>
        <Text style={styles.networkLabel}>{filter}</Text>{filter === network ? <Check size={20} color={W.selectedInk} /> : null}
      </AuthButton>) : sheet === 'options' ? <View style={styles.options}>
        <AuthButton accessibilityRole="button" onPress={onSettings} testID="wallet-options-settings" style={styles.option}><Settings size={20} color={W.ink} /><Text style={styles.networkLabel}>Settings</Text><ChevronRight size={17} color={W.secondary} /></AuthButton>
        <AuthButton accessibilityRole="button" onPress={onActivity} testID="wallet-history" style={styles.option}><History size={20} color={W.ink} /><Text style={styles.networkLabel}>View activity</Text><ChevronRight size={17} color={W.secondary} /></AuthButton>
        <Text style={styles.detailCopy}>These sample balances illustrate the wallet. No live balance or transfer is connected.</Text>
      </View> : sheet === 'manage' ? <View style={styles.options}>
        {walletAssets.map(asset => <View key={asset.symbol} style={styles.tokenOption}>
          <TokenIcon symbol={asset.symbol} size={34} /><View style={styles.manageCopy}><Text style={styles.assetSymbol}>{asset.symbol}</Text><Text style={styles.caption}>{asset.network}</Text></View>
          <Switch accessibilityLabel={`Show ${asset.symbol}`} testID={`wallet-show-${asset.symbol.toLowerCase()}`} value={!hiddenTokens.includes(asset.symbol)} onValueChange={value => onTokenVisibility(asset.symbol, value)} trackColor={{ false: W.muted, true: W.primaryAction[0] }} thumbColor={W.white} />
        </View>)}
        <AuthButton accessibilityRole="button" onPress={() => onShowSheet('custom-token')} style={styles.option}><Plus size={21} color={W.ink} /><Text style={styles.networkLabel}>Add a custom token</Text><ChevronRight size={17} color={W.secondary} /></AuthButton>
      </View> : typeof sheet === 'object' && sheet !== null ? <View style={styles.detail}>
        <TokenIcon symbol={sheet.symbol} size={56} /><Text style={styles.detailValue}>{balanceVisible ? formatWalletValue(sheet.value) : '••••'}</Text><Text style={styles.detailCopy}>{balanceVisible ? sheet.quantity : '••••'}</Text><Text style={styles.detailCopy}>{sheet.network}</Text><Text style={styles.previewNote}>Preview holding</Text>
        <AuthButton accessibilityRole="button" accessibilityLabel="View wallet activity" testID="wallet-history" onPress={onActivity} style={styles.option}><History size={18} color={W.secondary} /><Text style={styles.networkLabel}>View activity</Text></AuthButton>
      </View> : <View style={styles.detail}>
        <Wallet size={32} color={W.selectedInk} /><Text style={styles.detailHeading}>Connect your wallet</Text><Text style={styles.detailCopy}>{sheet === 'send' ? 'Connect your wallet to send crypto to a Solana address.' : sheet === 'swap' ? 'Connect your wallet to choose tokens and review a swap quote.' : sheet === 'custom-token' ? 'Connect your wallet to add a token by its Solana mint address.' : 'Connect your wallet to get your Solana deposit address.'}</Text><Text style={styles.previewNote}>You’re viewing a preview portfolio.</Text>
      </View>}
    </DashboardSheet>
  );
}

const styles = StyleSheet.create({
  ...sharedStyles,
  options: { gap: 14 },
  option: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tokenOption: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, borderBottomWidth: 1, borderBottomColor: W.border },
  networkLabel: { flex: 1, fontFamily: InterFont.medium, fontSize: W.bodySize, color: W.ink },
  networkOption: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Dashboard.line },
  detail: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  detailValue: { fontFamily: BrandFont.editorial, fontSize: 36, color: W.ink },
  detailHeading: { fontFamily: InterFont.semiBold, fontSize: 18, lineHeight: 25, color: W.ink, textAlign: 'center' },
  previewNote: { fontFamily: InterFont.regular, fontSize: W.captionSize, color: W.secondary },
});
