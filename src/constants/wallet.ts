export type WalletAsset = {
  symbol: 'USDC' | 'SOL' | 'BTC' | 'ETH';
  name: string;
  network: 'Solana' | 'Solana (Wormhole)';
  value: number;
  quantity: string;
};

// Preview holdings from the design reference, separate from staked allocations.
export const walletAssets: readonly WalletAsset[] = [
  { symbol: 'USDC', name: 'USD Coin', network: 'Solana', value: 4230.50, quantity: '4,230.50 USDC' },
  { symbol: 'SOL', name: 'Solana', network: 'Solana', value: 3980.10, quantity: '18.42 SOL' },
  { symbol: 'BTC', name: 'Bitcoin', network: 'Solana (Wormhole)', value: 1291.20, quantity: '0.0124 BTC' },
  { symbol: 'ETH', name: 'Ethereum', network: 'Solana (Wormhole)', value: 1000.40, quantity: '0.38 ETH' },
];

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatWalletValue = (value: number) => usd.format(value);
export const walletBalance = formatWalletValue(walletAssets.reduce((total, asset) => total + asset.value, 0));
