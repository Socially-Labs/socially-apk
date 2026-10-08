import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { setStringAsync } from 'expo-clipboard';
import { ArrowDownLeft, Bell, Check, CheckCircle2, Copy, Share2 } from 'lucide-react-native';
import { formatPaymentAmount, validDepositAmount, type QrDeposit, type WalletSummary } from '@/api/wallet';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { SheetSurface, sheetMaterialStyle } from '@/components/shared/dashboard/sheet-surface';
import { TokenIcon } from '@/components/shared/markets/market-graphics';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont, InterFont } from '@/constants/fonts';
import { WalletPalette as W } from '@/constants/theme';
import { ShareQrSheet } from './share-qr-sheet';

export const paymentStatus = { WAITING: 'Waiting for payment', CONFIRMING: 'Confirming on Solana', CONFIRMED: 'Funds added', EXPIRED: 'Payment request expired' };
const failureCopy: Record<string, string> = {
  wrong_amount: 'A different amount was received and wasn’t credited. Keep the transaction signature for support.',
  wrong_mint: 'A different token was received and wasn’t credited. Use the test token shown in the payment details.',
  wrong_destination: 'The detected transaction did not pay this request.',
  transaction_failed: 'The transaction failed on Solana. No funds were added.',
  already_credited: 'That transaction has already been credited.',
};

