import { DiscoverPalette } from './discover';
import { WalletPalette } from './wallet';

/**
 * One coastal hue family, separated by lightness rather than competing blues.
 * Only the current destination receives navy; inactive controls share a quiet
 * pearl surface so Home does not look selected while another tab is open.
 */
export const NavigationPalette = {
  activeGradient: [DiscoverPalette.ink, WalletPalette.ink] as const,
  homeInactiveGradient: [DiscoverPalette.surface, '#F9FBFD'] as const,
  homeInactiveInk: DiscoverPalette.secondary,
  primarySurface: '#F9FBFD',
  primaryInk: WalletPalette.heroInk,
  primaryBorder: DiscoverPalette.line,
  primaryShadow: '0 5px 16px rgba(24,43,67,0.1)',
  tray: '#F9FBFD',
  trayBorder: DiscoverPalette.line,
  trayShadow: '0 5px 16px rgba(24,43,67,0.08)',
  selected: DiscoverPalette.ink,
  selectedBorder: 'rgba(24,43,67,0.16)',
  selectedInk: WalletPalette.heroInk,
  inactiveInk: DiscoverPalette.secondary,
} as const;
