import { Dashboard } from './dashboard';

/** Discover follows the supplied coastal reference with readable portfolio data. */
export const DiscoverPalette = {
  background: Dashboard.background,
  ink: '#182B43', secondary: '#64758B', muted: '#77869A',
  surface: '#FFFFFF', soft: '#EDF2F7', line: '#E3EAF1',
  glass: 'rgba(255,255,255,0.72)', glassBorder: 'rgba(255,255,255,0.76)',
  searchGlass: 'rgba(249,252,255,0.91)',
  accent: '#45698C', accentTint: '#E6EFF8',
  positive: '#16805E', negative: '#AF4854', risk: '#926536', riskTint: '#F5EDE1',
  hero: ['#10243B', '#07172C', '#10263E'] as const,
  heroInk: '#F8FBFF', heroSecondary: '#B8CADC', heroLine: 'rgba(213,229,245,0.17)',
  heroChart: '#78B7FF', heroPositive: '#72DFA7', heroNegative: '#FF9EA9', heroPill: 'rgba(211,229,246,0.1)',
  heroBorder: '#8BAACA',
  profileBannerFade: ['rgba(245,247,251,0)', 'rgba(245,247,251,0.48)', Dashboard.background] as const,
  profilePhotoBorder: '#FFFFFF',
  heroOverlay: ['rgba(7,23,44,0.86)', 'rgba(7,23,44,0.78)', 'rgba(7,23,44,0.96)'] as const,
  sceneryVeil: ['rgba(245,247,251,0.38)', 'rgba(245,247,251,0.14)', 'rgba(245,247,251,0.03)'] as const,
  // The Captain port has more detail beneath the hero copy than the Crew bay.
  captainSceneryVeil: ['rgba(245,247,251,0.94)', 'rgba(245,247,251,0.76)', 'rgba(245,247,251,0.03)'] as const,
  backgroundGradient: ['#E4EDF5', '#F1F5F9', Dashboard.background] as const,
  heroArrow: '#2A4770', riskLower: '#468D64', riskHigher: '#C46150',
  heroRisk: ['#7EC994', '#EBAF54', '#FF8D7D'] as const,
  navigation: ['#344C6C', '#1B304C'] as const,
  navigationInactive: ['#344C6C', '#1B304C'] as const,
  navigationRing: '#CEE0FF',
  allocation: ['#658EAE', '#A9BFCB', '#C7AD83', '#9A92B5'] as const,
  avatars: [
    { ink: '#4C7183', tint: '#DCEAF0' }, { ink: '#826791', tint: '#ECE3F1' },
    { ink: '#8A714E', tint: '#EFE6D6' }, { ink: '#4D8178', tint: '#DFECE7' },
    { ink: '#86626B', tint: '#F0E1E5' }, { ink: '#687496', tint: '#E4E8F3' },
  ],
  radius: 24, titleSize: 30, returnSize: 36, bodySize: 14, captionSize: 12,
  shadow: '0 8px 28px rgba(37,60,85,0.05)',
} as const;
