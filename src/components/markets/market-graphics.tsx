import { Platform, Text, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { TokenIcon } from '@/components/shared/markets/market-graphics';
import { ShibaInuIcon } from '@/components/shared/icons/product-icons';
import { marketPrice } from '@/constants/captain-markets';
import type { Token, History, Period } from '@/api/markets';
import { DiscoverPalette as D } from '@/constants/theme';
import { InterFont } from '@/constants/fonts';

const decorative = Platform.OS === 'web' ? { 'aria-hidden': true as const } : { accessible: false };

export function MarketTokenIcon({ symbol, size = 40, tracked = true }: { symbol: string; size?: number; tracked?: boolean }) {
  if (tracked && (symbol === 'SOL' || symbol === 'BTC' || symbol === 'USDC')) return <TokenIcon symbol={symbol} size={size} />;
  if (!tracked || !['SOL', 'BTC', 'USDC', 'BONK', 'JUP', 'JTO'].includes(symbol)) return <View accessible={false} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#DCE8F4', alignItems: 'center', justifyContent: 'center' }}><Text>{symbol.slice(0, 2)}</Text></View>;
  if (symbol === 'BONK') return <View accessible={false} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#F4C263', alignItems: 'center', justifyContent: 'center' }}><ShibaInuIcon size={size * 0.7} color="#704F23" /></View>;
  return <Svg width={size} height={size} viewBox="0 0 48 48" {...decorative}>
    <Circle cx="24" cy="24" r="24" fill={symbol === 'JUP' ? '#DDECD7' : '#DCE8F4'} />
    {symbol === 'JUP' ? <>
      <Path d="M10 18c9-8 19-8 28-2M9 23c10-7 20-7 30-1M10 28c10-5 18-5 28-1M14 33c7-3 13-3 20-1" fill="none" stroke="#527545" strokeWidth="3" strokeLinecap="round" />
    </> : <Path d="M14 13h20v5H23v9c0 6-4 9-11 8v-5c4 1 6-1 6-4v-8h-4Z" fill="#496D94" />}
  </Svg>;
}

export function MarketChart({ token, period, history, small = false }: { token: Token; period: Period; history: History | null; small?: boolean }) {
  const samples = history?.points ?? [];
  if (samples.length < 2) return small ? null : <Text style={{ color: D.muted, textAlign: 'center', paddingVertical: 30 }} testID="market-history-empty">History unavailable · collecting real observations</Text>;
  const values = samples.map(p => Number(p.price)), min = Math.min(...values), max = Math.max(...values);
  const range = Math.max(max - min, max * 0.001), firstAt = Date.parse(samples[0].at), lastAt = Date.parse(samples[samples.length - 1].at);
  const right = small ? 76 : 250, bottom = small ? 31 : 85, top = small ? 4 : 10;
  const points = values.map((value, i) => [4 + (Date.parse(samples[i].at) - firstAt) / Math.max(1, lastAt - firstAt) * (right - 4), bottom - (value - min) / range * (bottom - top)]);
  const path = points.map(([x, y], i) => `${i && Date.parse(samples[i].at) - Date.parse(samples[i-1].at) <= Math.max(60_000, (history?.intervalSeconds ?? 10) * 3000) ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const last = points[points.length - 1], color = values[values.length - 1] >= values[0] ? D.positive : D.negative;
  return <View accessible={!small} accessibilityRole="image" accessibilityLabel={`${token.symbol} ${period} USD sampled price chart, ${history?.coverage.status.toLowerCase()} coverage`} testID={small ? undefined : 'market-price-chart'} style={small ? undefined : { marginTop: 10 }}>
    <Svg width={small ? 44 : '100%'} height={small ? 27 : 100} viewBox={small ? '0 0 80 36' : '0 0 320 110'} {...decorative}>
      {!small ? [10, 47.5, 85].map((y, i) => <Path key={i} d={`M4 ${y}H250`} stroke={D.line} strokeWidth={0.7} strokeDasharray="3 5" />) : null}
      <Path d={path} fill="none" stroke={color} strokeWidth={small ? 2.2 : 2} strokeLinecap="round" strokeLinejoin="round" />
      {!small ? <>
        <Circle cx={last[0]} cy={last[1]} r="3" fill={color} />
        {[max, (min + max) / 2, min].map((value, i) => <SvgText key={i} x="317" y={14 + i * 37.5} fontFamily={InterFont.regular} fontSize="9" fill={D.secondary} textAnchor="end">{marketPrice(value)}</SvgText>)}
        <SvgText x="4" y="108" fontFamily={InterFont.regular} fontSize="9" fill={D.muted}>{new Date(firstAt).toLocaleDateString()} {new Date(firstAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</SvgText>
        <SvgText x="250" y="108" fontFamily={InterFont.regular} fontSize="9" fill={D.muted} textAnchor="end">{new Date(lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</SvgText>
      </> : null}
    </Svg>
    {!small ? <Text style={{ color: D.muted, fontSize: 11, marginTop: 6 }}>{history?.coverage.status === 'COMPLETE' ? 'Recorded price observations' : 'Partial history · available observations only'}{history?.coverage.hasGaps ? ' · data gaps' : ''}</Text> : null}
  </View>;
}
