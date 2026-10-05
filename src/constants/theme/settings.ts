import { Dashboard } from './dashboard';
import { CaptainHomePalette as C } from './captain-home';
import { DiscoverPalette as D } from './discover';

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

/** Selected Settings concept 2: a pearl hub with a mint invitation tile. */
export const SettingsHubPalette = {
  ink: D.ink, secondary: D.secondary,
  tile: ['#FFFFFF', '#F3FAFE'] as const,
  invite: ['#EDFCF6', '#DEFAF1'] as const,
  border: C.tileBorder, rim: C.border, line: C.line,
  iconSurface: C.tileIcon, arrow: '#E3F2FD',
  inviteIcon: C.earningsIcon, inviteArrow: C.gainSurface, inviteInk: C.gain,
  shadow: C.shadow,
} as const;
