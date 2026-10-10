import { ChevronDown, ChevronRight, Info, ListFilter, SlidersHorizontal, Wallet } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Platform, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AuthButton } from '@/components/shared/motion';
import type { Preview, Token } from '@/api/markets';
import { tradeAmountDisplay, tradeQuoteReceive, tradeQuoteSpread } from '@/api/trade-quote';
import { CaptainMarketsPalette as M } from '@/constants/theme/captain-markets';
import { MarketTokenIcon } from './market-graphics';
import { orbitStyles as o } from './market-orbit-styles';

const decorative = Platform.OS === 'web' ? { 'aria-hidden': true as const } : { accessible: false };

function VoyageConnector() {
  return <Svg width={180} height={56} viewBox="0 0 180 72" style={o.connector} {...decorative}>
    <Path d="M90 0v9c0 14 15 16 15 29S90 54 90 67m-5-6 5 6 5-6" fill="none" stroke="#8EC4ED" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 37c20-15 35 15 56 0m43 0c20 14 34-12 49 0" fill="none" stroke="#D9EBFA" strokeWidth={2} strokeLinecap="round" />
    <Path d="M84 18 73 38h11Zm3-4v24h9Zm-15 27h25c-2 5-6 7-12 7s-11-2-13-7Z" fill="#6E9ABF" />
  </Svg>;
}

export function OrbitTrade({ token, side, input, quote, loading, balance, disabled, canMax, reviewing, detailsOpen,
  onSide, onInput, onMax, onDetails, children }: {
  token: Token; side: 'BUY' | 'SELL'; input: string; quote: Preview | null; loading: boolean; balance: string;
  disabled: boolean; canMax: boolean; reviewing: boolean; detailsOpen: boolean;
  onSide: (side: 'BUY' | 'SELL') => void; onInput: (input: string) => void; onMax: () => void; onDetails: () => void; children: ReactNode;
}) {
  const pay = side === 'BUY' ? { symbol: 'USDC', icon: null, tracked: true } : token;
  const receive = side === 'BUY' ? token : { symbol: 'USDC', icon: null, tracked: true };
  const unit = pay.symbol;
  const { width } = useWindowDimensions();
  const receiveAmount = quote ? tradeAmountDisplay(tradeQuoteReceive(quote, side)) : '—';
  const receiveFont = receiveAmount.length > 14 ? (width < 360 ? 11 : 15)
    : receiveAmount.length > 10 ? (width < 360 ? 17 : 23) : (width < 360 ? 24 : 29);
  return <View style={o.form} testID={reviewing ? 'market-trade-review' : 'market-trade-form'}>
    <View style={o.segments}>{(['BUY', 'SELL'] as const).map(item => <AuthButton key={item} testID={`market-trade-${item.toLowerCase()}`}
      accessibilityRole="button" accessibilityState={{ selected: side === item }} disabled={disabled || reviewing}
      onPress={() => onSide(item)} style={[o.segment, side === item && o.selected]}>
      <Text style={[o.segmentText, side === item && o.selectedText]}>{item === 'BUY' ? 'Buy' : 'Sell'}</Text>
    </AuthButton>)}</View>
    <TextInput testID="market-trade-amount" accessibilityLabel={`Amount in ${unit}`} value={input} onChangeText={onInput}
      editable={!disabled && !reviewing} keyboardType="decimal-pad" autoCorrect={false} maxLength={40}
      placeholder="0.00" placeholderTextColor={M.secondary} underlineColorAndroid="transparent"
      style={[o.amount, { fontSize: input.length > 15 ? 24 : input.length > 10 ? 34 : 54 }]} />
    <View style={o.currency} accessible accessibilityLabel={`Pay ${unit}`}>
      <MarketTokenIcon {...pay} size={30} /><Text style={o.currencyText}>{unit}</Text>
    </View>
    <View style={o.balance}><Wallet size={17} color={M.secondary} /><Text style={o.balanceText} testID="market-trade-balance"
      accessibilityLabel={`Vault balance ${balance} ${unit}`}>{balance} {unit}</Text>
      <AuthButton testID="market-trade-max" accessibilityRole="button" accessibilityLabel={`Use maximum ${unit} allowed by vault policy`}
        disabled={disabled || reviewing || !canMax} onPress={onMax} style={o.max}><Text style={o.maxText}>Max</Text></AuthButton>
    </View>
    <VoyageConnector />
    <View style={o.receive} accessible accessibilityLabel={quote ? `Estimated receive ${tradeQuoteReceive(quote, side)} ${receive.symbol}` : 'Receive estimate unavailable'}>
      <MarketTokenIcon {...receive} size={38} />
      {loading && !quote ? <ActivityIndicator size="small" color={M.secondary} /> : null}
      <Text testID="market-review-receive" style={[o.receiveNumber, { fontSize: receiveFont }]} adjustsFontSizeToFit minimumFontScale={0.5} numberOfLines={1}>
        {quote ? `≈ ${receiveAmount}` : '—'}
      </Text><Text style={o.receiveUnit} numberOfLines={1}>{receive.symbol}</Text>
    </View>
    <View style={o.chips}>
      <AuthButton accessibilityRole="button" accessibilityLabel={`Simulated spread and impact ${tradeQuoteSpread(quote)}. Show trade details`}
        testID="market-trade-spread" onPress={onDetails} style={o.chip}><SlidersHorizontal size={17} color={M.secondary} />
        <Text style={o.chipText}>{tradeQuoteSpread(quote)}</Text><ChevronDown size={14} color={M.secondary} /></AuthButton>
      <AuthButton accessibilityRole="button" accessibilityLabel={`Simulated fee ${quote?.estimate.feeUsdc ?? 'unavailable'} USDC. Show trade details`}
        testID="market-trade-fee" onPress={onDetails} style={o.chip}><Info size={17} color={M.secondary} />
        <Text style={o.chipText}>{tradeAmountDisplay(quote?.estimate.feeUsdc)} USDC</Text></AuthButton>
    </View>
    <AuthButton accessibilityRole="button" accessibilityLabel="Trade details" accessibilityState={{ expanded: detailsOpen }}
      testID="market-trade-details-toggle" onPress={onDetails} style={o.detailsButton}>
      <ListFilter size={18} color={M.secondary} /><Text style={o.detailsText}>Details</Text>
      {detailsOpen ? <ChevronDown size={18} color={M.secondary} /> : <ChevronRight size={18} color={M.secondary} />}
    </AuthButton>
    {detailsOpen ? <View style={o.details} testID="market-trade-details">{children}</View> : null}
  </View>;
}
