/** Captain discovery preview data. Nothing here is a live vault or a verified result. */
export const periods = ['7D', '30D', '90D', '1Y', 'ALL'] as const;
export type Period = (typeof periods)[number];
export type Risk = 'Lower' | 'Moderate' | 'Higher';
export const strategies = ['Momentum', 'Balanced', 'Long term', 'DeFi', 'Memecoins'] as const;
export type Strategy = (typeof strategies)[number];
export type Category = 'All Captains' | 'Top performers' | 'Consistent' | 'Rising' | 'Most followed' | 'Active' | 'Proven' | 'Saved';
export const categories: readonly Category[] = ['All Captains', 'Top performers', 'Consistent', 'Rising', 'Most followed', 'Active', 'Proven', 'Saved'];
export type Sort = 'Featured' | 'Highest return' | 'Lowest drawdown' | 'Most Crew' | 'Highest AUM' | 'Highest volume';
export const sorts: readonly Sort[] = ['Featured', 'Highest return', 'Lowest drawdown', 'Most Crew', 'Highest AUM', 'Highest volume'];
export type Holding = { symbol: 'SOL' | 'BTC' | 'ETH' | 'USDC'; name: string; weight: number };
export type Trade = { id: string; side: 'Buy' | 'Sell'; symbol: Holding['symbol']; amount: number; ago: string; slippage: number };
export type DiscoverCaptain = {
  id: string; name: string; initials: string; fund: string; strategy: Strategy; tags: string[];
  avatar: number; risk: Risk; aum: number; crew: number; months: number; positiveMonths: number;
  /** Uploaded profile media from the Captain API; local artwork is preview-only. */
  profilePhotoUrl?: string | null; bannerUrl?: string | null; verified?: boolean;
  trades: number; volume: number; slippage: number; fee: number; description: string;
  returns: Record<Period, number>; shape: number[]; holdings: Holding[]; activity: Trade[];
};

