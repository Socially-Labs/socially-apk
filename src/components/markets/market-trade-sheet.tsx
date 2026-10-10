import { orderProgressMessage } from '@/api/order-progress';
import { marketTradeAccess } from '@/api/market-trade-access';
import { useActiveMarket } from "@/hooks/use-active-market";
import { ArrowRight, Bookmark, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Text, View } from 'react-native';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { AuthButton } from '@/components/shared/motion';
import type { Token, Preview, Intent, TradingContext, marketsApi } from '@/api/markets';
import { formatUsdc } from '@/api/wallet';
import { tradeAmountDisplay, tradeQuoteFresh, tradeQuoteSpread } from '@/api/trade-quote';
import { useMarketTradeQuote } from '@/hooks/use-market-trade-quote';
import { usePaperOrder } from '@/hooks/use-paper-order';
import { DiscoverPalette as D } from '@/constants/theme';
import { OrbitTrade } from './market-orbit-trade';
import { orbitStyles as o } from './market-orbit-styles';
import { validTradeAmount } from './market-data';
import { marketStyles as s } from './market-styles';

export function TradeDetail({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return <View style={s.detailRow}><Text style={s.detailLabel}>{label}</Text><Text style={s.detailValue} testID={testID}>{value}</Text></View>;
}
export function MarketTradeSheet({ visible, token: initialToken, context: initialContext, hidden, saved, onSaved, onClose, onChooseVault, api, subject, onTerminal }: {
  visible: boolean; token: Token; context: TradingContext | null; hidden: boolean; saved: boolean;
  onSaved: () => void; onClose: () => void; onChooseVault: () => void; api: ReturnType<typeof marketsApi>; subject: string | null; onTerminal: () => void;
}) {
  const {token,context,error:trackingError}=useActiveMarket(api,initialToken,initialContext,subject,visible);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [input, setInput] = useState(''), [review, setReview] = useState<Preview | null>(null), [reviewing, setReviewing] = useState(false), [error, setError] = useState<string | null>(null);
  const previewAbort = useRef<AbortController | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const { allowed, reason, limit } = marketTradeAccess(token, context, subject, side, trackingError);
  const pending = context?.pending.find(item => item.instrumentId === token.instrumentId);
  const [restoredPendingId] = useState(pending?.id);
  const execution = usePaperOrder(api, subject, context?.fund.id ?? null, token.instrumentId, visible, onTerminal, restoredPendingId);
  const uncertain = !!execution.attempt && !execution.order, order = execution.order;
  const locked = execution.busy || uncertain || !!order;
  const decimals = side === 'BUY' ? 6 : token.decimals;
  const valid = validTradeAmount(input, decimals);
  const intent: Intent | null = token.instrumentId && valid ? side === 'BUY' ? { side, instrumentId: token.instrumentId, notionalUsdc: input } : { side, instrumentId: token.instrumentId, quantity: input } : null;
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const draft = useMarketTradeQuote(api, subject, context?.fund.id ?? null, intent, visible && !!allowed && valid && !locked && !review && !reviewing);
  const reviewFresh = tradeQuoteFresh(review, clock);
  const quote = review ?? (tradeQuoteFresh(draft.quote, clock) ? draft.quote : null);
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
  const confirm = () => { if (intent && review?.policy.allowed && tradeQuoteFresh(review) && allowed) void execution.submit(intent); };
  const close = () => { Keyboard.dismiss(); previewAbort.current?.abort(); onClose(); };
  const footer = order ? <View style={s.footerRow}>{order.status === 'PENDING' ? <AuthButton accessibilityRole="button" disabled={execution.busy} onPress={() => { void execution.cancel(); }} style={[s.secondary, { flex: 1 }]}><Text style={s.secondaryText}>Cancel order</Text></AuthButton> : null}<AuthButton accessibilityRole="button" onPress={close} style={[o.primary, { flex: 1 }]}><Text style={o.primaryText}>Close</Text></AuthButton></View>
    : uncertain ? <AuthButton accessibilityRole="button" disabled={execution.busy || !execution.ready} onPress={() => { if (execution.attempt) void execution.submit(execution.attempt.body); }} style={o.primary}><Text style={o.primaryText}>{execution.busy ? 'Confirming…' : 'Recover submission'}</Text></AuthButton>
      : review ? <View style={s.footerRow}><AuthButton accessibilityRole="button" disabled={execution.busy} onPress={() => setReview(null)} testID="market-review-back" style={[s.secondary, { flex: 1 }]}><Text style={s.secondaryText}>Back</Text></AuthButton><AuthButton accessibilityRole="button" testID="market-submit-trade" disabled={execution.busy || !execution.ready || !review.policy.allowed || !reviewFresh || !allowed} onPress={confirm} style={[o.primary, { flex: 2 }, (!review.policy.allowed || !reviewFresh || !allowed) && s.disabled]}><Text style={o.primaryText}>{execution.busy ? 'Submitting…' : 'Confirm paper trade'}</Text></AuthButton></View>
        : <AuthButton accessibilityRole="button" accessibilityLabel="Review paper trade" disabled={!allowed || !valid || reviewing || !execution.ready} testID="market-review-trade" onPress={() => { void preview(); }} style={[o.primary, (!allowed || !valid || reviewing || !execution.ready) && s.disabled]}><Text style={o.primaryText}>{reviewing ? 'Getting estimate…' : 'Review trade'}</Text><ArrowRight size={19} color="#FFFFFF" /></AuthButton>;
  const title = order ? `Order ${order.status.toLowerCase().replaceAll('_', ' ')}` : review ? 'Review trade' : `Trade ${token.symbol}`;
  const balance = side === 'BUY' ? context?.cashUsdc : context?.holdings.find(item => item.instrumentId === token.instrumentId)?.quantity ?? (context ? '0' : null);
  return <DashboardSheet visible={visible} title={title} onClose={close} footer={footer}
    header={<View style={o.header}><Text accessibilityRole="header" numberOfLines={1} style={o.title}>{title}</Text>
      <View style={o.paper}><Text style={o.paperText}>Paper</Text></View>
      <AuthButton accessibilityRole="button" accessibilityLabel="Close trade" onPress={close} style={o.iconButton} testID="market-trade-close"><X size={22} color={D.ink} /></AuthButton>
    </View>}>
    {order ? <View testID="market-order-status"><Text style={s.sectionTitle}>{order.status.replaceAll('_', ' ')}</Text>
      <Text style={s.label}>{order.status === 'PENDING' ? orderProgressMessage(order.execution) : order.reject_reason ?? 'Order processed.'}</Text>
      {order.quantity ? <TradeDetail label="Filled quantity" value={`${order.quantity} ${token.symbol}`} /> : null}
      {order.fee_usdc ? <TradeDetail label="Actual simulated fee" value={`${formatUsdc(order.fee_usdc)} USDC`} /> : null}
    </View> : uncertain ? <View style={s.notice}><Text style={s.noticeText}>The submission needs confirmation. Recover it before creating another trade.</Text></View> : <>
      <OrbitTrade token={token} side={side} input={input} quote={quote} loading={draft.loading} balance={hidden ? '••••' : tradeAmountDisplay(balance)}
        disabled={locked || reviewing} canMax={!!allowed} reviewing={!!review} detailsOpen={detailsOpen}
        onSide={item => { setSide(item); edit(''); }} onInput={edit}
        onMax={() => edit(side === 'BUY' ? limit?.maxBuyNotionalUsdc ?? '' : limit?.maxSellQuantity ?? '')}
        onDetails={() => setDetailsOpen(value => !value)}>
        <TradeDetail label="Vault" value={context?.fund.name ?? '—'} />
        <TradeDetail label="Market price" value={quote ? `${tradeAmountDisplay(quote.estimate.marketPriceUsdc)} USDC` : '—'} />
        <TradeDetail label="Simulated fill price" value={quote ? `${tradeAmountDisplay(quote.estimate.fillPriceUsdc)} USDC` : '—'} />
        <TradeDetail label="Spread + impact (fixed model)" value={tradeQuoteSpread(quote)} />
        <TradeDetail label="Simulated fee" value={quote ? `${tradeAmountDisplay(quote.estimate.feeUsdc)} USDC` : '—'} />
        <TradeDetail label="Network fee" value="None · paper trade" />
        <TradeDetail label="Minimum received" value="Not guaranteed" />
        <Text style={s.label}>Up to {decimals} decimal places. Estimates do not reserve balance or lock a price.</Text>
        <AuthButton accessibilityRole="button" disabled={!subject} accessibilityLabel={saved ? `Unsave ${token.symbol}` : `Save ${token.symbol}`} testID="market-save-token" onPress={onSaved} style={[s.currency, { minHeight: 44 }]}>
          <Bookmark size={17} color={D.accent} fill={saved ? D.accent : 'transparent'} /><Text style={s.secondaryText}>{saved ? 'Saved market' : 'Save market'}</Text>
        </AuthButton>
      </OrbitTrade>
      {quote && !quote.policy.allowed ? <Text accessibilityRole="alert" style={s.error}>Trade denied: {quote.policy.reason}</Text> : null}
      {review && !reviewFresh ? <Text accessibilityRole="alert" style={s.error}>Estimate expired. Go back and review again.</Text> : null}
      {review ? <View style={s.notice}><Text style={s.noticeText}>Paper trade only. The final fill uses a later market price and may differ.</Text></View> : null}
    </>}
    {reason ? <Text style={s.error}>{reason}</Text> : null}
    {context?.testActivationAllowed && context.fund.phase === 'FUNDRAISING' ? <AuthButton accessibilityRole="button" disabled={activating} testID="market-start-test-trading" style={s.secondary} onPress={() => {
      setActivating(true);setError(null);
      void api.startTestTrading(context.fund.id).then(onTerminal).catch(e=>setError(e instanceof Error?e.message:'Could not start test trading.')).finally(()=>setActivating(false));
    }}><Text style={s.secondaryText}>{activating ? 'Starting test trading…' : 'Start test trading'}</Text></AuthButton> : null}
    {reason && subject && !locked && (!context || context.fund.status === 'COMPLETED' || context.fund.phase && context.fund.phase !== 'ACTIVE' || limit?.reason === 'asset_not_allowed') ?
      <AuthButton accessibilityRole="button" onPress={() => { Keyboard.dismiss(); previewAbort.current?.abort(); onChooseVault(); }} testID="market-trade-choose-vault" style={s.secondary}><Text style={s.secondaryText}>Choose trading vault</Text></AuthButton> : null}
    {error || execution.error || (!review && draft.error) ? <Text accessibilityRole="alert" style={s.error}>{error ?? execution.error ?? draft.error}</Text> : null}
  </DashboardSheet>;
}
