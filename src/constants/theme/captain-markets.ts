import { CaptainHomePalette as C } from './captain-home';
import { DiscoverPalette as D } from './discover';

/** The selected pearl-glass Markets concept, alongside the frosted Home/Wallet. */
export const CaptainMarketsPalette = {
  card: ['rgba(252,254,255,0.98)', 'rgba(245,251,255,0.96)', 'rgba(226,243,254,0.97)'] as const,
  ink: C.ink, secondary: C.secondary, border: C.border, line: C.line,
  surface: C.tile, surfaceBorder: C.tileBorder, control: C.tileIcon,
  tokenTile: '#E9F4FE', marketBorder: '#FFFFFF',
  marketGlass: ['#F8FCFF', '#F1F9FF', '#E5F4FF'] as const,
  tokenGlass: ['#F5FAFF', '#DEEEFD'] as const,
  waterBack: 'rgba(204,230,250,0.32)', waterFront: 'rgba(197,225,248,0.28)',
  sail: '#CEE2F5', sailLight: '#DFECFA',
  active: C.gain, activeSurface: C.gainSurface,
  draft: D.risk, draftSurface: D.riskTint,
  arrow: '#DCEFFC', shadow: C.shadow,
} as const;
