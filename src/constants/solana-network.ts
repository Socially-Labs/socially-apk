/** Production networking remains disabled until mainnet funding is ready. */
export const SOLANA_NETWORK = {
  id: 'devnet', label: 'Solana Devnet', rpcUrl: process.env.EXPO_PUBLIC_SOLANA_DEVNET_RPC_URL?.trim() || 'https://api.devnet.solana.com',
  genesisHash: 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG',
  usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  solMint: 'So11111111111111111111111111111111111111112',
} as const;
export type SwapToken = 'SOL' | 'USDC';
export const swapMint = (token: SwapToken) => token === 'SOL' ? SOLANA_NETWORK.solMint : SOLANA_NETWORK.usdcMint;
export const swapDecimals = (token: SwapToken) => token === 'SOL' ? 9 : 6;
