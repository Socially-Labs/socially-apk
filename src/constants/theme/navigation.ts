import { WalletPalette } from './wallet';

/** Shared floating tabs use the same coastal navy as the wallet and Captain controls. */
export const NavigationPalette = {
  activeGradient: [WalletPalette.hero[0], WalletPalette.hero[1]] as const,
  homeInactiveGradient: ['#536B85', '#405874'] as const,
  primarySurface: WalletPalette.hero[0],
  primaryInk: WalletPalette.heroInk,
  primaryBorder: 'rgba(202,222,237,0.5)',
  primaryShadow: '0 6px 18px rgba(17,48,78,0.19)',
  tray: 'rgba(241,246,250,0.97)',
  trayBorder: 'rgba(209,223,234,0.95)',
  trayShadow: '0 6px 20px rgba(30,57,82,0.12)',
  selected: WalletPalette.hero[1],
  selectedBorder: 'rgba(145,183,213,0.42)',
  selectedInk: WalletPalette.heroInk,
  inactiveInk: '#546B82',
} as const;
