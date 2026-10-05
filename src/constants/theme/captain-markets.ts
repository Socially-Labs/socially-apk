import { CaptainHomePalette as C } from './captain-home';
import { DiscoverPalette as D } from './discover';

/** The selected pearl-glass Markets concept, alongside the frosted Home/Wallet. */
export const CaptainMarketsPalette = {
  card: ['rgba(252,254,255,0.98)', 'rgba(245,251,255,0.96)', 'rgba(226,243,254,0.97)'] as const,
  ink: C.ink, secondary: C.secondary, border: C.border, line: C.line,
  surface: C.tile, surfaceBorder: C.tileBorder, control: C.tileIcon,
  active: C.gain, activeSurface: C.gainSurface,
  draft: D.risk, draftSurface: D.riskTint,
  arrow: '#DCEFFC', shadow: C.shadow,
} as const;
