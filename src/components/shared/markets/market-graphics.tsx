import { useId } from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Polygon, Stop } from 'react-native-svg';

import { type MarketSymbol } from '@/constants/portfolio';
import { Dashboard, WalletPalette } from '@/constants/theme';

const decorative = Platform.OS === 'web' ? { 'aria-hidden': true as const } : { accessible: false };

export function TokenIcon({ symbol, size = 40 }: { symbol: MarketSymbol | 'USDC'; size?: number }) {
  const gradient = `token-${useId().replace(/:/g, '')}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" {...decorative}>
      {symbol === 'USDC' ? <>
        <Circle cx="24" cy="24" r="24" fill={WalletPalette.usdc} />
        <Path d="M17 9a17 17 0 0 0 0 30M31 9a17 17 0 0 1 0 30M24 11v4m0 18v4m6-18c-1-5-12-5-12 1 0 6 12 2 12 8 0 6-11 6-12 1" fill="none" stroke={WalletPalette.white} strokeWidth="2.5" strokeLinecap="round" />
      </> : symbol === 'SOL' ? <>
        <Defs><LinearGradient id={gradient} x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#A844FF" /><Stop offset="1" stopColor="#00F0BA" />
        </LinearGradient></Defs>
        <Circle cx="24" cy="24" r="24" fill="#071324" />
        <Path d="m15 12-4 5h23l4-5H15Zm-4 9 4 5h23l-4-5H11Zm4 9-4 5h23l4-5H15Z" fill={`url(#${gradient})`} />
      </> : symbol === 'BTC' ? <>
        <Circle cx="24" cy="24" r="24" fill="#FF991D" />
        <Path transform="rotate(14 24 24)" d="M20 9v5m5-5v5m-5 20v5m5-5v5M15 14h12c9 0 9 10 0 10H17h11c10 0 10 10 0 10H15m4-20v20" fill="none" stroke="white" strokeWidth="3.1" />
      </> : <>
        <Circle cx="24" cy="24" r="24" fill="#D7DDE8" />
        <Polygon points="24,7 14,25 24,20" fill="#34383A" />
        <Polygon points="24,7 34,25 24,20" fill="#131718" />
        <Polygon points="14,25 24,31 24,20" fill="#747A7F" />
        <Polygon points="34,25 24,31 24,20" fill="#42484D" />
        <Polygon points="14,28 24,41 24,34" fill="#747A7F" />
        <Polygon points="34,28 24,41 24,34" fill="#202527" />
      </>}
    </Svg>
  );
}

export function MarketSparkline({ market, width = 42, height = 28 }: {
  market: { positive: boolean; chart: string }; width?: number; height?: number;
}) {
  const gradient = `chart-${useId().replace(/:/g, '')}`;
  const color = market.positive ? Dashboard.positive : Dashboard.negative;
  return (
    <Svg width={width} height={height} viewBox="0 0 82 50" {...decorative}>
      <Defs><LinearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={color} stopOpacity="0.18" />
        <Stop offset="1" stopColor={color} stopOpacity="0" />
      </LinearGradient></Defs>
      <Path d={`${market.chart} L80 50 L2 50 Z`} fill={`url(#${gradient})`} />
      <Path d={market.chart} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
