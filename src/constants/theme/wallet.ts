/** Wallet follows the supplied navy balance card and pale asset-list reference. */
export const WalletPalette = {
  ink: '#13273F', secondary: '#8390A8', surface: 'rgba(255,255,255,0.72)',
  assetSurface: 'rgba(255,255,255,0.8)',
  border: 'rgba(220,226,235,0.75)', muted: 'rgba(231,237,244,0.74)',
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
  headerTitleSize: 18, balanceSize: 43, bodySize: 15, actionLabelSize: 15, captionSize: 11,
} as const;
