import { Bookmark } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Text, TextInput, View } from 'react-native';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { AuthButton } from '@/components/shared/motion';
import type { Token, Period, Preview, Intent, TradingContext, marketsApi } from '@/api/markets';
import { formatUsdc } from '@/api/wallet';
import { marketChange, marketPeriods, marketPrice } from '@/constants/captain-markets';
import { useMarketHistory } from '@/hooks/use-market-history';
import { usePaperOrder } from '@/hooks/use-paper-order';
import { DiscoverPalette as D } from '@/constants/theme';
import { MarketChart, MarketTokenIcon } from './market-graphics';
import { periodChange, validTradeAmount } from './market-data';
import { marketStyles as s } from './market-styles';

export function TradeDetail({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return <View style={s.detailRow}><Text style={s.detailLabel}>{label}</Text><Text style={s.detailValue} testID={testID}>{value}</Text></View>;
}
export function MarketTradeSheet({ visible, token, context, hidden, saved, initialPeriod, onSaved, onClose, api, subject, onTerminal }: {
  visible: boolean; token: Token; context: TradingContext | null; hidden: boolean; saved: boolean; initialPeriod: Period;
  onSaved: () => void; onClose: () => void; api: ReturnType<typeof marketsApi>; subject: string | null; onTerminal: () => void;
}) {
  const [period, setPeriod] = useState<Period>(initialPeriod), [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [input, setInput] = useState(''), [review, setReview] = useState<Preview | null>(null), [reviewing, setReviewing] = useState(false), [error, setError] = useState<string | null>(null);
  const previewAbort = useRef<AbortController | null>(null);
  const { history, error: historyError, loading: historyLoading } = useMarketHistory(api, token.mint, token.tracked, period, token.price, visible);
  const change = periodChange(token, period, history), limit = context?.limits.find(item => item.instrumentId === token.instrumentId);
  const pending = context?.pending.find(item => item.instrumentId === token.instrumentId);
  const [restoredPendingId] = useState(pending?.id);
  const execution = usePaperOrder(api, subject, context?.fund.id ?? null, token.instrumentId, visible, onTerminal, restoredPendingId);
  const uncertain = !!execution.attempt && !execution.order, order = execution.order;
  const locked = execution.busy || uncertain || !!order;
  const allowed = token.tradable && token.price?.status === 'CURRENT' && (side === 'BUY' ? limit?.canBuy : limit?.canSell);
  const decimals = side === 'BUY' ? 6 : token.decimals;
  const valid = validTradeAmount(input, decimals), unit = side === 'BUY' ? 'USDC' : token.symbol;
  const intent: Intent | null = token.instrumentId && valid ? side === 'BUY' ? { side, instrumentId: token.instrumentId, notionalUsdc: input } : { side, instrumentId: token.instrumentId, quantity: input } : null;
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const reviewFresh = review && clock - Date.parse(review.observedAt) <= 15000;
  useEffect(() => () => { previewAbort.current?.abort(); }, []);
  const edit = (value: string) => { previewAbort.current?.abort(); setReviewing(false); setInput(value); setReview(null); setError(null); };
  const preview = async () => {
    if (!context || !intent || !allowed || reviewing || locked) return;
    Keyboard.dismiss(); previewAbort.current?.abort(); const controller = new AbortController(); previewAbort.current = controller;
    setReviewing(true); setError(null);
    try { const result = await api.preview(context.fund.id, intent, controller.signal); if (!controller.signal.aborted) setReview(result); }
    catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Preview unavailable.'); }
    finally { if (!controller.signal.aborted) setReviewing(false); }
  };
  const confirm = () => { if (intent && review?.policy.allowed && reviewFresh && allowed) void execution.submit(intent); };
  const close = () => { Keyboard.dismiss(); previewAbort.current?.abort(); onClose(); };
  const reason = !subject ? 'Sign in to save markets and trade.' : !token.tradable ? 'This market is available to browse. Trading is not supported.' : !context ? 'Start or select a captain trial to trade.' : token.price?.status !== 'CURRENT' ? 'Waiting for a fresh market price.' : !allowed ? (limit?.reason ?? 'This action is unavailable for your vault.') : null;
  const footer = order ? <View style={s.footerRow}>{order.status === 'PENDING' ? <AuthButton accessibilityRole="button" disabled={execution.busy} onPress={() => { void execution.cancel(); }} style={[s.secondary, { flex: 1 }]}><Text style={s.secondaryText}>Cancel order</Text></AuthButton> : null}<AuthButton accessibilityRole="button" onPress={close} style={[s.primary, { flex: 1 }]}><Text style={s.primaryText}>Close</Text></AuthButton></View>
    : uncertain ? <AuthButton accessibilityRole="button" disabled={execution.busy || !execution.ready} onPress={() => { if (execution.attempt) void execution.submit(execution.attempt.body); }} style={s.primary}><Text style={s.primaryText}>{execution.busy ? 'Confirming…' : 'Recover submission'}</Text></AuthButton>
      : review ? <View style={s.footerRow}><AuthButton accessibilityRole="button" disabled={execution.busy} onPress={() => setReview(null)} testID="market-review-back" style={[s.secondary, { flex: 1 }]}><Text style={s.secondaryText}>Back</Text></AuthButton><AuthButton accessibilityRole="button" testID="market-submit-trade" disabled={execution.busy || !execution.ready || !review.policy.allowed || !reviewFresh || !allowed} onPress={confirm} style={[s.primary, { flex: 1 }, (!review.policy.allowed || !reviewFresh || !allowed) && s.disabled]}><Text style={s.primaryText}>{execution.busy ? 'Submitting…' : 'Confirm paper trade'}</Text></AuthButton></View>
        : <AuthButton accessibilityRole="button" accessibilityLabel="Review paper trade" disabled={!allowed || !valid || reviewing || !execution.ready} testID="market-review-trade" onPress={() => { void preview(); }} style={[s.primary, (!allowed || !valid || reviewing || !execution.ready) && s.disabled]}><Text style={s.primaryText}>{reviewing ? 'Getting estimate…' : 'Review paper trade'}</Text></AuthButton>;
  return <DashboardSheet visible={visible} title={order ? `Order ${order.status.toLowerCase().replaceAll('_', ' ')}` : review ? 'Review paper trade' : token.tradable ? `Trade ${token.symbol}` : token.symbol} onClose={close} footer={footer}>
    <Text style={s.context}>{context?.fund.name ?? 'Market details'} · Paper trading</Text>
    <View style={s.chartCard}><View style={s.chartHeading}><MarketTokenIcon symbol={token.symbol} tracked={token.tracked} size={30} /><View style={{ flex: 1 }}><Text style={s.symbol}>{token.symbol}</Text><Text style={s.chartPrice}>{token.price?.priceUsd ? marketPrice(Number(token.price.priceUsd)) : '—'}</Text></View><View style={{ alignItems: 'flex-end' }}><AuthButton accessibilityRole="button" disabled={!subject} accessibilityLabel={saved ? `Unsave ${token.symbol}` : `Save ${token.symbol}`} testID="market-save-token" onPress={onSaved} style={s.iconButton}><Bookmark size={18} color={D.accent} fill={saved ? D.accent : 'transparent'} /></AuthButton><Text style={[s.change, { color: change === null ? D.muted : Number(change) < 0 ? D.negative : D.positive }]}>{change === null ? '—' : marketChange(Number(change))} · {period}</Text></View></View>
      <MarketChart token={token} period={period} history={history} /><View style={s.periods}>{marketPeriods.map(item => <AuthButton key={item} accessibilityRole="button" testID={`market-chart-period-${item}`} onPress={() => setPeriod(item)} style={[s.period, item === period && s.selectedPeriod]}><Text style={[s.chipText, item === period && s.selectedChipText]}>{item}</Text></AuthButton>)}</View>
      <Text style={s.label}>{token.price?.status ?? 'UNAVAILABLE'}{token.price?.sourceAt ? ` · ${new Date(token.price.sourceAt).toLocaleTimeString()}` : ''} · USD</Text>{historyLoading ? <Text style={s.label}>Loading history…</Text> : historyError ? <Text style={s.label}>{historyError}</Text> : null}</View>
    {order ? <View testID="market-order-status"><Text style={s.sectionTitle}>{order.status.replaceAll('_', ' ')}</Text><Text style={s.label}>{order.status === 'PENDING' ? 'Waiting for a new market observation. The order can take up to two minutes.' : order.reject_reason ?? 'Order processed.'}</Text>{order.quantity ? <TradeDetail label="Filled quantity" value={`${order.quantity} ${token.symbol}`} /> : null}{order.fee_usdc ? <TradeDetail label="Actual simulated fee" value={`${formatUsdc(order.fee_usdc)} USDC`} /> : null}</View> : uncertain ? <View style={s.notice}><Text style={s.noticeText}>The submission needs confirmation. Recover it before creating another trade.</Text></View> : review ? <View testID="market-trade-review">
      <TradeDetail label="Vault" value={context?.fund.name ?? '—'} /><TradeDetail label={side === 'BUY' ? 'Spend' : 'Sell'} value={`${input} ${unit}`} />
      <TradeDetail label="Estimated receive" value={side === 'BUY' ? `${review.estimate.quantity} ${token.symbol}` : `${formatUsdc(review.estimate.cashChangeUsdc)} USDC`} testID="market-review-receive" />
      <TradeDetail label="Simulated fee" value={`${formatUsdc(review.estimate.feeUsdc)} USDC`} /><TradeDetail label="Simulated fill price" value={`${review.estimate.fillPriceUsdc} USDC`} />
      {!review.policy.allowed ? <Text style={s.error}>Trade denied: {review.policy.reason}</Text> : null}{!reviewFresh ? <Text style={s.error}>Estimate expired. Go back and review again.</Text> : null}
      <View style={s.notice}><Text style={s.noticeText}>This is a paper order using real market prices. The final fill uses a later observation; this estimate does not lock the price or reserve the balance.</Text></View>
    </View> : <View testID="market-trade-form"><View style={s.segments}>{(['BUY', 'SELL'] as const).map(item => <AuthButton key={item} accessibilityRole="button" disabled={locked} testID={`market-trade-${item.toLowerCase()}`} onPress={() => { setSide(item); edit(''); }} style={[s.segment, item === side && s.selectedSegment]}><Text style={[s.tabText, item === side && s.selectedTabText]}>{item === 'BUY' ? 'Buy' : 'Sell'}</Text></AuthButton>)}</View>
      <View style={s.inputBox}><View style={s.inputHeading}><Text style={s.label}>{side === 'BUY' ? 'Spend USDC' : `Sell ${token.symbol}`}</Text><AuthButton accessibilityRole="button" testID="market-trade-max" disabled={!allowed || locked} onPress={() => edit(side === 'BUY' ? limit?.maxBuyNotionalUsdc ?? '' : limit?.maxSellQuantity ?? '')} style={s.max}><Text style={s.secondaryText}>Max</Text></AuthButton></View><View style={s.inputRow}><TextInput accessibilityLabel={`Amount in ${unit}`} testID="market-trade-amount" value={input} onChangeText={edit} editable={!locked} keyboardType="decimal-pad" autoCorrect={false} maxLength={40} placeholder="0" placeholderTextColor={D.muted} style={s.amountInput} /><Text style={s.optionTitle}>{unit}</Text></View></View>
      <Text style={s.label}>Up to {decimals} decimal places · limits are estimates</Text>{context ? <TradeDetail label="Vault reserve" value={hidden ? '••••' : `${formatUsdc(context.cashUsdc)} USDC`} /> : null}</View>}
    {reason ? <Text style={s.error}>{reason}</Text> : null}{error || execution.error ? <Text accessibilityRole="alert" style={s.error}>{error ?? execution.error}</Text> : null}
    <Text style={s.sample}>Real market observations · simulated execution</Text>
  </DashboardSheet>;
}
