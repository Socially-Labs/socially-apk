import { PrivyProvider, useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/react-auth';
import { useCreateWallet, useSignTransaction, useWallets } from '@privy-io/react-auth/solana';
import { useEffect, useRef, useSyncExternalStore, type PropsWithChildren } from 'react';

import { privyConfig } from './config';
import { AuthContext, UnconfiguredAuthProvider } from './session';
import { linkedSolanaAddress } from './solana-address';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function SessionBridge({ children }: PropsWithChildren) {
  const { ready, authenticated, user, logout, getAccessToken } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { initOAuth, state: oauthState } = useLoginWithOAuth();
  const linkedAddress = ready && authenticated ? linkedSolanaAddress(user?.linkedAccounts) : null;
  const attemptedFor = useRef<string | null>(null);
  const createWalletRef = useRef(createWallet);
  useEffect(() => { createWalletRef.current = createWallet; }, [createWallet]);

  // Login used to stop at the email account. An existing session still needs its embedded Solana wallet.
  useEffect(() => {
    const accountId = user?.id;
    if (!ready || !authenticated || !accountId || linkedAddress || attemptedFor.current === accountId) return;
    attemptedFor.current = accountId;
    void createWalletRef.current().catch(() => undefined);
  }, [ready, authenticated, user?.id, linkedAddress]);

  return (
    <AuthContext.Provider value={{
      isReady: ready,
      isConfigured: true,
      isAuthenticated: ready && authenticated,
      accountId: user?.id ?? null,
      solanaAddress: linkedAddress,
      signSolanaTransaction: async (transaction, expectedAddress) => {
        if (!ready || !authenticated || linkedAddress !== expectedAddress) throw new Error('Your wallet changed. Please review the swap again.');
        const wallet = wallets.find(item => item.address === expectedAddress);
        if (!wallet) throw new Error('Your Solana wallet is still connecting. Please try again.');
        const { signedTransaction } = await signTransaction({ transaction, wallet, chain: 'solana:devnet' });
        return signedTransaction;
      },
      email: user?.email?.address ?? null,
      sendCode: async (email) => { await sendCode({ email }); },
      verifyCode: async (_email, code) => { await loginWithCode({ code }); },
      loginWithSocial: async (provider) => { await initOAuth({ provider }); },
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
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);

  if (!privyConfig.appId || !mounted) {
    return <UnconfiguredAuthProvider isReady={mounted}>{children}</UnconfiguredAuthProvider>;
  }

  return (
    <PrivyProvider appId={privyConfig.appId} config={{ loginMethods: ['email', 'google', 'apple', 'twitter'], embeddedWallets: { solana: { createOnLogin: 'users-without-wallets' } } }}>
      <SessionBridge>{children}</SessionBridge>
    </PrivyProvider>
  );
}
