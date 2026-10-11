import { ShipLoader } from '@/components/shared/refresh/ship-loader';
import { useState } from 'react';
import { ActivityIndicator, Keyboard, Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowDownUp, Check, ChevronDown, ExternalLink, X } from 'lucide-react-native';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { AuthButton } from '@/components/shared/motion';
import { TokenIcon } from '@/components/shared/markets/market-graphics';
import { BrandFont, InterFont } from '@/constants/fonts';
import { WalletPalette as W } from '@/constants/theme';
import { SwapSlideControl } from './swap-slide-control';
import { formatBalance } from './format-balance';
import { feeToken } from '@/api/swaps';
import { fromUnits } from '@/api/solana-swap';
import { swapDecimals, type SwapToken } from '@/constants/solana-network';
import type { useWalletSwap } from '@/hooks/use-wallet-swap';
import type { useSolanaBalance } from '@/hooks/use-solana-balance';

export function SwapSheet({ visible, swap, balances, balanceVisible, onClose }: {
  visible: boolean; swap: ReturnType<typeof useWalletSwap>; balances: ReturnType<typeof useSolanaBalance>; balanceVisible: boolean; onClose: () => void;
}) {
  const [picker, setPicker] = useState<'input' | 'output' | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const review = swap.phase === 'review';
  const confirmed = swap.phase === 'confirmed';
  const pending = swap.phase === 'pending';
  const needsRefresh = swap.phase === 'failed' && swap.expired && !swap.locked;
  const disabled = !swap.canSubmit || swap.expired;
  const inputBalance = swap.input === 'SOL' ? balances.amount : balances.usdcAmount;
  const outputBalance = swap.output === 'SOL' ? balances.amount : balances.usdcAmount;
  const output = swap.quote ? fromUnits(swap.filledOutputRaw ?? swap.quote.outputAmount, swapDecimals(swap.output)) : '0';
  const label = swap.phase === 'preparing' ? 'Checking swap…' : swap.phase === 'signing' ? 'Approve in your wallet…' : swap.phase === 'sending' ? 'Sending swap…' : 'Confirming swap…';
  const title = confirmed ? 'Swap complete' : review ? 'Review swap' : 'Swap';
  function close() { if (!swap.busy) { setPicker(null); setDetailsOpen(false); Keyboard.dismiss(); onClose(); } }
  function choose(token: SwapToken) {
    if ((picker === 'input' ? swap.input : swap.output) !== token) swap.reverse();
    setPicker(null);
  }
  async function openExplorer() {
    if (!swap.signature) return;
    try { setLinkError(null); await Linking.openURL(`https://explorer.solana.com/tx/${swap.signature}?cluster=devnet`); }
    catch { setLinkError('Couldn’t open the explorer. Please try again.'); }
  }
  return <DashboardSheet visible={visible} title={title} onClose={close}
    header={<View style={s.header}><Text accessibilityRole="header" style={s.title}>{title}</Text><AuthButton accessibilityRole="button" accessibilityLabel="Close swap" disabled={swap.busy} onPress={close} style={s.close}><X size={22} color={W.ink} /></AuthButton></View>}
    footer={<View style={s.footer}>
      {swap.busy ? <View style={s.working} accessibilityRole="progressbar" accessibilityLabel={label}>{swap.phase === 'signing' ? <ActivityIndicator color={W.ink} /> : null}<Text style={s.submitText}>{label}</Text></View> : confirmed || pending || needsRefresh ?
        <AuthButton testID="swap-submit" accessibilityRole="button" onPress={() => { if (confirmed) swap.reset(); else if (pending) void swap.submit(); else swap.refreshQuote(); }} style={s.submit}><Text style={s.submitText}>{confirmed ? 'Swap again' : pending ? 'Check confirmation' : 'Try again'}</Text></AuthButton> :
        <SwapSlideControl key={`${swap.phase}:${swap.input}`} label={review ? 'Slide to confirm' : 'Slide to swap'} disabled={disabled} onCommit={swap.submit} onDragChange={swap.pauseQuoteUpdates} />}
      {review ? <AuthButton accessibilityRole="button" onPress={() => swap.edit(swap.amount)} style={s.textButton}><Text style={s.secondary}>Edit amount</Text></AuthButton> : null}
    </View>}>
    <View style={s.content} testID="wallet-swap-screen">
      {swap.busy && swap.phase !== 'signing' ? <ShipLoader label={label} compact active={visible}/> : null}
      {confirmed ? <View style={s.success} accessibilityRole="alert"><View style={s.successIcon}><Check size={26} color={W.ink} /></View><Text style={s.successTitle}>Your swap is complete</Text><Text style={s.copy}>Your wallet balances are refreshing. The swapped assets are in your wallet.</Text></View> : null}
      {!((pending || confirmed) && !swap.quote) ? <View style={s.panels}>
        <View style={s.panel}>
          <View style={s.row}><Text style={s.caption}>Pay</Text><AuthButton accessibilityRole="button" accessibilityLabel={`Use maximum ${swap.input}`} disabled={swap.locked || review || inputBalance === null} onPress={swap.max} style={s.max}><Text style={s.maxText}>Max</Text></AuthButton></View>
          <View style={s.amountRow}>
            <TextInput testID="swap-input" accessibilityLabel={`Amount of ${swap.input} to swap`} value={swap.amount} onChangeText={swap.edit} editable={!swap.locked && !review} keyboardType="decimal-pad" returnKeyType="done" submitBehavior="blurAndSubmit" onSubmitEditing={Keyboard.dismiss} inputMode="decimal" placeholder="0" placeholderTextColor={W.secondary} maxLength={30} style={s.amount} />
            <AuthButton accessibilityRole="button" accessibilityLabel={`Pay token, ${swap.input}`} disabled={swap.locked || review} onPress={() => setPicker(picker === 'input' ? null : 'input')} style={s.token}><TokenIcon symbol={swap.input} size={25} /><Text style={s.tokenText}>{swap.input}</Text><ChevronDown size={13} color={W.ink} /></AuthButton>
          </View>
          <Text style={s.balance} accessibilityLabel={balanceVisible && inputBalance !== null ? `Balance: ${inputBalance} ${swap.input}` : undefined}>Balance: {!balanceVisible ? '••••' : formatBalance(inputBalance)} {swap.input}</Text>
        </View>
        <AuthButton testID="swap-reverse" accessibilityRole="button" accessibilityLabel="Reverse swap direction" disabled={swap.locked || review} onPress={() => { setPicker(null); swap.reverse(); }} style={s.reverse}><ArrowDownUp size={22} color={W.ink} /></AuthButton>
        <View style={s.panel}>
          <View style={s.receiveCaption}><Text style={s.caption}>{confirmed ? 'Received' : 'Receive'}</Text>{!confirmed ? <Text style={s.estimated}>Estimated</Text> : null}</View>
          <View style={s.amountRow}>
            <Text testID="swap-output" style={s.output} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{!swap.quote && swap.quoting ? '…' : output}</Text>
            <AuthButton accessibilityRole="button" accessibilityLabel={`Receive token, ${swap.output}`} disabled={swap.locked || review} onPress={() => setPicker(picker === 'output' ? null : 'output')} style={s.token}><TokenIcon symbol={swap.output} size={25} /><Text style={s.tokenText}>{swap.output}</Text><ChevronDown size={13} color={W.ink} /></AuthButton>
          </View>
          <Text style={s.balance} accessibilityLabel={balanceVisible && outputBalance !== null ? `Balance: ${outputBalance} ${swap.output}` : undefined}>Balance: {!balanceVisible ? '••••' : formatBalance(outputBalance)} {swap.output}</Text>
        </View>
      </View> : pending ? <Text style={s.copy}>Checking your previous swap</Text> : null}
      {picker && !swap.locked && !review ? <View style={s.picker} testID="swap-token-picker"><Text style={s.detailLabel}>Select {picker === 'input' ? 'pay' : 'receive'} token</Text>{(['SOL', 'USDC'] as const).map(token => <AuthButton key={token} accessibilityRole="button" accessibilityLabel={`Select ${token}`} onPress={() => choose(token)} style={s.pickRow}><TokenIcon symbol={token} size={30} /><View style={s.grow}><Text style={s.detailValue}>{token}</Text><Text style={s.secondary}>{token === 'USDC' ? 'USD Coin' : 'Solana'}</Text></View>{(picker === 'input' ? swap.input : swap.output) === token ? <Check size={18} color={W.ink} /> : null}</AuthButton>)}</View> : null}
      {swap.quote ? <View style={s.details} testID="swap-quote-details">
        <View style={s.row}><Text style={s.detailLabel}>Minimum received</Text><Text style={s.detailValue}>{fromUnits(swap.quote.minimumOutput, swapDecimals(swap.output))} {swap.output}</Text></View>
        <View style={s.row}><Text style={s.detailLabel}>Price impact</Text><Text style={[s.detailValue, swap.quote.priceImpact > 5 && s.error]}>{swap.quote.priceImpact.toFixed(2)}%</Text></View>
        <View style={s.row}><Text style={s.detailLabel}>Slippage</Text><Text style={s.detailValue}>{(swap.quote.slippageBps / 100).toFixed(2)}%</Text></View>
        <AuthButton accessibilityRole="button" accessibilityLabel="Swap details" accessibilityState={{ expanded: detailsOpen || review }} onPress={() => setDetailsOpen(v => !v)} style={s.detailsToggle}><Text style={s.secondary}>Swap details</Text><ChevronDown size={14} color={W.secondary} /></AuthButton>
        {detailsOpen || review ? <>
        <View style={s.row}><Text style={s.detailLabel}>Swap fees (included)</Text><Text style={s.detailValue}>{swap.quote.venueFees === null ? 'Unavailable from venue' : swap.quote.venueFees.map(fee => { const token = feeToken(fee.mint); return token ? `${fromUnits(fee.amountRaw, swapDecimals(token))} ${token}` : 'Unavailable from venue'; }).join(' + ')}</Text></View>
        {swap.fees ? <>
          <View style={s.row}><Text style={s.detailLabel}>Estimated network fee</Text><Text style={s.detailValue}>{fromUnits(swap.fees.networkFeeLamports, 9)} SOL</Text></View>
          <View style={s.row}><Text style={s.detailLabel}>Priority fee (included above)</Text><Text style={s.detailValue}>{fromUnits(swap.fees.priorityFeeLamports, 9)} SOL</Text></View>
          <View style={s.row}><Text style={s.detailLabel}>New account rent</Text><Text style={s.detailValue}>{fromUnits(swap.fees.accountRentLamports, 9)} SOL</Text></View>
        </> : <Text style={s.secondary}>Fees shown before signing.</Text>}
        <View style={s.row}><Text style={s.detailLabel}>Route</Text><Text style={s.detailValue}>Raydium · {swap.quote.hops === 1 ? 'Direct' : `${swap.quote.hops} pools`}</Text></View>
        </> : <Text style={s.feeNote}>Fees shown before signing</Text>}
      </View> : null}
      {swap.validation || swap.error ? <View style={s.errorBox}><Text testID="swap-error" accessibilityRole="alert" style={s.error}>{swap.error ?? swap.validation}</Text>{!swap.locked ? <AuthButton accessibilityRole="button" onPress={swap.refreshQuote} style={s.textButton}><Text style={s.detailValue}>Try again</Text></AuthButton> : null}</View> : null}
      {swap.signature ? <AuthButton testID="swap-explorer" accessibilityRole="link" accessibilityLabel="View swap transaction on Solana explorer" onPress={() => { void openExplorer(); }} style={s.explorer}><Text style={s.detailValue}>{pending ? 'View pending transaction' : 'View transaction'}</Text><ExternalLink size={15} color={W.ink} /></AuthButton> : null}
      {linkError ? <Text accessibilityRole="alert" style={s.error}>{linkError}</Text> : null}
      <Text style={s.note}>Keep 0.01 SOL for fees and account rent.</Text>
    </View>
  </DashboardSheet>;
}
const s = StyleSheet.create({
  content: { gap: 16 }, footer: { gap: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { fontFamily: BrandFont.editorial, fontSize: 40, lineHeight: 46, color: W.ink, flex: 1 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: W.surface, alignItems: 'center', justifyContent: 'center' },
  receiveCaption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  estimated: { fontFamily: InterFont.medium, fontSize: 11, color: W.gain },
  detailsToggle: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  feeNote: { fontFamily: InterFont.regular, color: W.secondary, fontSize: 11, paddingTop: 10, borderTopWidth: 1, borderTopColor: W.balanceLine },
  working: { minHeight: 64, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  panels: { gap: 18 }, panel: { backgroundColor: W.receiveGlass.surface, borderWidth: 1, borderColor: W.receiveGlass.border, borderRadius: 26, padding: 18, minHeight: 142, gap: 9 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  caption: { color: W.secondary, fontFamily: InterFont.regular, fontSize: 13 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46 },
  amount: { flex: 1, minWidth: 0, fontFamily: BrandFont.editorial, fontSize: 46, color: W.ink, padding: 0, fontVariant: ['tabular-nums'] },
  output: { flex: 1, fontFamily: BrandFont.editorial, fontSize: 46, color: W.ink, fontVariant: ['tabular-nums'] },
  token: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, borderRadius: 24, backgroundColor: W.surface },
  tokenText: { color: W.ink, fontFamily: InterFont.semiBold, fontSize: 13 },
  balance: { color: W.secondary, fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16 },
  max: { minWidth: 44, minHeight: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: W.selected, justifyContent: 'center', alignItems: 'center' }, maxText: { fontFamily: InterFont.semiBold, fontSize: 11, color: W.ink },
  reverse: { zIndex: 1, width: 48, height: 48, borderRadius: 24, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginVertical: -33, borderWidth: 1, borderColor: W.receiveGlass.border, backgroundColor: W.balanceIcon },
  details: { gap: 12, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: W.border, backgroundColor: W.surface }, detailLabel: { fontFamily: InterFont.regular, color: W.secondary, fontSize: 12, flexShrink: 1 },
  detailValue: { fontFamily: InterFont.medium, color: W.ink, fontSize: 12, flexShrink: 1, textAlign: 'right' },
  secondary: { fontFamily: InterFont.regular, color: W.secondary, fontSize: 11, lineHeight: 16 },
  refresh: { flexDirection: 'row', gap: 6, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  note: { fontFamily: InterFont.regular, color: W.secondary, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  submit: { minHeight: 64, borderRadius: 32, backgroundColor: W.balanceIcon, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 12 },
  submitText: { fontFamily: InterFont.semiBold, fontSize: 14, color: W.ink }, disabled: { opacity: 0.5 },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  picker: { backgroundColor: W.surface, padding: 14, borderRadius: 20, gap: 4 }, pickRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10 }, grow: { flex: 1, alignItems: 'flex-start', gap: 3 },
  errorBox: { padding: 12, borderRadius: 16, backgroundColor: W.muted }, error: { fontFamily: InterFont.medium, color: W.error, fontSize: 12, lineHeight: 18 },
  explorer: { flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  success: { alignItems: 'center', gap: 10, paddingVertical: 12 }, successIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: W.gainSurface, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontFamily: InterFont.semiBold, fontSize: 18, color: W.ink }, copy: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 20, color: W.secondary, textAlign: 'center' },
});
