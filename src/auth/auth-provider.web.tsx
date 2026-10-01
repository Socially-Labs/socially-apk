import { PrivyProvider, useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/react-auth';
import { useSyncExternalStore, type PropsWithChildren } from 'react';

import { privyConfig } from './config';
import { AuthContext, UnconfiguredAuthProvider } from './session';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function SessionBridge({ children }: PropsWithChildren) {
  const { ready, authenticated, user, logout } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { initOAuth, state: oauthState } = useLoginWithOAuth();

  return (
    <AuthContext.Provider value={{
      isReady: ready,
      isConfigured: true,
      isAuthenticated: ready && authenticated,
      email: user?.email?.address ?? null,
      sendCode: async (email) => { await sendCode({ email }); },
      verifyCode: async (_email, code) => { await loginWithCode({ code }); },
      loginWithSocial: async (provider) => { await initOAuth({ provider }); },
      oauthPending: oauthState.status === 'loading',
      oauthError: oauthState.status === 'error' ? oauthState.error : null,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: PropsWithChildren) {
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);

  if (!privyConfig.appId || !mounted) {
    return <UnconfiguredAuthProvider isReady={mounted}>{children}</UnconfiguredAuthProvider>;
  }

  return (
    <PrivyProvider appId={privyConfig.appId} config={{ loginMethods: ['email', 'google', 'apple', 'twitter'] }}>
      <SessionBridge>{children}</SessionBridge>
    </PrivyProvider>
  );
}