export function QrDepositPanel({ summary, creating, serviceError, selectedId, onSelect, onCreate, onRefresh, details = null, onCloseDetails = () => {} }: {
  summary: WalletSummary | null; creating: boolean; serviceError: string | null;
  selectedId: string | null; onSelect: (id: string | null) => void;
  onCreate: (amount: string) => Promise<QrDeposit>; onRefresh: () => Promise<void>;
  details?: 'info' | 'status' | null; onCloseDetails?: () => void;
}) {
  const [shareId, setShareId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const { width } = useWindowDimensions();
  // Reopen the latest active payment without requiring a separate “resume” workflow.
  const deposit = editing ? undefined : summary?.deposits.find(d => d.id === selectedId) ??
    summary?.deposits.find(d => d.canPay || d.status === 'CONFIRMING');
  useEffect(() => {
    if (deposit && !selectedId && !editing) onSelect(deposit.id);
  }, [deposit, selectedId, editing, onSelect]);
  const expiresAt = deposit?.expiresAt;
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setTimeout(() => setClock(Date.now()), Math.max(0, Date.parse(expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt]);
  const payable = !!deposit?.canPay && Date.parse(deposit.expiresAt) > clock;
  const qrSize = Math.min(252, Math.max(120, width - 132));
  async function create() {
    setError(null);
    try { const payment = await onCreate(amount.trim()); onSelect(payment.id); setEditing(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Couldn’t prepare your payment. Please try again.'); }
  }
  async function copy() {
    if (!deposit || !payable || Date.parse(deposit.expiresAt) <= Date.now()) return;
    setError(null);
    try {
      if (!await setStringAsync(deposit.paymentUrl)) throw new Error('clipboard unavailable');
      setCopiedId(deposit.id);
    } catch { setError('Couldn’t copy the link. You can still scan the QR.'); }
  }
  function share() {
    if (!deposit || !payable || Date.parse(deposit.expiresAt) <= Date.now()) return;
    setError(null); setShareId(deposit.id);
  }

  function changeAmount() {
    setAmount(deposit?.amount ?? ''); setEditing(true); setError(null); setCopiedId(null); onSelect(null);
  }
  const token = deposit?.token ?? summary?.token;
  const status = deposit ? !payable && deposit.status === 'WAITING' ? paymentStatus.EXPIRED : paymentStatus[deposit.status] : 'No payment request yet';
  const helper = payable ? 'Your balance updates automatically when the payment arrives.' : deposit?.status === 'CONFIRMED' ? 'Ready to trade or allocate to a Captain.' : deposit?.status === 'CONFIRMING' ? 'You can close this screen. We’ll keep checking.' : 'Already sent? We’ll still check your payment.';
  return <View style={styles.panel} testID="qr-deposit-panel">
    {deposit && shareId === deposit.id && payable ? <ShareQrSheet key={deposit.id} onClose={() => setShareId(null)} canShare={() => !!deposit.canPay && Date.parse(deposit.expiresAt) > Date.now()} details={{ value: deposit.paymentUrl, address: new URL(deposit.paymentUrl).pathname, title: 'Tradble balance', network: 'SOLANA DEVNET · TEST TOKENS', amount: `${formatPaymentAmount(deposit.amount)} Test USDC`, mint: deposit.token.mint, expiresAt: deposit.expiresAt, note: 'Send the exact amount of Test USDC on devnet. Scan this payment QR to keep its tracking reference. Test tokens have no real-world value.' }} /> : null}
    {!summary || !summary.enabled ? <View style={[styles.empty, sheetMaterialStyle]}>
      <SheetSurface />
      {!serviceError && !summary ? <ActivityIndicator color={W.selectedInk} /> : <ArrowDownLeft size={32} color={W.selectedInk} />}
      <Text style={styles.body}>{!summary ? serviceError ? 'Your funding account is unavailable.' : 'Loading your account…' : 'Devnet funding will be available once the server is configured.'}</Text>
      {serviceError ? <AuthButton onPress={() => { void onRefresh(); }} accessibilityRole="button" style={styles.primary}><Text style={styles.primaryText}>Try again</Text></AuthButton> : null}
    </View> : deposit ? <>
      <View style={[styles.card, sheetMaterialStyle]} testID="receive-frosted-card">
        <SheetSurface />
        <View style={styles.networkPill}><TokenIcon symbol="SOL" size={22} /><Text style={styles.network}>Solana devnet</Text></View>
        {payable ? <View style={styles.qr} accessible accessibilityLabel={`Payment QR for ${deposit.amount} Test USDC on Solana devnet`} testID="deposit-payment-qr">
          <QRCode value={deposit.paymentUrl} size={qrSize} quietZone={16} color={W.receiveQrInk} backgroundColor={W.white} ecl="M" />
        </View> : <View style={styles.finished}>
          {deposit.status === 'CONFIRMED' ? <CheckCircle2 size={64} strokeWidth={1.4} color={W.gain} /> : <ArrowDownLeft size={56} strokeWidth={1.4} color={W.secondary} />}
          <Text style={styles.finishedTitle}>{deposit.status === 'CONFIRMED' ? 'Funds added' : deposit.status === 'CONFIRMING' ? 'Confirming on Solana' : 'This request has ended'}</Text>
        </View>}
        <View style={styles.cardFooter}>
          <View style={styles.cardCopy}><Text style={styles.cardTitle}>Tradble balance</Text><Text style={styles.cardCaption}>{formatPaymentAmount(deposit.status === 'CONFIRMED' ? deposit.creditedAmount : deposit.amount)} Test USDC</Text></View>
        </View>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.helper} accessibilityLiveRegion="polite">{payable ? 'Receive Test USDC on Solana devnet only' : helper}</Text>
        {payable ? <View style={styles.actions}>
          <AuthButton onPress={() => { void copy(); }} accessibilityRole="button" accessibilityLabel="Copy payment link" style={styles.action} testID="receive-copy"><Copy size={20} color={W.ink} /><Text style={styles.actionText}>{copiedId === deposit.id ? 'Copied' : 'Copy'}</Text></AuthButton>
          <AuthButton onPress={() => { void share(); }} accessibilityRole="button" accessibilityLabel="Share payment link" style={styles.action} testID="receive-share"><Share2 size={20} color={W.ink} /><Text style={styles.actionText}>Share</Text></AuthButton>
        </View> : <AuthButton onPress={changeAmount} accessibilityRole="button" style={styles.primary}><Text style={styles.primaryText}>Receive more funds</Text></AuthButton>}
      </View>
    </> : <View style={[styles.entry, sheetMaterialStyle]}>
      <SheetSurface />
      <View style={styles.networkPill}><TokenIcon symbol="SOL" size={22} /><Text style={styles.network}>Solana devnet</Text></View>
      <View style={styles.entryIcon}><ArrowDownLeft size={28} color={W.selectedInk} strokeWidth={1.6} /></View>
      <Text style={styles.entryTitle}>Receive funds.</Text>
      <Text style={styles.helper}>{'Choose a Test USDC amount\nto create your payment QR.'}</Text>
      <View style={styles.amountField}>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" accessibilityLabel="Deposit amount in test USDC" placeholder="0" placeholderTextColor={W.secondary} maxLength={14} editable={!creating} style={styles.input} testID="deposit-amount" />
        <Text style={styles.fieldCurrency}>USDC</Text>
      </View>
      <Text style={styles.helper}>1–1,000,000 USDC · Up to 6 decimals</Text>
      <AuthButton onPress={() => { void create(); }} disabled={creating || !validDepositAmount(amount.trim())} accessibilityRole="button" style={[styles.primary, (creating || !validDepositAmount(amount.trim())) && styles.disabled]} testID="deposit-create-qr">
        {creating ? <ActivityIndicator color={W.white} /> : <Text style={styles.primaryText}>Create QR code</Text>}
      </AuthButton>
    </View>}
    {deposit?.lastError ? <Text accessibilityRole="alert" style={styles.error}>{failureCopy[deposit.lastError] ?? 'A transaction could not be matched. No funds were added for it.'}</Text> : null}
    {error || serviceError ? <Text accessibilityRole="alert" style={styles.error}>{error ?? 'Connection interrupted. Payment checks will resume automatically.'}</Text> : null}
    <Text style={styles.footnote}>Test funds only · No real monetary value</Text>
    <DashboardSheet visible={details === 'status'} title="Payment notifications" onClose={onCloseDetails}>
      <View style={styles.infoContent} testID="receive-payment-status">
        <View style={styles.status} accessibilityLiveRegion="polite">
          {deposit?.status === 'CONFIRMED' ? <Check size={20} color={W.gain} /> : <Bell size={20} color={W.ink} />}
          <Text style={styles.statusText}>{status}</Text>
        </View>
        <Text style={styles.body}>{deposit ? helper : 'Create a payment QR to track incoming funds here. Your balance updates automatically after verification.'}</Text>
        {deposit ? <View style={styles.tokenDetails}><Text style={styles.detailLabel}>Payment amount</Text><Text style={styles.body}>{formatPaymentAmount(deposit.amount)} Test USDC · Solana devnet</Text></View> : null}
        {payable ? <AuthButton onPress={() => { onCloseDetails(); changeAmount(); }} accessibilityRole="button" style={styles.primary}><Text style={styles.primaryText}>Change amount</Text></AuthButton> : null}
      </View>
    </DashboardSheet>
    <DashboardSheet visible={details === 'info'} title="Receiving funds" onClose={onCloseDetails} footer={<AuthButton onPress={onCloseDetails} accessibilityRole="button" style={styles.primary}><Text style={styles.primaryText}>Got it</Text></AuthButton>}>
      <View style={styles.infoContent}>
        <Text style={styles.body}>Use this QR or its payment link with a Solana Pay compatible wallet set to devnet. The link includes your amount and a reference that matches the payment to your Tradble balance.</Text>
        <Text style={styles.body}>Send only the configured Test USDC token and the exact amount. A plain transfer to the address cannot be matched to your account. Your sending wallet also needs devnet SOL for fees.</Text>
        {token ? <View style={styles.tokenDetails}><Text style={styles.detailLabel}>Test USDC token mint</Text><Text selectable style={styles.mint}>{token.mint}</Text></View> : null}
        {deposit ? <Text style={styles.body}>This payment link expires at {new Date(deposit.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Payments already sent are still checked after expiry.</Text> : null}
        <Text style={styles.body}>Funds appear after verification on Solana. Closing the screen won’t stop confirmation. Other networks are coming soon.</Text>
      </View>
    </DashboardSheet>
  </View>;
}
const styles = StyleSheet.create({
  panel: { width: '100%', maxWidth: 380, alignSelf: 'center', flexGrow: 1, gap: 18 },
  networkPill: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: W.surface, borderWidth: 1, borderColor: W.receiveGlass.border, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 9 },
  network: { fontFamily: InterFont.medium, fontSize: 13, color: W.ink },
  card: { backgroundColor: W.receiveGlass.surface, borderWidth: 1, borderColor: W.receiveGlass.border, borderRadius: 34, padding: 24, gap: 22, overflow: 'hidden', boxShadow: W.receiveGlass.shadow },
  qr: { alignSelf: 'center', borderRadius: 20, overflow: 'hidden', backgroundColor: W.white },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardCopy: { flex: 1, gap: 5 },
  cardTitle: { fontFamily: BrandFont.editorial, fontSize: 32, lineHeight: 36, color: W.ink },
  cardCaption: { fontFamily: InterFont.regular, fontSize: 14, lineHeight: 20, color: W.secondary },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusText: { flexShrink: 1, fontFamily: InterFont.semiBold, fontSize: 17, color: W.ink },
  helper: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 20, color: W.secondary, textAlign: 'center' },
  bottom: { marginTop: 'auto', paddingTop: 28, gap: 18 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, minHeight: 54, borderRadius: 28, borderWidth: 1, borderColor: W.receiveGlass.border, backgroundColor: W.receiveGlass.action, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: W.shadow },
  actionText: { fontFamily: InterFont.semiBold, fontSize: 16, color: W.ink },
  primary: { minHeight: 54, borderRadius: 27, backgroundColor: W.receiveCard, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primaryText: { fontFamily: InterFont.semiBold, fontSize: 15, color: W.white },
  disabled: { opacity: 0.4 },
  entry: { backgroundColor: W.receiveGlass.surface, borderWidth: 1, borderColor: W.receiveGlass.border, borderRadius: 34, overflow: 'hidden', padding: 24, gap: 18, boxShadow: W.receiveGlass.shadow },
  entryIcon: { width: 52, height: 52, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderRadius: 26, backgroundColor: W.receivePill },
  entryTitle: { fontFamily: BrandFont.editorial, fontSize: 37, lineHeight: 41, color: W.ink, textAlign: 'center' },
  amountField: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, borderColor: W.border, backgroundColor: W.surface, padding: 10 },
  input: { flex: 1, minWidth: 0, minHeight: 48, color: W.ink, fontFamily: InterFont.medium, fontSize: 30, paddingHorizontal: 8 },
  fieldCurrency: { fontFamily: InterFont.medium, fontSize: 15, color: W.secondary },
  finished: { minHeight: 204, alignItems: 'center', justifyContent: 'center', gap: 20 },
  finishedTitle: { fontFamily: InterFont.medium, fontSize: 17, color: W.ink, textAlign: 'center' },
  empty: { minHeight: 300, borderRadius: 34, overflow: 'hidden', padding: 24, borderWidth: 1, borderColor: W.receiveGlass.border, justifyContent: 'center', alignItems: 'center', gap: 20 },
  footnote: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: W.secondary, textAlign: 'center' },
  error: { fontFamily: InterFont.regular, fontSize: 13, color: W.error, lineHeight: 19, textAlign: 'center' },
  infoContent: { gap: 18 },
  body: { fontFamily: InterFont.regular, fontSize: 15, lineHeight: 21, color: W.selectedInk },
  tokenDetails: { padding: 16, borderRadius: 18, backgroundColor: W.surface, gap: 8 },
  detailLabel: { fontFamily: InterFont.medium, fontSize: 12, color: W.secondary },
  mint: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 19, color: W.ink },
});
