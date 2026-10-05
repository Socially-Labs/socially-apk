import { DiscoverPalette as D } from './discover';

/** The selected Captain home concept: ice-blue glass and mint/navy action tiles. */
export const CaptainHomePalette = {
  card: ['rgba(240,249,255,0.97)', 'rgba(221,238,250,0.94)', 'rgba(244,250,255,0.98)'] as const,
  ink: '#0D274B', secondary: '#547196', chart: '#153B69',
  border: 'rgba(255,255,255,0.94)', line: '#CEE2F2',
  icon: '#245F98', iconSurface: 'rgba(255,255,255,0.72)',
  gain: '#08775F', gainSurface: '#D9FAEE',
  loss: D.negative, lossSurface: '#FCE9ED',
  tile: '#FFFFFF', tileBorder: '#DCE9F5', tileIcon: '#EFF7FD',
  earnings: '#ECFCF6', earningsBorder: '#C8ECE3', earningsIcon: '#D7F6EB',
  create: ['#223E5B', '#11263E'] as const,
  createBorder: '#5F7C96', createIcon: 'rgba(204,228,247,0.12)',
  createInk: D.heroInk, createSecondary: D.heroSecondary,
  shadow: '0 6px 20px rgba(54,103,147,0.07)',
} as const;
