import type { AccountRole } from '@/components/settings/profile-model';

export type HomeNotification = {
  id: string;
  icon: 'allocation' | 'captain' | 'wallet' | 'crew' | 'exit' | 'compass';
  title: string;
  copy: string;
  privateCopy?: string;
  time: string;
  unread?: boolean;
  exitVaultId?: string;
};

// Preview data, like the Home portfolio and Captain dashboard. Replace these
// fixtures with the notification feed when the account service is connected.
export const sampleHomeNotifications: Record<AccountRole, readonly HomeNotification[]> = {
  crew: [
    { id: 'crew-allocation', icon: 'allocation', title: 'Allocation confirmed', copy: '$500.00 added to Horizon Growth.', privateCopy: 'An allocation was added to Horizon Growth.', time: '12 min ago', unread: true },
    { id: 'crew-captain', icon: 'captain', title: 'Atlas posted an update', copy: 'See what changed in your vault.', time: '1 hr ago', unread: true },
    { id: 'crew-deposit', icon: 'wallet', title: 'Deposit received', copy: '250.00 USDC added to your wallet.', privateCopy: 'A deposit was added to your wallet.', time: '2 hr ago', unread: true },
    { id: 'crew-vault', icon: 'captain', title: 'A note from your Captain', copy: 'Horizon Growth shared a vault update.', time: 'Yesterday' },
    { id: 'crew-wallet', icon: 'wallet', title: 'Your wallet is ready', copy: 'Keep track of deposits and allocations.', time: 'Yesterday' },
    { id: 'crew-welcome', icon: 'compass', title: 'Welcome aboard', copy: 'Your next voyage starts here.', time: '2 days ago' },
  ],
  captain: [
    { id: 'captain-allocation', icon: 'allocation', title: 'A new allocation aboard', copy: 'Horizon Growth received $2,500.00.', privateCopy: 'Horizon Growth received a new allocation.', time: '12 min ago', unread: true },
    { id: 'captain-crew', icon: 'crew', title: 'Your Crew is growing', copy: '2 members joined Solana Current.', time: '1 hr ago', unread: true },
    { id: 'captain-exits', icon: 'exit', title: 'Exit requests to review', copy: 'The Long View has 2 requests awaiting liquidity.', time: '2 hr ago', unread: true, exitVaultId: 'long-view' },
    { id: 'captain-vault', icon: 'captain', title: 'Your vaults are under way', copy: 'Manage your strategies from Home.', time: 'Yesterday' },
    { id: 'captain-welcome', icon: 'compass', title: 'Welcome aboard', copy: 'Trade. Grow. Build your Crew.', time: '2 days ago' },
  ],
};
