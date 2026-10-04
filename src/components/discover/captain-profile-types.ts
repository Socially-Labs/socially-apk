import { type Holding, type Trade } from '@/constants/discover';

export type ProfileTab = 'Overview' | 'Holdings' | 'Trades' | 'Vault';
export type Detail = { kind: 'metrics' } | { kind: 'risk' } | { kind: 'holding'; holding: Holding } | { kind: 'trade'; trade: Trade } | { kind: 'authority' } | { kind: 'period' } | { kind: 'actions' } | { kind: 'strategy' };
export const tabs: readonly ProfileTab[] = ['Overview', 'Holdings', 'Trades'];
