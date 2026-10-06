import { PrivyProvider, useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/expo';
import type { PropsWithChildren } from 'react';

import { privyConfig } from './config';
import { AuthContext, UnconfiguredAuthProvider } from './session';

function SessionBridge({ children }: PropsWithChildren) {
  const { isReady, user, logout, getAccessToken } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { login, state: oauthState } = useLoginWithOAuth();
  const emailAccount = user?.linked_accounts.find((account) => account.type === 'email');

  return (
    <AuthContext.Provider value={{
      isReady,
      isConfigured: true,
      isAuthenticated: isReady && user !== null,
      accountId: user?.id ?? null,
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
    <PrivyProvider appId={privyConfig.appId} clientId={privyConfig.clientId}>
      <SessionBridge>{children}</SessionBridge>
    </PrivyProvider>
  );
}
