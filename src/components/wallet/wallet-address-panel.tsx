import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { setStringAsync } from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { Copy, Share2, Wallet } from 'lucide-react-native';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { SheetSurface, sheetMaterialStyle } from '@/components/shared/dashboard/sheet-surface';
import { TokenIcon } from '@/components/shared/markets/market-graphics';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont, InterFont } from '@/constants/fonts';
import { WalletPalette as W } from '@/constants/theme';
import { GlacierQrCard, GLACIER_WIDTH } from './glacier-qr-card';
import { shareQrImage } from './share-qr-image';
import { qrShareMessage } from './qr-share-message';
import { QrSharingUnavailableError } from './qr-share-error';

/** A plain receiving address. It never creates an amount-specific funding request. */
export function WalletAddressPanel({ address, ready, authenticated, info, onCloseInfo, ownerName }: {
  address: string | null; ready: boolean; authenticated: boolean; info: boolean; onCloseInfo: () => void; ownerName?: string;
}) {
  const { width } = useWindowDimensions();
  const exportCard = useRef<View>(null);
  const sharingLock = useRef(false), mounted = useRef(true);
  const [sharing, setSharing] = useState(false);
  const [exportLayout, setExportLayout] = useState<{ address: string; height: number } | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const receivingAddress = ready && authenticated && address && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) ? address : null;
  const currentAddress = useRef(receivingAddress);
  useLayoutEffect(() => { currentAddress.current = receivingAddress; }, [receivingAddress]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const qrSize = Math.min(252, Math.max(120, width - 132));
  const shareReady = !!receivingAddress && exportLayout?.address === receivingAddress && exportLayout.height > 0;
  const shareDetails = receivingAddress ? { value: receivingAddress, address: receivingAddress, ownerName, title: 'My Solana wallet', network: 'SOLANA DEVNET', note: 'Solana Devnet only. Test tokens have no monetary value.' } : null;

  async function copy() {
    if (!receivingAddress) return;
    setError(null);
    try {
      if (!await setStringAsync(receivingAddress)) throw new Error('clipboard unavailable');
      setCopiedAddress(receivingAddress);
    } catch { setError('Couldn’t copy the address. You can still scan the QR.'); }
  }
  async function share() {
    if (sharingLock.current || !shareReady || !shareDetails || !exportLayout) return;
    sharingLock.current = true; setSharing(true); setError(null); setShareNotice(null);
    const available = () => mounted.current && currentAddress.current === shareDetails.address;
    try {
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (!available()) return;
      await shareQrImage(exportCard, exportLayout.height, available, GLACIER_WIDTH, qrShareMessage(shareDetails), notice => { if (available()) setShareNotice(notice); });
    } catch (cause) {
      if (available()) { setShareNotice(null); setError(cause instanceof QrSharingUnavailableError ? cause.message : 'Couldn’t share the image. Try again, or copy the wallet address.'); }
    } finally {
      sharingLock.current = false;
      if (mounted.current) setSharing(false);
    }
  }

  return <View style={styles.panel} testID="wallet-address-panel">
    {shareDetails ? <View style={styles.exportCanvas} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
      <GlacierQrCard key={shareDetails.address} ref={exportCard} details={shareDetails} onLayoutReady={height => setExportLayout({ address: shareDetails.address, height })} />
    </View> : null}
    <View style={[styles.card, sheetMaterialStyle]} testID="receive-frosted-card">
      <SheetSurface />
      <View style={styles.network}><TokenIcon symbol="SOL" size={22} /><Text style={styles.networkText}>Solana Devnet</Text></View>
      {receivingAddress ? <>
        <View style={styles.qr} accessible accessibilityLabel={`QR code for your Solana address ${receivingAddress}`} testID="receive-address-qr">
          <QRCode value={receivingAddress} size={qrSize} quietZone={16} color={W.receiveQrInk} backgroundColor={W.white} ecl="M" />
        </View>
        <View style={styles.walletCopy}>
          <Text style={styles.title}>My Solana wallet</Text>
          <Text style={styles.address} testID="receive-address">{receivingAddress.slice(0, 6)}…{receivingAddress.slice(-6)}</Text>
        </View>
      </> : <View style={styles.empty}>
        {!ready ? <ActivityIndicator color={W.ink} /> : <Wallet size={40} strokeWidth={1.5} color={W.ink} />}
        <Text style={styles.emptyTitle}>{!ready ? 'Loading your wallet…' : !authenticated ? 'Sign in to receive' : 'No Solana wallet linked'}</Text>
        {ready ? <Text style={styles.helper}>{!authenticated ? 'Sign in to see your Solana receiving address.' : 'Link a Solana wallet to your account to see its QR code here.'}</Text> : null}
      </View>}
    </View>
    {receivingAddress ? <View style={styles.bottom}>
      <Text style={styles.helper}>Receive Solana Devnet assets only</Text>
      <View style={styles.actions}>
        <AuthButton onPress={() => { void copy(); }} accessibilityRole="button" accessibilityLabel="Copy Solana address" style={styles.action} testID="receive-copy"><Copy size={20} color={W.ink} /><Text style={styles.actionText}>{copiedAddress === receivingAddress ? 'Copied' : 'Copy'}</Text></AuthButton>
        <AuthButton onPress={() => { void share(); }} disabled={sharing || !shareReady} accessibilityRole="button" accessibilityLabel="Share Solana address" accessibilityState={{ disabled: sharing || !shareReady, busy: sharing }} style={styles.action} testID="receive-share">{sharing ? <ActivityIndicator color={W.ink} /> : <Share2 size={20} color={W.ink} />}<Text style={styles.actionText}>{sharing ? 'Sharing…' : 'Share'}</Text></AuthButton>
      </View>
    </View> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {shareNotice ? <Text accessibilityLiveRegion="polite" style={styles.helper}>{shareNotice}</Text> : null}
    <DashboardSheet visible={info} title="Your Solana address" onClose={onCloseInfo}>
      <View style={styles.info}>
        <Text style={styles.body}>Scan this QR or share your address to receive SOL and Solana tokens directly in your wallet. The sender chooses the amount.</Text>
        {receivingAddress ? <View style={styles.addressDetails}><Text style={styles.label}>Wallet address</Text><Text selectable style={styles.fullAddress}>{receivingAddress}</Text></View> : null}
        <Text style={styles.body}>Select Solana Devnet in your sending wallet. Your address stays the same and the QR does not expire.</Text>
        <Text style={styles.body}>Transfers arrive in this wallet. Use Deposit to fund your Tradble trading balance.</Text>
      </View>
    </DashboardSheet>
  </View>;
}

const styles = StyleSheet.create({
  exportCanvas: { position: 'absolute', left: -10000, top: 0 },
  panel: { width: '100%', maxWidth: 380, alignSelf: 'center', flexGrow: 1, gap: 18 },
  card: { backgroundColor: W.receiveGlass.surface, borderWidth: 1, borderColor: W.receiveGlass.border, borderRadius: 34, padding: 24, gap: 22, overflow: 'hidden', boxShadow: W.receiveGlass.shadow },
  network: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: W.surface, borderWidth: 1, borderColor: W.receiveGlass.border, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 9 },
  networkText: { fontFamily: InterFont.medium, fontSize: 13, color: W.ink },
  qr: { alignSelf: 'center', borderRadius: 20, overflow: 'hidden', backgroundColor: W.white },
  walletCopy: { gap: 5 },
  title: { fontFamily: BrandFont.editorial, fontSize: 30, lineHeight: 36, color: W.ink },
  address: { fontFamily: InterFont.regular, fontSize: 14, lineHeight: 20, color: W.secondary },
  bottom: { marginTop: 'auto', paddingTop: 28, gap: 18 },
  helper: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 20, color: W.secondary, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, minHeight: 54, borderRadius: 28, borderWidth: 1, borderColor: W.receiveGlass.border, backgroundColor: W.receiveGlass.action, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: W.shadow },
  actionText: { fontFamily: InterFont.semiBold, fontSize: 16, color: W.ink },
  empty: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 18 },
  emptyTitle: { fontFamily: InterFont.semiBold, fontSize: 17, color: W.ink, textAlign: 'center' },
  error: { fontFamily: InterFont.regular, fontSize: 13, color: W.error, lineHeight: 19, textAlign: 'center' },
  info: { gap: 18 },
  body: { fontFamily: InterFont.regular, fontSize: 15, lineHeight: 22, color: W.selectedInk },
  addressDetails: { padding: 16, borderRadius: 18, backgroundColor: W.surface, gap: 8 },
  label: { fontFamily: InterFont.medium, fontSize: 12, color: W.secondary },
  fullAddress: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 20, color: W.ink },
});
