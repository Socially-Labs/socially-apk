import { useEffect, useState } from 'react';
import { ActivityIndicator, Share, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { setStringAsync } from 'expo-clipboard';
import { ArrowDownLeft, Check, CheckCircle2, Copy, Info, Share2 } from 'lucide-react-native';
import { formatPaymentAmount, validDepositAmount, type QrDeposit, type WalletSummary } from '@/api/wallet';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { TokenIcon } from '@/components/shared/markets/market-graphics';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont, InterFont } from '@/constants/fonts';
import { WalletPalette as W } from '@/constants/theme';

export const paymentStatus = { WAITING: 'Waiting for payment', CONFIRMING: 'Confirming on Solana', CONFIRMED: 'Funds added', EXPIRED: 'Payment request expired' };
const failureCopy: Record<string, string> = {
  wrong_amount: 'A different amount was received and wasn’t credited. Keep the transaction signature for support.',
  wrong_mint: 'A different token was received and wasn’t credited. Use the test token shown in the payment details.',
  wrong_destination: 'The detected transaction did not pay this request.',
  transaction_failed: 'The transaction failed on Solana. No funds were added.',
  already_credited: 'That transaction has already been credited.',
};

export function QrDepositPanel({ summary, creating, serviceError, selectedId, onSelect, onCreate, onRefresh }: {
  summary: WalletSummary | null; creating: boolean; serviceError: string | null;
  selectedId: string | null; onSelect: (id: string | null) => void;
  onCreate: (amount: string) => Promise<QrDeposit>; onRefresh: () => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [info, setInfo] = useState(false);
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
  const qrSize = Math.min(252, Math.max(120, width - 116));
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
  async function share() {
    if (!deposit || !payable || Date.parse(deposit.expiresAt) <= Date.now()) return;
    setError(null);
    try {
      await Share.share({ title: 'Add funds to Tradble', message: `Send ${formatPaymentAmount(deposit.amount)} Test USDC on Solana devnet to my Tradble balance using this payment link:\n${deposit.paymentUrl}` });
    } catch { setError('Couldn’t open sharing. Try copying the payment link instead.'); }
  }
  function changeAmount() {
    setAmount(deposit?.amount ?? ''); setEditing(true); setError(null); setCopiedId(null); onSelect(null);
  }
  const token = deposit?.token ?? summary?.token;
  return <View style={styles.panel} testID="qr-deposit-panel">
    <View style={styles.networkRow}>
      <View style={styles.networkPill}><View style={styles.networkDot} /><Text style={styles.network}>Solana devnet</Text></View>
      <AuthButton onPress={() => setInfo(true)} accessibilityRole="button" accessibilityLabel="About receiving funds" style={styles.infoButton} testID="receive-info"><Info size={21} color={W.selectedInk} /></AuthButton>
    </View>
    {!summary || !summary.enabled ? <View style={styles.empty}>
      {!serviceError && !summary ? <ActivityIndicator color={W.selectedInk} /> : <ArrowDownLeft size={32} color={W.selectedInk} />}
      <Text style={styles.body}>{!summary ? serviceError ? 'Your funding account is unavailable.' : 'Loading your account…' : 'Devnet funding will be available once the server is configured.'}</Text>
      {serviceError ? <AuthButton onPress={() => { void onRefresh(); }} accessibilityRole="button" style={styles.primary}><Text style={styles.primaryText}>Try again</Text></AuthButton> : null}
    </View> : deposit ? <>
      <View style={styles.amountHeading}>
        <Text style={styles.eyebrow}>{deposit.status === 'CONFIRMED' ? 'Added to your balance' : 'Receive Test USDC'}</Text>
        <Text style={styles.amount} adjustsFontSizeToFit numberOfLines={1}>{formatPaymentAmount(deposit.status === 'CONFIRMED' ? deposit.creditedAmount : deposit.amount)}<Text style={styles.currency}> USDC</Text></Text>
        {payable ? <AuthButton onPress={changeAmount} accessibilityRole="button" style={styles.textButton}><Text style={styles.link}>Change amount</Text></AuthButton> : null}
      </View>
      <View style={styles.card}>
        {payable ? <View style={styles.qr} accessible accessibilityLabel={`Payment QR for ${deposit.amount} Test USDC on Solana devnet`} testID="deposit-payment-qr">
          <QRCode value={deposit.paymentUrl} size={qrSize} quietZone={16} color={W.receiveQrInk} backgroundColor={W.white} ecl="M" />
        </View> : <View style={styles.finished}>
          {deposit.status === 'CONFIRMED' ? <CheckCircle2 size={64} strokeWidth={1.4} color={W.heroPositive} /> : <ArrowDownLeft size={56} strokeWidth={1.4} color={W.heroSecondary} />}
          <Text style={styles.finishedTitle}>{deposit.status === 'CONFIRMED' ? 'You’re all set' : deposit.status === 'CONFIRMING' ? 'Payment on its way' : 'This request has ended'}</Text>
        </View>}
        <View style={styles.cardFooter}>
          <View style={styles.cardCopy}><Text style={styles.cardTitle}>Tradble balance</Text><Text style={styles.cardCaption}>Test USDC · Solana</Text></View>
          <TokenIcon symbol="USDC" size={36} />
        </View>
      </View>
      <View style={styles.status} accessibilityLiveRegion="polite">
        {deposit.status === 'CONFIRMED' ? <Check size={16} color={W.gain} /> : <View style={[styles.statusDot, deposit.status === 'CONFIRMING' && styles.confirmingDot]} />}
        <Text style={styles.statusText}>{!payable && deposit.status === 'WAITING' ? paymentStatus.EXPIRED : paymentStatus[deposit.status]}</Text>
      </View>
      <Text style={styles.helper}>{payable ? 'Scan from another wallet to add funds.\nYour balance updates automatically.' : deposit.status === 'CONFIRMED' ? 'Ready to trade or allocate to a Captain.' : deposit.status === 'CONFIRMING' ? 'You can close this screen. We’ll keep checking.' : 'Already sent? We’ll still check your payment.'}</Text>
      {payable ? <View style={styles.actions}>
        <AuthButton onPress={() => { void copy(); }} accessibilityRole="button" accessibilityLabel="Copy payment link" style={styles.action} testID="receive-copy"><Copy size={19} color={W.ink} /><Text style={styles.actionText}>{copiedId === deposit.id ? 'Copied' : 'Copy'}</Text></AuthButton>
        <AuthButton onPress={() => { void share(); }} accessibilityRole="button" accessibilityLabel="Share payment link" style={[styles.action, styles.shareAction]} testID="receive-share"><Share2 size={19} color={W.white} /><Text style={[styles.actionText, styles.shareText]}>Share</Text></AuthButton>
      </View> : <AuthButton onPress={changeAmount} accessibilityRole="button" style={styles.primary}><Text style={styles.primaryText}>Receive more funds</Text></AuthButton>}
    </> : <View style={styles.entry}>
      <View style={styles.entryIcon}><ArrowDownLeft size={28} color={W.selectedInk} strokeWidth={1.6} /></View>
      <Text style={styles.entryTitle}>A little fuel for\nyour next move.</Text>
      <Text style={styles.helper}>Add Test USDC from another wallet.\nHow much would you like to receive?</Text>
      <View style={styles.amountField}>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" accessibilityLabel="Deposit amount in test USDC" placeholder="0" placeholderTextColor={W.secondary} maxLength={14} editable={!creating} style={styles.input} testID="deposit-amount" />
        <Text style={styles.fieldCurrency}>USDC</Text>
      </View>
      <Text style={styles.helper}>1–1,000,000 USDC · Up to 6 decimals</Text>
      <AuthButton onPress={() => { void create(); }} disabled={creating || !validDepositAmount(amount.trim())} accessibilityRole="button" style={[styles.primary, (creating || !validDepositAmount(amount.trim())) && styles.disabled]} testID="deposit-create-qr">
        {creating ? <ActivityIndicator color={W.white} /> : <Text style={styles.primaryText}>Continue</Text>}
      </AuthButton>
    </View>}
    {deposit?.lastError ? <Text accessibilityRole="alert" style={styles.error}>{failureCopy[deposit.lastError] ?? 'A transaction could not be matched. No funds were added for it.'}</Text> : null}
    {error || serviceError ? <Text accessibilityRole="alert" style={styles.error}>{error ?? 'Connection interrupted. Payment checks will resume automatically.'}</Text> : null}
    <Text style={styles.footnote}>Test funds only · No real monetary value</Text>
    <DashboardSheet visible={info} title="Receiving funds" onClose={() => setInfo(false)} footer={<AuthButton onPress={() => setInfo(false)} accessibilityRole="button" style={styles.primary}><Text style={styles.primaryText}>Got it</Text></AuthButton>}>
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
  panel: { width: '100%', maxWidth: 380, alignSelf: 'center', gap: 18 },
  networkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  networkPill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: W.receivePill, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9 },
  networkDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: W.usdc },
  network: { fontFamily: InterFont.medium, fontSize: 12, color: W.selectedInk },
  infoButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: W.surface },
  amountHeading: { alignItems: 'center', gap: 5, paddingTop: 4 },
  eyebrow: { fontFamily: InterFont.medium, fontSize: 13, color: W.secondary },
  amount: { fontFamily: BrandFont.editorial, fontSize: 42, lineHeight: 52, color: W.ink, maxWidth: '100%' },
  currency: { fontFamily: InterFont.medium, fontSize: 16 },
  textButton: { minHeight: 36, paddingHorizontal: 12, justifyContent: 'center' },
  link: { fontFamily: InterFont.medium, fontSize: 13, color: W.selectedInk },
  card: { backgroundColor: W.receiveCard, borderRadius: 28, padding: 20, gap: 22, boxShadow: W.heroShadow },
  qr: { alignSelf: 'center', borderRadius: 18, overflow: 'hidden', backgroundColor: W.white },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardCopy: { flex: 1, gap: 5 },
  cardTitle: { fontFamily: InterFont.semiBold, fontSize: 16, color: W.heroInk },
  cardCaption: { fontFamily: InterFont.regular, fontSize: 12, color: W.heroSecondary },
  status: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: W.secondary },
  confirmingDot: { backgroundColor: W.usdc },
  statusText: { fontFamily: InterFont.medium, fontSize: 13, color: W.selectedInk },
  helper: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 19, color: W.secondary, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  action: { flex: 1, minHeight: 54, borderRadius: 20, backgroundColor: W.receivePill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  actionText: { fontFamily: InterFont.semiBold, fontSize: 15, color: W.ink },
  shareAction: { backgroundColor: W.receiveCard }, shareText: { color: W.white },
  primary: { minHeight: 54, borderRadius: 20, backgroundColor: W.receiveCard, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primaryText: { fontFamily: InterFont.semiBold, fontSize: 15, color: W.white },
  disabled: { opacity: 0.4 },
  entry: { gap: 22, paddingTop: 36, paddingBottom: 20 },
  entryIcon: { width: 64, height: 64, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: W.receivePill },
  entryTitle: { fontFamily: BrandFont.editorial, fontSize: 37, lineHeight: 41, color: W.ink, textAlign: 'center' },
  amountField: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: W.border, paddingVertical: 12, marginTop: 12 },
  input: { flex: 1, minWidth: 0, minHeight: 56, color: W.ink, fontFamily: InterFont.medium, fontSize: 32, paddingHorizontal: 8 },
  fieldCurrency: { fontFamily: InterFont.medium, fontSize: 15, color: W.secondary },
  finished: { minHeight: 204, alignItems: 'center', justifyContent: 'center', gap: 20 },
  finishedTitle: { fontFamily: InterFont.medium, fontSize: 17, color: W.heroInk, textAlign: 'center' },
  empty: { minHeight: 300, justifyContent: 'center', alignItems: 'center', gap: 20 },
  footnote: { fontFamily: InterFont.regular, fontSize: 11, color: W.secondary, textAlign: 'center', marginTop: 6 },
  error: { fontFamily: InterFont.regular, fontSize: 13, color: W.error, lineHeight: 19, textAlign: 'center' },
  infoContent: { gap: 18 },
  body: { fontFamily: InterFont.regular, fontSize: 15, lineHeight: 21, color: W.selectedInk },
  tokenDetails: { padding: 16, borderRadius: 18, backgroundColor: W.surface, gap: 8 },
  detailLabel: { fontFamily: InterFont.medium, fontSize: 12, color: W.secondary },
  mint: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 19, color: W.ink },
});
