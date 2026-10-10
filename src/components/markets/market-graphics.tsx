import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { TokenIcon } from '@/components/shared/markets/market-graphics';
import { ShibaInuIcon } from '@/components/shared/icons/product-icons';
import { marketPrice } from '@/constants/captain-markets';
import type { Token, History, Period } from '@/api/markets';
import { DiscoverPalette as D } from '@/constants/theme';
import { InterFont } from '@/constants/fonts';

const decorative = Platform.OS === 'web' ? { 'aria-hidden': true as const } : { accessible: false };

type MarketTokenIconProps = { symbol: string; size?: number; tracked?: boolean; icon?: string | null };

export function MarketTokenIcon({ icon, symbol, size = 40, tracked = true }: MarketTokenIconProps) {
  const uri = icon?.trim();
  return uri ? <RemoteMarketTokenIcon key={uri} uri={uri} symbol={symbol} size={size} tracked={tracked} />
    : <MarketTokenFallback symbol={symbol} size={size} tracked={tracked} />;
}

function RemoteMarketTokenIcon({ uri, symbol, size, tracked }: Required<Pick<MarketTokenIconProps, 'symbol' | 'size' | 'tracked'>> & { uri: string }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);
  const retry = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(retry.current), []);
  const failed = () => {
    setStatus('failed');
    clearTimeout(retry.current);
    if (attempt < 2) retry.current = setTimeout(() => {
      setAttempt(value => value + 1);
      setStatus('loading');
    }, (attempt === 0 ? 4000 : 12000) + Math.random() * 1000);
  };
  return <View accessible={false} style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
    {status !== 'ready' ? <MarketTokenFallback symbol={symbol} size={size} tracked={tracked} /> : null}
    {status !== 'failed' ? <Image key={attempt} source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain"
      cachePolicy="memory-disk" recyclingKey={uri} transition={0} accessible={false}
      onDisplay={() => { clearTimeout(retry.current); setStatus('ready'); }} onError={failed} /> : null}
  </View>;
}

function MarketTokenFallback({ symbol, size = 40, tracked = true }: MarketTokenIconProps) {
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

export function MarketChart({ token, period, history, small = false, loading = false, smallWidth = 44 }: { token: Token; period: Period; history: History | null; small?: boolean; loading?: boolean; smallWidth?: number }) {
  const samples = history?.points ?? [];
  if (samples.length < 2) return small ? <View style={{ width: smallWidth, height: 32, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Chart is collecting prices"><Text style={{ color: D.muted }}>—</Text></View> : <Text style={{ color: D.muted, textAlign: 'center', paddingVertical: 30 }} testID="market-history-empty">{loading ? 'Loading chart…' : 'Collecting prices · chart appears as prices arrive'}</Text>;
  const values = samples.map(p => Number(p.price)), live = history?.livePoint, extent = live ? [...values, Number(live.price)] : values, min = Math.min(...extent), max = Math.max(...extent);
  const range = Math.max(max - min, max * 0.001), firstAt = Date.parse(history!.from), lastAt = Math.max(Date.parse(history!.to), live ? Date.parse(live.at) : 0);
  const right = small ? 76 : 250, bottom = small ? 31 : 85, top = small ? 4 : 10;
  const points = values.map((value, i) => [4 + (Date.parse(samples[i].at) - firstAt) / Math.max(1, lastAt - firstAt) * (right - 4), bottom - (value - min) / range * (bottom - top)]);
  const path = points.map(([x, y], i) => `${i && Date.parse(samples[i].at) - Date.parse(samples[i-1].at) <= Math.max(60_000, (history?.intervalSeconds ?? 10) * 3000) ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const last = points[points.length - 1], color = values[values.length - 1] >= values[0] ? D.positive : D.negative;
  return <View accessible={!small} accessibilityRole="image" accessibilityLabel={`${token.symbol} ${period} USD sampled price chart, ${history?.coverage.status.toLowerCase()} coverage`} testID={small ? `market-sparkline-${token.mint}` : 'market-price-chart'} style={small ? undefined : { marginTop: 10 }}>
    <Svg width={small ? smallWidth : '100%'} height={small ? 32 : 100} viewBox={small ? '0 0 80 36' : '0 0 320 110'} {...decorative}>
      {!small ? [10, 47.5, 85].map((y, i) => <Path key={i} d={`M4 ${y}H250`} stroke={D.line} strokeWidth={0.7} strokeDasharray="3 5" />) : null}
      <Path d={path} fill="none" stroke={color} strokeWidth={small ? 2.2 : 2} strokeLinecap="round" strokeLinejoin="round" />
      {!small ? <>
        <Circle cx={last[0]} cy={last[1]} r="3" fill={color} />
        {live ? <Circle cx={4 + (Date.parse(live.at) - firstAt) / Math.max(1, lastAt - firstAt) * (right - 4)} cy={bottom - (Number(live.price) - min) / range * (bottom - top)} r="3" fill={D.accent} testID="market-live-price-point" /> : null}
        {[max, (min + max) / 2, min].map((value, i) => <SvgText key={i} x="317" y={14 + i * 37.5} fontFamily={InterFont.regular} fontSize="9" fill={D.secondary} textAnchor="end">{marketPrice(value)}</SvgText>)}
        <SvgText x="4" y="108" fontFamily={InterFont.regular} fontSize="9" fill={D.muted}>{new Date(firstAt).toLocaleDateString()} {new Date(firstAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</SvgText>
        <SvgText x="250" y="108" fontFamily={InterFont.regular} fontSize="9" fill={D.muted} textAnchor="end">{new Date(lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</SvgText>
      </> : null}
    </Svg>
    {!small ? <Text style={{ color: D.muted, fontSize: 11, marginTop: 6 }}>{history?.source === 'BIRDEYE_TOKEN_USD' ? '24h · historical prices' : '24h · recorded prices'}{history?.coverage.status !== 'COMPLETE' ? ' · partial history' : ''}{live ? ' · live Jupiter marker' : ''}{history?.coverage.hasGaps ? ' · data gaps' : ''}</Text> : null}
  </View>;
}
