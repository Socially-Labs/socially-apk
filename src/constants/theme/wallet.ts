import { CaptainHomePalette as C } from './captain-home';

/** Wallet's selected frosted concept shares the Home screens' ice, navy and mint. */
export const WalletPalette = {
  ink: C.ink, secondary: C.secondary, surface: 'rgba(255,255,255,0.72)',
  assetSurface: C.tile,
  border: C.tileBorder, muted: 'rgba(231,237,244,0.74)',
  veil: 'rgba(255,255,255,0.28)',
  deposit: ['#43E299', '#2DD483'] as const,
  withdraw: ['#86CDFF', '#60B8FA'] as const,
  selected: '#CAE4FF', selectedInk: '#384963', white: '#FFFFFF', usdc: '#3284D5',
  shadow: '0 8px 24px rgba(87,110,145,0.07)',
  hero: ['#173652', '#09233D', '#143450'] as const,
  heroInk: '#F8FBFF', heroSecondary: '#AFC0D0', heroLine: 'rgba(182,211,235,0.15)',
  heroPill: 'rgba(138,179,212,0.13)', heroPositive: '#85DDC3', compass: '#C8BD98',
  primaryAction: ['#2B4D74', '#183857'] as const,
  heroShadow: '0 6px 14px rgba(17,48,78,0.12)',
  receiveCard: '#173652', receivePill: '#E5EDF7', receiveQrInk: '#102C46',
  balanceCard: C.card, balanceBorder: C.border, balanceLine: C.line,
  balanceIcon: '#DCEFFC', balanceCompass: '#9ABEDB', balanceShadow: C.shadow,
  gain: C.gain, gainSurface: C.gainSurface, error: C.loss,
  actionSurface: C.tile, actionIcon: C.tileIcon,
  headerTitleSize: 18, balanceSize: 43, bodySize: 15, actionLabelSize: 15, captionSize: 11,
} as const;
