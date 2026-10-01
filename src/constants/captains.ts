export type Captain = {
  id: string;
  name: string;
  initials: string;
  strategy: string;
  description: string;
  return30d: string;
  crew: number;
  color: string;
  tint: string;
};

// Sample captains for the app preview, alongside the sample portfolio.
export const popularCaptains: readonly Captain[] = [
  { id: 'atlas', name: 'Atlas', initials: 'AT', strategy: 'Solana · Momentum', description: 'A focused Solana portfolio that follows market momentum.', return30d: '+18.4%', crew: 124, color: '#597B8F', tint: '#E3EEF3' },
  { id: 'solstice', name: 'Solstice', initials: 'SO', strategy: 'Multi-chain · Balanced', description: 'A balanced approach across established crypto markets.', return30d: '+12.8%', crew: 86, color: '#8A779B', tint: '#EDE7F3' },
  { id: 'northstar', name: 'Northstar', initials: 'NS', strategy: 'Bitcoin · Long term', description: 'A patient Bitcoin strategy with a long-term perspective.', return30d: '+9.6%', crew: 62, color: '#938268', tint: '#F1ECE3' },
  { id: 'bluewater', name: 'Bluewater', initials: 'BW', strategy: 'Ethereum · Diversified', description: 'An Ethereum-led portfolio with a diversified allocation.', return30d: '+7.2%', crew: 48, color: '#608B83', tint: '#E5F0ED' },
];

export function shouldShowPopularCaptains(marketCount: number) {
  return marketCount <= 3;
}
