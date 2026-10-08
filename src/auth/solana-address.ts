type LinkedAccount = {
  type?: string; address?: string; chainType?: string; chain_type?: string;
  walletClientType?: string; wallet_client_type?: string;
};

/** Privy uses camelCase on web and snake_case on native. Never fall back to an EVM address. */
export function linkedSolanaAddress(accounts: readonly LinkedAccount[] | null | undefined): string | null {
  const wallets = accounts?.filter(account => account.type === 'wallet' &&
    (account.chainType ?? account.chain_type) === 'solana' &&
    typeof account.address === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(account.address)) ?? [];
  const wallet = wallets.find(account => (account.walletClientType ?? account.wallet_client_type) === 'privy') ?? wallets[0];
  return wallet?.address ?? null;
}
