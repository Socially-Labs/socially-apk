import { PrivyProvider, useEmbeddedSolanaWallet, useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/expo';
import { useEffect, useRef, type PropsWithChildren } from 'react';

import { privyConfig } from './config';
import { AuthContext, UnconfiguredAuthProvider } from './session';
import { linkedSolanaAddress } from './solana-address';

const solanaAddressPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function SessionBridge({ children }: PropsWithChildren) {
  const { isReady, user, logout, getAccessToken, refreshUser } = usePrivy();
  const solanaWallet = useEmbeddedSolanaWallet();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { login, state: oauthState } = useLoginWithOAuth();
  const emailAccount = user?.linked_accounts.find((account) => account.type === 'email');
  const linkedAddress = isReady ? linkedSolanaAddress(user?.linked_accounts) : null;
  const connectedAddress = solanaWallet.status === 'connected' && solanaAddressPattern.test(solanaWallet.publicKey) ? solanaWallet.publicKey : null;
  const attemptedFor = useRef<string | null>(null);

  // Login used to stop at the email account. An existing session still needs its embedded Solana wallet.
  useEffect(() => {
    const accountId = user?.id;
    if (!isReady || !accountId || linkedAddress || solanaWallet.status !== 'not-created' || attemptedFor.current === accountId) return;
    attemptedFor.current = accountId;
    void solanaWallet.create().then(() => refreshUser()).catch(() => undefined);
  }, [isReady, user?.id, linkedAddress, solanaWallet.status, solanaWallet.create, refreshUser]);

  return (
    <AuthContext.Provider value={{
      isReady,
      isConfigured: true,
      isAuthenticated: isReady && user !== null,
      accountId: user?.id ?? null,
      solanaAddress: linkedAddress ?? connectedAddress,
      email: emailAccount?.type === 'email' ? emailAccount.address : null,
      sendCode: async (email) => { await sendCode({ email }); },
      verifyCode: async (email, code) => { await loginWithCode({ email, code }); },
      loginWithSocial: async (provider) => {
        await login({ provider, redirectUri: '/sign-in', isLegacyAppleIosBehaviorEnabled: true });
      },
      oauthPending: oauthState.status === 'loading',
      oauthError: oauthState.status === 'error' ? oauthState.error : null,
      logout,
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
