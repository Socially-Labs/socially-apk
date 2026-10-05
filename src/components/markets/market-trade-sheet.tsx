import { Bookmark } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, Text, TextInput, View } from 'react-native';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { AuthButton } from '@/components/shared/motion';
import type { CaptainVault } from '@/constants/captain-dashboard';
import { availableCash, marketChange, marketMoney, marketPeriods, marketPrice, maxTradeInput, previewTrade, tokenUnits, type MarketPeriod, type MarketToken, type TradeSide } from '@/constants/captain-markets';
import { DiscoverPalette as D } from '@/constants/theme';
import { MarketChart, MarketTokenIcon } from './market-graphics';
import { marketStyles as s } from './market-styles';

export function TradeDetail({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return <View style={s.detailRow}><Text style={s.detailLabel}>{label}</Text><Text style={s.detailValue} testID={testID}>{value}</Text></View>;
}

/** A reviewable UI prototype. No quote request, wallet signature or trade execution. */
export function MarketTradeSheet({ visible, token, vault, hidden, saved, initialPeriod, onSaved, onClose }: { visible: boolean; token: MarketToken; vault: CaptainVault; hidden: boolean; saved: boolean; initialPeriod: MarketPeriod; onSaved: () => void; onClose: () => void }) {
  const [period, setPeriod] = useState<MarketPeriod>(initialPeriod);
  const [side, setSide] = useState<TradeSide>('buy');
  const [input, setInput] = useState('1000');
  const [review, setReview] = useState(false);
  const quote = previewTrade(vault, token, side, input), change = token.changes[period];
  const receive = quote.error ? '—' : `${tokenUnits(quote.receive)} ${quote.outputSymbol}`;
  const close = () => { Keyboard.dismiss(); onClose(); };
  const switchSide = (next: TradeSide) => { if (side !== next) { setSide(next); setInput(next === 'buy' ? '1000' : ''); setReview(false); } };
  const exposure = hidden ? '•••• → ••••' : `${quote.before.toFixed(1)}% → ${quote.after.toFixed(1)}%`;
  const context = `${vault.name} · ${hidden ? 'Balances hidden' : `${marketMoney(availableCash(vault))} USDC available`}`;
  return <DashboardSheet visible={visible} title={review ? 'Review trade' : `Trade ${token.symbol}`} onClose={close} footer={review ? <View style={s.footerRow}>
    <AuthButton accessibilityRole="button" accessibilityLabel="Back to trade" testID="market-review-back" onPress={() => setReview(false)} style={[s.secondary, { flex: 1 }]}><Text style={s.secondaryText}>Back to trade</Text></AuthButton>
    <AuthButton accessibilityRole="button" accessibilityLabel="Done reviewing sample trade" testID="market-review-done" onPress={close} style={[s.primary, { flex: 1 }]}><Text style={s.primaryText}>Done</Text></AuthButton>
  </View> : <AuthButton accessibilityRole="button" accessibilityLabel="Review sample trade" accessibilityState={{ disabled: !!quote.error }} disabled={!!quote.error} testID="market-review-trade" onPress={() => { Keyboard.dismiss(); setReview(true); }} style={[s.primary, !!quote.error && s.disabled]}><Text style={s.primaryText}>Review trade</Text></AuthButton>}>
    <Text style={s.context} testID="market-trade-context">{context}</Text>
    {review ? <View testID="market-trade-review">
      <View style={[s.chartHeading, { marginBottom: 19 }]}><MarketTokenIcon symbol={token.symbol} size={40} /><View><Text style={s.sectionTitle}>{side === 'buy' ? 'Buy' : 'Sell'} {token.symbol}</Text><Text style={s.label}>Sample spot trade · Vault funds</Text></View></View>
      <TradeDetail label="Vault" value={vault.name} />
      <TradeDetail label={side === 'buy' ? 'Spend' : 'Sell'} value={`${tokenUnits(quote.amount)} ${quote.inputSymbol}`} />
      <TradeDetail label="Estimated receive" value={receive} testID="market-review-receive" />
      <TradeDetail label="Minimum receive" value={`${tokenUnits(quote.minimum)} ${quote.outputSymbol}`} />
      <View style={s.divider}>
        <TradeDetail label="Sample fee · 0.10%" value={marketMoney(quote.fee)} />
        <TradeDetail label="Price impact" value={`${quote.impact.toFixed(2)}%`} />
        <TradeDetail label="Slippage tolerance" value="0.50%" />
        <TradeDetail label={`${token.symbol} exposure`} value={exposure} />
        <TradeDetail label={`Remaining ${quote.inputSymbol}`} value={hidden ? '••••' : `${tokenUnits(quote.remaining)} ${quote.inputSymbol}`} />
      </View>
      <View style={s.notice}><Text style={s.noticeText}>Sample trade preview. No funds move, and your vault stays as it is.</Text></View>
    </View> : <View testID="market-trade-form">
      <View style={s.chartCard}>
        <View style={s.chartHeading}><MarketTokenIcon symbol={token.symbol} size={30} /><View style={{ flex: 1 }}><Text style={s.symbol}>{token.symbol}</Text><Text style={[s.chartPrice, { fontSize: 27, lineHeight: 31 }]}>{marketPrice(token.price)}</Text></View><View style={{ alignItems: 'flex-end' }}><AuthButton accessibilityRole="button" accessibilityLabel={saved ? `Remove ${token.symbol} from saved markets` : `Save ${token.symbol}`} accessibilityState={{ selected: saved }} testID="market-save-token" onPress={onSaved} style={s.iconButton}><Bookmark size={18} color={D.accent} fill={saved ? D.accent : 'transparent'} /></AuthButton><Text style={[s.change, { color: change < 0 ? D.negative : D.positive }]} testID="market-chart-change">{marketChange(change)} · {period}</Text></View></View>
        <MarketChart token={token} period={period} />
        <View style={s.periods}>{marketPeriods.map(item => <AuthButton key={item} testID={`market-chart-period-${item}`} accessibilityRole="button" accessibilityLabel={`Show ${item} price chart`} accessibilityState={{ selected: item === period }} onPress={() => setPeriod(item)} style={[s.period, item === period && s.selectedPeriod]}><Text style={[s.chipText, item === period && s.selectedChipText]}>{item}</Text></AuthButton>)}</View>
      </View>
      <View style={s.segments}>{(['buy', 'sell'] as const).map(item => <AuthButton key={item} accessibilityRole="button" accessibilityLabel={`${item === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`} accessibilityState={{ selected: side === item }} testID={`market-trade-${item}`} onPress={() => switchSide(item)} style={[s.segment, item === side && s.selectedSegment]}><Text style={[s.tabText, item === side && s.selectedTabText]}>{item === 'buy' ? 'Buy' : 'Sell'}</Text></AuthButton>)}</View>
      <View style={s.inputBox}>
        <View style={s.inputHeading}><Text style={s.label}>{side === 'buy' ? 'Spend' : 'Sell'}</Text><AuthButton accessibilityRole="button" accessibilityLabel="Use maximum tradable amount" testID="market-trade-max" onPress={() => setInput(String(maxTradeInput(vault, token, side)))} style={s.max}><Text style={s.secondaryText}>Max</Text></AuthButton></View>
        <View style={s.inputRow}><TextInput accessibilityLabel={`${side === 'buy' ? 'Spend' : 'Sell'} amount in ${quote.inputSymbol}`} testID="market-trade-amount" value={input} onChangeText={setInput} keyboardType="decimal-pad" autoCorrect={false} maxLength={22} placeholder="0" placeholderTextColor={D.muted} style={s.amountInput} /><View style={s.currency}><MarketTokenIcon symbol={side === 'buy' ? 'USDC' : token.symbol} size={23} /><Text style={s.optionTitle}>{quote.inputSymbol}</Text></View></View>
      </View>
      {quote.error ? <Text accessibilityLiveRegion="polite" style={s.error} testID="market-trade-error">{quote.error}</Text> : null}
      <View style={{ marginTop: 9 }}>
        <TradeDetail label="Estimated receive" value={receive} testID="market-estimated-receive" />
        <TradeDetail label={`${token.symbol} exposure`} value={quote.error ? hidden ? '••••' : `${quote.before.toFixed(1)}%` : exposure} />
        <View style={s.divider}><TradeDetail label="Sample fee · 0.10%" value={quote.error ? '—' : marketMoney(quote.fee)} /><TradeDetail label="Price impact" value="0.05%" /><TradeDetail label="Minimum receive · 0.50% slippage" value={quote.error ? '—' : `${tokenUnits(quote.minimum)} ${quote.outputSymbol}`} /></View>
      </View>
      <Text style={s.sample}>Sample prices and trade estimates · Jupiter preview</Text>
    </View>}
  </DashboardSheet>;
}
