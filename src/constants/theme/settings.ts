import { Dashboard } from './dashboard';

/** Settings extend the voyage cards with quieter icon wells and a blue crew badge. */
export const SettingsPalette = {
  ink: Dashboard.ink,
  secondary: '#78869F',
  surface: Dashboard.glass,
  iconWell: 'rgba(231,237,245,0.64)',
  avatar: '#DEE5EF',
  line: 'rgba(224,230,240,0.8)',
  badge: '#E4EFFF',
  accent: '#315E99',
  primary: '#596F90',
  primaryInk: '#FFFFFF',
  danger: '#A3333F',
  dangerTint: 'rgba(163,51,63,0.06)',
  field: 'rgba(255,255,255,0.88)',
  background: Dashboard.background,
  solidSurface: '#FFFFFF',
  border: '#E4EAF2',
  shadow: '0 8px 28px rgba(58,83,119,0.06)',
  cover: '#C9DBE8',
  coverShade: ['rgba(26,49,76,0)', 'rgba(26,49,76,0.18)'] as const,
  coverButton: 'rgba(255,255,255,0.92)',
  cardRadius: 24,
  titleSize: 28,
  rowTitleSize: 15,
  bodySize: 14,
} as const;
