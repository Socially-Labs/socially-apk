import { type WalletHolding } from '@/constants/wallet';
import { type WalletAction } from './wallet-actions';

export const tabs = ['Assets', 'Vaults', 'Activity'] as const;
export type WalletTab = typeof tabs[number];
export type WalletSheet = WalletAction | 'networks' | 'options' | 'manage' | 'custom-token' | WalletHolding;
export const filters = ['All Networks', 'Solana'] as const;
export const upcomingNetworks = ['Ethereum', 'Base', 'Polygon', 'Arbitrum'] as const;
export type NetworkFilter = typeof filters[number];
