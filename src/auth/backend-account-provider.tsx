import { getApiOrigin } from '@/api/runtime-origin';
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type PropsWithChildren } from 'react';
import { createApiClient, type AccountRole, type BackendAccount, type ProfilePatch } from '@/api/client';
import { AccountStore, idleAccount, type AccountState } from '@/api/account-store';
import { readProfileUpload, uploadFetch } from '@/components/settings/profile-upload';
import { useAuth } from './session';

type AccountContextValue = Omit<AccountState, 'subject'> & {
  retry: () => void;
  usernameAvailable: (username: string, signal?: AbortSignal) => Promise<boolean>;
  saveProfile: (patch: ProfilePatch) => Promise<BackendAccount>;
  completeSignup: (username: string, role: AccountRole, displayName?: string) => Promise<BackendAccount>;
  uploadImage: (kind: 'avatar' | 'banner', uri: string) => Promise<string>;
  submitSupport: (body: { message: string; appVersion: string; platform: string }) => Promise<{ id: string; status: 'OPEN' }>;
};
class TokenSource {
  private getter: () => Promise<string | null>;
  constructor(getter: () => Promise<string | null>) { this.getter = getter; }
  update(getter: () => Promise<string | null>) { this.getter = getter; }
  read = () => this.getter();
}
const AccountContext = createContext<AccountContextValue | null>(null);

export function BackendAccountProvider({ children }: PropsWithChildren) {
  const { accountId, isReady, isAuthenticated, getAccessToken } = useAuth();
  const subject = isReady && isAuthenticated ? accountId : null;
  const [session] = useState(() => new TokenSource(getAccessToken));
  const [store] = useState(() => new AccountStore(createApiClient({ origin: getApiOrigin(),
    getAccessToken: session.read })));
  useEffect(() => { session.update(getAccessToken); }, [session, getAccessToken]);
  useEffect(() => { store.start(subject); return store.stop; }, [store, subject]);
  const state = useSyncExternalStore(store.subscribe, store.snapshot, () => idleAccount);
  // Filter synchronously on identity changes; effect cleanup cancels the old transport next.
  const current = !subject ? idleAccount : state.subject === subject ? state
    : { subject, status: 'loading' as const, account: null, error: null };
  return <AccountContext.Provider value={{ ...current, retry: store.retry,
    usernameAvailable: store.usernameAvailable, saveProfile: store.saveProfile,
    completeSignup: store.completeSignup,
    submitSupport: store.submitSupport,
    uploadImage: (kind, uri) => store.uploadImage(kind, uri, readProfileUpload, uploadFetch),
  }}>{children}</AccountContext.Provider>;
}
export function useBackendAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error('useBackendAccount must be used inside BackendAccountProvider.');
  return context;
}
