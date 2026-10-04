import { type WalletAsset } from '@/constants/wallet';
import { type WalletAction } from './wallet-actions';

export const tabs = ['Assets', 'Vaults', 'Activity'] as const;
export type WalletTab = typeof tabs[number];
export type WalletSheet = WalletAction | 'networks' | 'options' | 'manage' | 'custom-token' | WalletAsset;
export const filters = ['All Networks', 'Solana', 'Solana (Wormhole)'] as const;
export type NetworkFilter = typeof filters[number];
