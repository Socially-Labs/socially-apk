import { createContext, useContext, type PropsWithChildren } from 'react';

export type SocialProvider = 'google' | 'apple' | 'twitter';

export type AuthSession = {
  isReady: boolean;
  isConfigured: boolean;
  isAuthenticated: boolean;
  email: string | null;
  accountId: string | null;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  loginWithSocial: (provider: SocialProvider) => Promise<void>;
  oauthPending: boolean;
  oauthError: unknown;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthSession | null>(null);

export function useAuth() {
  const session = useContext(AuthContext);
  if (!session) throw new Error('useAuth must be used inside AuthProvider.');
  return session;
}

const unavailable = async () => {
  throw new Error('AUTH_NOT_CONFIGURED');
};

export function UnconfiguredAuthProvider({ children, isReady = true }: PropsWithChildren<{ isReady?: boolean }>) {
  return (
    <AuthContext.Provider value={{
      isReady, isConfigured: false, isAuthenticated: false, email: null, accountId: null,
      sendCode: unavailable, verifyCode: unavailable, loginWithSocial: unavailable,
      oauthPending: false, oauthError: null, logout: unavailable,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