const holdings: Holding[] = [
  { symbol: 'SOL', name: 'Solana', weight: 58 }, { symbol: 'USDC', name: 'USD Coin', weight: 24 },
  { symbol: 'BTC', name: 'Wrapped Bitcoin', weight: 12 }, { symbol: 'ETH', name: 'Wrapped Ether', weight: 6 },
];
function activity(symbol: Holding['symbol'], amount: number): Trade[] {
  return [
    { id: 'a', side: 'Buy', symbol, amount, ago: '2 hours ago', slippage: 0.12 },
    { id: 'b', side: 'Sell', symbol: 'SOL', amount: amount * 0.6, ago: 'Yesterday', slippage: 0.18 },
    { id: 'c', side: 'Buy', symbol: 'BTC', amount: amount * 0.8, ago: '2 days ago', slippage: 0.09 },
    { id: 'd', side: 'Sell', symbol: 'ETH', amount: amount * 0.4, ago: '3 days ago', slippage: 0.21 },
  ];
}
export const discoverCaptains: readonly DiscoverCaptain[] = [
  { id: 'atlas', name: 'Atlas', initials: 'AT', fund: 'Solana Momentum', strategy: 'Momentum', tags: ['Solana', 'Large cap'], avatar: 0,
    risk: 'Moderate', aum: 482000, crew: 124, months: 14, positiveMonths: 10, trades: 184, volume: 2400000, slippage: 0.18, fee: 15,
    description: 'Following momentum. Keeping perspective. Atlas rotates between established Solana assets and a stablecoin reserve, with position limits to contain exposure.',
    returns: { '7D': 3.6, '30D': 18.4, '90D': 42.8, '1Y': 68.2, ALL: 76.4 },
    shape: [0, 0.05, 0.1, 0.08, 0.16, 0.26, 0.22, 0.38, 0.45, 0.18, 0.28, 0.42, 0.51, 0.48, 0.66, 0.7, 0.63, 0.8, 0.85, 0.78, 0.91, 1], holdings, activity: activity('SOL', 12400) },
  { id: 'solstice', name: 'Solstice', initials: 'SO', fund: 'Balanced Horizons', strategy: 'Balanced', tags: ['Multi-asset', 'Consistent'], avatar: 1,
    risk: 'Lower', aum: 1240000, crew: 286, months: 22, positiveMonths: 18, trades: 96, volume: 980000, slippage: 0.1, fee: 12,
    description: 'A measured portfolio of established assets. Solstice keeps a larger stablecoin reserve and rebalances gradually rather than chasing every move.',
    returns: { '7D': 1.2, '30D': 12.8, '90D': 24.6, '1Y': 39.8, ALL: 62.1 },
    shape: [0, 0.05, 0.12, 0.1, 0.19, 0.23, 0.28, 0.24, 0.33, 0.4, 0.46, 0.43, 0.5, 0.59, 0.62, 0.66, 0.63, 0.72, 0.8, 0.86, 0.91, 1],
    holdings: [{ symbol: 'SOL', name: 'Solana', weight: 28 }, { symbol: 'USDC', name: 'USD Coin', weight: 40 }, { symbol: 'BTC', name: 'Wrapped Bitcoin', weight: 22 }, { symbol: 'ETH', name: 'Wrapped Ether', weight: 10 }], activity: activity('BTC', 8200) },
  { id: 'northstar', name: 'Northstar', initials: 'NS', fund: 'Long View', strategy: 'Long term', tags: ['Bitcoin', 'Patient'], avatar: 2,
    risk: 'Moderate', aum: 860000, crew: 162, months: 28, positiveMonths: 20, trades: 42, volume: 420000, slippage: 0.08, fee: 10,
    description: 'A long horizon and a small number of convictions. Northstar holds wrapped Bitcoin on Solana alongside a cash reserve and adjusts exposure infrequently.',
    returns: { '7D': -0.8, '30D': 9.6, '90D': 19.2, '1Y': 52.4, ALL: 89.7 },
    shape: [0, 0.1, 0.2, 0.12, 0.26, 0.17, 0.08, 0.3, 0.35, 0.48, 0.39, 0.5, 0.6, 0.48, 0.65, 0.68, 0.56, 0.77, 0.81, 0.72, 0.9, 1],
    holdings: [{ symbol: 'BTC', name: 'Wrapped Bitcoin', weight: 65 }, { symbol: 'USDC', name: 'USD Coin', weight: 30 }, { symbol: 'SOL', name: 'Solana', weight: 5 }], activity: activity('BTC', 18600) },
  { id: 'bluewater', name: 'Bluewater', initials: 'BW', fund: 'DeFi Current', strategy: 'DeFi', tags: ['Solana', 'Diversified'], avatar: 3,
    risk: 'Moderate', aum: 215000, crew: 98, months: 16, positiveMonths: 11, trades: 136, volume: 1320000, slippage: 0.22, fee: 15,
    description: 'An active allocation across Solana DeFi markets. Bluewater balances directional positions with stablecoin liquidity and reviews exposure every week.',
    returns: { '7D': 2.1, '30D': 7.2, '90D': 16.8, '1Y': 31.2, ALL: 40.5 },
    shape: [0, 0.08, 0.23, 0.1, 0.2, 0.31, 0.18, 0.37, 0.22, 0.49, 0.4, 0.51, 0.32, 0.59, 0.7, 0.6, 0.81, 0.7, 0.89, 0.78, 0.92, 1], holdings, activity: activity('SOL', 5600) },
  { id: 'nova', name: 'Nova', initials: 'NV', fund: 'Early Signals', strategy: 'Momentum', tags: ['Solana', 'Rising'], avatar: 4,
    risk: 'Higher', aum: 78000, crew: 43, months: 5, positiveMonths: 4, trades: 268, volume: 3400000, slippage: 0.31, fee: 20,
    description: 'A fast-moving Solana strategy looking for early momentum. Concentrated positions and rapid changes bring higher volatility and a short track record.',
    returns: { '7D': 8.4, '30D': 26.1, '90D': 58.3, '1Y': 0, ALL: 64.2 },
    shape: [0, 0.13, 0.06, 0.38, 0.1, 0.42, 0.19, 0.59, 0.33, 0.71, 0.24, 0.5, 0.29, 0.69, 0.45, 0.84, 0.56, 0.97, 0.73, 1.1, 0.86, 1], holdings, activity: activity('SOL', 4200) },
  { id: 'tide', name: 'Tide', initials: 'TD', fund: 'Steady Reserve', strategy: 'Balanced', tags: ['Lower risk', 'Consistent'], avatar: 5,
    risk: 'Lower', aum: 342000, crew: 112, months: 18, positiveMonths: 15, trades: 68, volume: 640000, slippage: 0.09, fee: 10,
    description: 'A stablecoin-heavy reserve with measured exposure to large-cap assets. Tide prioritizes smaller swings while accepting more modest growth.',
    returns: { '7D': 0.6, '30D': 3.8, '90D': 10.4, '1Y': 18.6, ALL: 26.2 },
    shape: [0, 0.05, 0.09, 0.15, 0.2, 0.17, 0.24, 0.29, 0.33, 0.39, 0.36, 0.44, 0.5, 0.55, 0.52, 0.63, 0.7, 0.76, 0.81, 0.87, 0.93, 1],
    holdings: [{ symbol: 'USDC', name: 'USD Coin', weight: 65 }, { symbol: 'SOL', name: 'Solana', weight: 20 }, { symbol: 'BTC', name: 'Wrapped Bitcoin', weight: 15 }], activity: activity('SOL', 3800) },
  { id: 'drift', name: 'Drift', initials: 'DF', fund: 'Culture Basket', strategy: 'Memecoins', tags: ['High volume', 'Active'], avatar: 4,
    risk: 'Higher', aum: 56000, crew: 37, months: 4, positiveMonths: 2, trades: 412, volume: 4100000, slippage: 0.46, fee: 20,
    description: 'A speculative strategy focused on short-lived market narratives. Large price swings, concentrated exposure and liquidity constraints can lead to substantial losses.',
    returns: { '7D': -6.2, '30D': -8.4, '90D': 32.6, '1Y': 0, ALL: 14.8 },
    shape: [0, 0.32, 0.7, 0.28, 0.93, 0.41, 1.2, 0.58, 0.8, 0.24, 0.7, 1.6, 0.59, 1.3, 0.66, 1.45, 0.82, 1.8, 1.1, 1.5, 0.85, 1], holdings, activity: activity('SOL', 2300) },
];

