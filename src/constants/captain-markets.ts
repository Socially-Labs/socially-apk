import type { CaptainVault } from './captain-dashboard';

/** Sample spot markets only. No Jupiter requests, quotes, signatures or transactions. */
export const marketPeriods = ['1H', '24H', '7D', '30D'] as const;
export type MarketPeriod = typeof marketPeriods[number];
export type TokenSymbol = 'SOL' | 'JUP' | 'JTO' | 'BONK' | 'BTC' | 'USDC';
export type MarketToken = {
  symbol: TokenSymbol; name: string; mint: string; price: number; volume: number; liquidity: number;
  changes: Record<MarketPeriod, number>; category: 'Major assets' | 'Tokens' | 'Memecoins'; maxWeight: number;
};
export const marketTokens: readonly MarketToken[] = [
  { symbol: 'SOL', name: 'Solana', mint: 'So11111111111111111111111111111111111111112', price: 145.47, volume: 1200000000, liquidity: 90000000,
    changes: { '1H': 0.42, '24H': 2.81, '7D': -1.62, '30D': 8.4 }, category: 'Major assets', maxWeight: 75 },
  { symbol: 'JUP', name: 'Jupiter', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', price: 0.4056, volume: 612000000, liquidity: 28000000,
    changes: { '1H': -0.21, '24H': 4.32, '7D': 9.8, '30D': 15.2 }, category: 'Tokens', maxWeight: 25 },
  { symbol: 'JTO', name: 'Jito', mint: 'sample-jto-mint', price: 2.18, volume: 228000000, liquidity: 31200000,
    changes: { '1H': 0.13, '24H': -1.28, '7D': 3.6, '30D': -5.1 }, category: 'Tokens', maxWeight: 25 },
  { symbol: 'BONK', name: 'Bonk', mint: 'sample-bonk-mint', price: 0.0000223, volume: 198000000, liquidity: 41000000,
    changes: { '1H': 1.41, '24H': 8.14, '7D': -12.4, '30D': 21.6 }, category: 'Memecoins', maxWeight: 10 },
  { symbol: 'BTC', name: 'Bitcoin · Wrapped asset', mint: 'sample-wrapped-btc-mint', price: 104820, volume: 95000000, liquidity: 68000000,
    changes: { '1H': -0.08, '24H': -0.62, '7D': 2.7, '30D': 6.4 }, category: 'Major assets', maxWeight: 75 },
  { symbol: 'USDC', name: 'USD Coin', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', price: 1, volume: 0, liquidity: 1000000000,
    changes: { '1H': 0, '24H': 0, '7D': 0, '30D': 0 }, category: 'Major assets', maxWeight: 100 },
];
export type MarketTab = 'top' | 'invested';
export type MarketFilters = { category: 'All' | MarketToken['category']; liquidity: 0 | 25000000 | 100000000; sort: 'Volume' | 'Gainers' | 'Losers' };
export const defaultMarketFilters: MarketFilters = { category: 'All', liquidity: 0, sort: 'Volume' };
export function tokenBySymbol(symbol: TokenSymbol) { return marketTokens.find(token => token.symbol === symbol)!; }
export function holdingWeight(vault: CaptainVault, symbol: TokenSymbol) { return vault.holdings.find(holding => holding.symbol === symbol)?.weight ?? 0; }
export function holdingValue(vault: CaptainVault, symbol: TokenSymbol) { return vault.aumCents / 100 * holdingWeight(vault, symbol) / 100; }
export function availableCash(vault: CaptainVault) { return holdingValue(vault, 'USDC'); }
export function marketPrice(value: number) { return `$${value.toLocaleString('en-US', { minimumFractionDigits: value >= 1 ? 2 : 0, maximumFractionDigits: value >= 1 ? 2 : value >= 0.01 ? 4 : 9 })}`; }
export function marketMoney(value: number) { return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
export function compactMarketMoney(value: number) {
  const divisor = value >= 1e9 ? 1e9 : value >= 1e6 ? 1e6 : value >= 1e3 ? 1e3 : 1;
  return `$${(value / divisor).toLocaleString('en-US', { maximumFractionDigits: 1 })}${divisor === 1e9 ? 'B' : divisor === 1e6 ? 'M' : divisor === 1e3 ? 'K' : ''}`;
}
export function marketChange(value: number) { return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(2)}%`; }
export function tokenUnits(value: number) { return value.toLocaleString('en-US', { maximumFractionDigits: value >= 10000 ? 2 : 8 }); }

const shape = [0, 0.12, 0.09, 0.28, 0.2, 0.35, 0.3, 0.46, 0.4, 0.6, 0.51, 0.7, 0.61, 0.79, 0.72, 0.88, 0.84, 1];
export function marketSeries(token: MarketToken, period: MarketPeriod) {
  const start = token.price / (1 + token.changes[period] / 100);
  return shape.map(point => start + (token.price - start) * point);
}
export function selectMarkets({ vault, tab, query, period, filters, savedOnly, saved }: {
  vault: CaptainVault; tab: MarketTab; query: string; period: MarketPeriod; filters: MarketFilters; savedOnly: boolean; saved: readonly TokenSymbol[];
}) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return marketTokens.filter(token => (tab === 'invested' ? holdingWeight(vault, token.symbol) > 0 : !['BTC', 'USDC'].includes(token.symbol) || terms.length > 0)
    && terms.every(term => `${token.symbol} ${token.name} ${token.mint}`.toLowerCase().includes(term))
    && (filters.category === 'All' || token.category === filters.category) && token.liquidity >= filters.liquidity
    && (!savedOnly || saved.includes(token.symbol)))
    .sort((a, b) => filters.sort === 'Gainers' ? b.changes[period] - a.changes[period] : filters.sort === 'Losers' ? a.changes[period] - b.changes[period] : b.volume - a.volume);
}

export type TradeSide = 'buy' | 'sell';
const FEE = 0.001, IMPACT = 0.0005, SLIPPAGE = 0.005;
export function maxTradeInput(vault: CaptainVault, token: MarketToken, side: TradeSide) {
  if (side === 'sell') return Math.floor(holdingValue(vault, token.symbol) / token.price * 1e8) / 1e8;
  const headroom = Math.max(0, vault.aumCents / 100 * token.maxWeight / 100 - holdingValue(vault, token.symbol));
  return Math.floor(Math.min(availableCash(vault), headroom) * 100) / 100;
}
export function parseTradeInput(input: string, side: TradeSide) {
  const clean = input.trim().replace(',', '.');
  const pattern = side === 'buy' ? /^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/ : /^(?:\d+(?:\.\d{0,8})?|\.\d{1,8})$/;
  if (!pattern.test(clean)) return null;
  const amount = Number(clean);
  return Number.isFinite(amount) && amount <= 1e12 ? amount : null;
}
export function previewTrade(vault: CaptainVault, token: MarketToken, side: TradeSide, input: string) {
  const amount = parseTradeInput(input, side);
  const before = holdingWeight(vault, token.symbol), available = side === 'buy' ? availableCash(vault) : holdingValue(vault, token.symbol) / token.price;
  let error: string | null = null;
  if (vault.status === 'Draft') error = 'Launch this vault before trading.';
  else if (token.symbol === 'USDC') error = 'Choose another market to trade with your USDC.';
  else if (side === 'sell' && available <= 0) error = `This vault does not hold ${token.symbol} yet.`;
  else if (side === 'buy' && before >= token.maxWeight) error = `${token.symbol} is at this vault’s ${token.maxWeight}% position limit. You can reduce the position by selling.`;
  else if (!input.trim()) error = 'Enter an amount to continue.';
  else if (amount === null) error = `Use a number with up to ${side === 'buy' ? 2 : 8} decimal places.`;
  else if (amount <= 0) error = 'Enter an amount greater than zero.';
  else if (amount > available + 1e-8) error = `This amount exceeds the vault’s available ${side === 'buy' ? 'USDC' : token.symbol}.`;
  const gross = (amount ?? 0) * (side === 'sell' ? token.price : 1);
  const fee = gross * FEE;
  const net = Math.max(0, gross - fee) * (1 - IMPACT);
  const receive = side === 'buy' ? net / token.price : net;
  const after = Math.max(0, before + (side === 'buy' ? net : -gross) / (vault.aumCents / 100 || 1) * 100);
  if (!error && side === 'buy' && after > token.maxWeight + 1e-8) error = `This trade exceeds the sample ${token.maxWeight}% ${token.symbol} position limit. Reduce the amount or use Max.`;
  return { error, amount: amount ?? 0, gross, fee, receive, minimum: receive * (1 - SLIPPAGE), before, after, impact: IMPACT * 100,
    remaining: Math.max(0, available - (amount ?? 0)), inputSymbol: side === 'buy' ? 'USDC' : token.symbol, outputSymbol: side === 'buy' ? token.symbol : 'USDC' };
}
