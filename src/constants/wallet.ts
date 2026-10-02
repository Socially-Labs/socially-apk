export type WalletAsset = {
  symbol: 'USDC' | 'SOL' | 'BTC' | 'ETH';
  name: string;
  network: 'Solana' | 'Solana (Wormhole)';
  value: number;
  quantity: string;
  positive: boolean;
  chart: string;
};

// Preview holdings from the design reference, separate from staked allocations.
export const walletAssets: readonly WalletAsset[] = [
  { symbol: 'USDC', name: 'USD Coin', network: 'Solana', value: 4230.50, quantity: '4,230.50 USDC', positive: true,
    chart: 'M2 44L8 30L14 19L20 21L26 26L32 24L37 21L43 22L48 19L53 20L58 7L62 11L66 2L71 13L75 13L78 19L82 17' },
  { symbol: 'SOL', name: 'Solana', network: 'Solana', value: 3980.10, quantity: '18.42 SOL', positive: false,
    chart: 'M2 4L7 16L11 20L17 17L24 28L30 26L35 27L40 21L45 23L49 18L55 20L60 27L65 42L70 46L75 38L79 40L82 35' },
  { symbol: 'BTC', name: 'Bitcoin', network: 'Solana (Wormhole)', value: 1291.20, quantity: '0.0124 BTC', positive: true,
    chart: 'M2 43L8 32L14 26L20 30L26 33L32 27L38 26L43 18L48 19L53 17L58 3L63 8L67 1L72 14L77 18L82 17' },
  { symbol: 'ETH', name: 'Ethereum', network: 'Solana (Wormhole)', value: 1000.40, quantity: '0.38 ETH', positive: true,
    chart: 'M2 43L8 32L14 25L20 29L26 31L32 25L38 23L43 17L48 20L53 17L58 3L63 8L67 1L72 14L77 18L82 17' },
];

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatWalletValue = (value: number) => usd.format(value);
export const walletBalance = formatWalletValue(walletAssets.reduce((total, asset) => total + asset.value, 0));
