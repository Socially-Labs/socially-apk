import { revokeNotificationPush } from '@/api/notification-push';
import { PrivyProvider, useEmbeddedSolanaWallet, useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/expo';
import { useEffect, useRef, type PropsWithChildren } from 'react';

import { privyConfig } from './config';
import { AuthContext, UnconfiguredAuthProvider } from './session';
import { linkedSolanaAddress } from './solana-address';
import { VersionedTransaction } from '@solana/web3.js';

const solanaAddressPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function SessionBridge({ children }: PropsWithChildren) {
  const { isReady, user, logout, getAccessToken, refreshUser } = usePrivy();
  const solanaWallet = useEmbeddedSolanaWallet();
  const walletStatus = solanaWallet.status;
  const createSolanaWallet = solanaWallet.create;
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { login, state: oauthState } = useLoginWithOAuth();
  const emailAccount = user?.linked_accounts.find((account) => account.type === 'email');
  const linkedAddress = isReady ? linkedSolanaAddress(user?.linked_accounts) : null;
  const connectedAddress = solanaWallet.status === 'connected'
    ? solanaWallet.wallets.find((wallet) => solanaAddressPattern.test(wallet.address))?.address ?? null
    : null;
  const attemptedFor = useRef<string | null>(null);

  // Login used to stop at the email account. An existing session still needs its embedded Solana wallet.
  useEffect(() => {
    const accountId = user?.id;
    if (!isReady || !accountId || linkedAddress || walletStatus !== 'not-created' || attemptedFor.current === accountId) return;
    attemptedFor.current = accountId;
    void createSolanaWallet!().then(() => refreshUser()).catch(() => undefined);
  }, [isReady, user?.id, linkedAddress, walletStatus, createSolanaWallet, refreshUser]);

  return (
    <AuthContext.Provider value={{
      isReady,
      isConfigured: true,
      isAuthenticated: isReady && user !== null,
      accountId: user?.id ?? null,
      solanaAddress: linkedAddress ?? connectedAddress,
      signSolanaTransaction: async (transaction, expectedAddress) => {
        if (!isReady || !user || (linkedAddress ?? connectedAddress) !== expectedAddress) throw new Error('Your wallet changed. Please review the swap again.');
        // Privy's hook-level publicKey/getProvider can refer to a different embedded wallet.
        // Bind the provider to the same address used to prepare this transaction.
        const wallet = solanaWallet.wallets?.find((candidate) => candidate.address === expectedAddress);
        if (!wallet) throw new Error('Your Solana wallet is still connecting. Please try again.');
        const provider = await wallet.getProvider();
        const { signedTransaction } = await provider.request({ method: 'signTransaction', params: { transaction: VersionedTransaction.deserialize(transaction) } });
        return signedTransaction.serialize();
      },
      email: emailAccount?.type === 'email' ? emailAccount.address : null,
      sendCode: async (email) => { await sendCode({ email }); },
      verifyCode: async (email, code) => { await loginWithCode({ email, code }); },
      loginWithSocial: async (provider) => {
        await login({ provider, redirectUri: '/sign-in', isLegacyAppleIosBehaviorEnabled: true });
      },
      oauthPending: oauthState.status === 'loading',
      oauthError: oauthState.status === 'error' ? oauthState.error : null,
      logout: async () => { await revokeNotificationPush().catch(() => undefined); await logout(); },
      getAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: PropsWithChildren) {
  if (!privyConfig.appId || !privyConfig.clientId) {
    return <UnconfiguredAuthProvider>{children}</UnconfiguredAuthProvider>;
  }

  return (
    <PrivyProvider appId={privyConfig.appId} clientId={privyConfig.clientId} config={{ embedded: { solana: { createOnLogin: 'users-without-wallets' } } }}>
      <SessionBridge>{children}</SessionBridge>
    </PrivyProvider>
  );
}
