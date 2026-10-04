import { memo, type ComponentType, type ReactNode } from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { Dashboard } from '@/constants/theme';

export type ProductIconProps = { size?: number; color?: string; strokeWidth?: number; fill?: string };
export type AppIcon = ComponentType<ProductIconProps>;

// Product.md separates a Crew wallet, a pooled fund, and permission to trade it.
// Keep those meanings separate in the UI too. All symbols share a 24px grid,
// rounded 1.8px strokes, and inherit the surrounding screen's colour tokens.
// Labels supply the meaning; these small vectors are decorative, never badges
// claiming a deployed program, verification, or protection from trading losses.
function productIcon(name: string, drawing: ReactNode): AppIcon {
  const Icon = memo(function Icon({ size = 24, color = Dashboard.ink, strokeWidth = 1.8 }: ProductIconProps) {
    return <Svg width={size} height={size} viewBox="0 0 24 24"
      accessible={Platform.OS === 'web' ? undefined : false}
      aria-hidden={Platform.OS === 'web' ? true : undefined}>
      <G fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{drawing}</G>
    </Svg>;
  });
  Icon.displayName = name;
  return Icon;
}

/** A fund's vault, distinct from a member's personal wallet. */
export const FundVaultIcon = productIcon('FundVaultIcon', <>
  <Rect x={3} y={4} width={18} height={16} rx={3} />
  <Circle cx={11} cy={12} r={4} /><Path d="M11 8v2m0 4v2m-4-4h2m4 0h2m3-3v6M6 20v1m12-1v1" />
</>);

/** Swaps inside explicit permission boundaries, rather than custody access. */
export const TradingAuthorityIcon = productIcon('TradingAuthorityIcon', <>
  <Path d="M5 3H3v18h2M19 3h2v18h-2M7 8h10m-3-3 3 3-3 3M17 16H7m3-3-3 3 3 3" />
</>);

/** Positions partition the portfolio; no two-circle/Venn metaphor. */
export const HoldingsIcon = productIcon('HoldingsIcon', <>
  <Path d="M10 3a9 9 0 1 0 11 11H10ZM14 3v7h7a9 9 0 0 0-7-7Z" />
</>);

/** A fall from a portfolio peak. Never a checked shield implying safety. */
export const DrawdownIcon = productIcon('DrawdownIcon', <>
  <Path d="M3 17 8 7l5 4 7 7M15 18h5v-5M8 3v1m0 16v1" />
</>);

/** Liquid funds held in reserve, distinct from token holdings generally. */
export const ReserveIcon = productIcon('ReserveIcon', <>
  <Ellipse cx={9} cy={7} rx={6} ry={3} /><Path d="M3 7v5c0 1.7 2.7 3 6 3m6-8v3M3 12v5c0 1.7 2.7 3 6 3" />
  <Circle cx={16} cy={16} r={5} /><Path d="M16 12.8v6.4m1.7-5.2h-2.4a1 1 0 0 0 0 2h1.4a1 1 0 0 1 0 2h-2.4" />
</>);

/** Time horizon is a calendar, rather than an environmental leaf. */
export const LongTermIcon = productIcon('LongTermIcon', <>
  <Rect x={3} y={5} width={18} height={16} rx={3} /><Path d="M7 3v4m10-4v4M3 10h18M7 17l4-3 3 2 3-3" />
</>);

/** Connected financial venues rather than a generic cube. */
export const DeFiIcon = productIcon('DeFiIcon', <>
  <Circle cx={12} cy={5} r={3} /><Circle cx={5} cy={18} r={3} /><Circle cx={19} cy={18} r={3} />
  <Path d="m10.5 7.6-4 7.8m7-7.8 4 7.8M8 18h8" />
</>);

/** Balanced exposure, distinct from the Discover compass. */
export const BalancedIcon = productIcon('BalancedIcon', <>
  <Path d="M12 3v18M4 7h16M6 7l-3 7h6ZM18 7l-3 7h6ZM8 21h8M3 14c0 2 6 2 6 0m6 0c0 2 6 2 6 0" />
</>);

/** Doge-inspired Shiba face, drawn in the chip's single inherited colour. */
export const ShibaInuIcon = productIcon('ShibaInuIcon', <>
  <Path d="M5 10 3.5 3.5q-.2-1.2 1-.5L9 6.5q3-1 6 0L19.5 3q1.2-.7 1 .5L19 10q2 3 .5 6l-3 4q-4.5 3-9 0l-3-4Q3 13 5 10Z" />
  <Path d="m7 11 2 .5m6 0 2-.5M10.5 15h3L12 16.5Zm1.5 1.5V18m-3 0q3 2 6 0" />
</>);