export function hasPeriod(captain: DiscoverCaptain, period: Period) { return period !== '1Y' || captain.months >= 12; }
// A deterministic portfolio value series, always beginning at 100 and ending at
// the displayed return. Drawdown is derived from this same series, not another fixture.
export function performanceSeries(captain: DiscoverCaptain, period: Period): number[] {
  const factor = period === '7D' ? 0.14 : period === '30D' ? 0.5 : period === '90D' ? 1 : 1.5;
  const volatility = captain.risk === 'Higher' ? 90 : captain.risk === 'Moderate' ? 55 : 17;
  return captain.shape.map((value, i, points) => {
    const fraction = i / (points.length - 1);
    return 100 + fraction * captain.returns[period] + (value - fraction) * volatility * factor;
  });
}
export function drawdown(captain: DiscoverCaptain, period: Period): number {
  let peak = 100, worst = 0;
  for (const value of performanceSeries(captain, period)) { peak = Math.max(peak, value); worst = Math.max(worst, (peak - value) / peak * 100); }
  return worst;
}
export function percent(value: number) { return `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(1)}%`; }
export function money(value: number) { return value >= 1000000 ? `$${(value / 1000000).toFixed(2).replace(/0$/, '')}M` : value >= 1000 ? `$${(value / 1000).toFixed(0)}K` : `$${value.toFixed(0)}`; }
export function periodLabel(period: Period) { return period === 'ALL' ? 'Since inception' : `${period} return`; }
export type Filters = { risk: Risk | 'Any'; strategy: Strategy | 'Any'; aum: 'Any' | 'Under $100K' | '$100K–$1M' | '$1M+'; proven: boolean; positive: boolean };
export const emptyFilters: Filters = { risk: 'Any', strategy: 'Any', aum: 'Any', proven: false, positive: false };
export function filterCount(filters: Filters) { return Object.values(filters).filter(value => value !== 'Any' && value !== false).length; }
export function selectCaptains({ query, category, period, sort, filters, saved }: {
  query: string; category: Category; period: Period; sort: Sort; filters: Filters; saved: readonly string[];
}) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const result = discoverCaptains.filter(captain => {
    const searchText = [captain.name, captain.fund, captain.strategy, `${captain.risk} risk`,
      captain.risk === 'Lower' ? 'low risk' : captain.risk === 'Higher' ? 'high risk' : 'medium risk',
      captain.trades >= 180 ? 'active high volume' : '',
      captain.positiveMonths / captain.months >= 0.75 && captain.risk !== 'Higher' ? 'consistent' : '',
      ...captain.tags].join(' ').toLowerCase();
    if (!words.every(word => searchText.includes(word))) return false;
    if (!hasPeriod(captain, period)) return false;
    if (category === 'Saved' && !saved.includes(captain.id)) return false;
    if (category === 'Top performers' && captain.returns[period] <= 0) return false;
    if (category === 'Consistent' && !(captain.positiveMonths / captain.months >= 0.75 && captain.risk !== 'Higher')) return false;
    if (category === 'Rising' && !(captain.months <= 6 && captain.returns[period] > 0)) return false;
    if (category === 'Active' && captain.trades < 180) return false;
    if (category === 'Proven' && !(captain.months >= 12 && captain.aum >= 100000 && captain.positiveMonths / captain.months >= 0.7)) return false;
    if (filters.risk !== 'Any' && captain.risk !== filters.risk) return false;
    if (filters.strategy !== 'Any' && captain.strategy !== filters.strategy) return false;
    if (filters.aum === 'Under $100K' && captain.aum >= 100000) return false;
    if (filters.aum === '$100K–$1M' && (captain.aum < 100000 || captain.aum >= 1000000)) return false;
    if (filters.aum === '$1M+' && captain.aum < 1000000) return false;
    return (!filters.proven || captain.months >= 12) && (!filters.positive || captain.returns[period] > 0);
  });
  return result.sort((a, b) => {
    if (sort === 'Highest return' || (sort === 'Featured' && category === 'Top performers')) return b.returns[period] - a.returns[period];
    if (sort === 'Lowest drawdown') return drawdown(a, period) - drawdown(b, period);
    if (sort === 'Most Crew' || (sort === 'Featured' && category === 'Most followed')) return b.crew - a.crew;
    if (sort === 'Highest AUM') return b.aum - a.aum;
    if (sort === 'Highest volume') return b.volume - a.volume;
    return 0; // Stable editorial order; no undisclosed composite score.
  });
}
