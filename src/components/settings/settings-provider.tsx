import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';

import { useAuth } from '@/auth/session';
import { settingsStorage } from './settings-storage';
import { defaultUsername, usernameError, type AccountSettings, type ProfileDraft } from './profile-model';
import { deleteMedia, persistMedia, restoreMediaUri } from './profile-media';

export type { ProfileAvatarKind, AccountSettings, ProfileDraft } from './profile-model';
type SettingsContextValue = {
  settings: AccountSettings; ready: boolean; saving: boolean; error: string | null;
  profileDraft: ProfileDraft | null;
  updateProfileDraft: (draft: ProfileDraft | null) => void;
  updateSettings: (patch: Partial<AccountSettings>) => Promise<void>;
};
const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: PropsWithChildren) {
  const { accountId, email, isAuthenticated } = useAuth();
  const identity = accountId ?? (isAuthenticated ? email : null) ?? 'preview';
  return <AccountSettingsProvider key={identity} identity={identity} email={email}>{children}</AccountSettingsProvider>;
}

function AccountSettingsProvider({ identity, email, children }: PropsWithChildren<{ identity: string; email: string | null }>) {
  // Stable account IDs prevent social-login accounts from sharing another user's profile.
  // Hex encoding also satisfies SecureStore's restricted key character set.
  const storageKey = `socially.settings.v1.${Array.from(identity, c => c.charCodeAt(0).toString(16).padStart(4, '0')).join('')}`;
  const [settings, setSettings] = useState<AccountSettings>({
    name: identity === 'preview' ? 'Vikas Kumar' : email?.split('@')[0].replace(/[._-]/g, ' ') || 'Crew member',
    username: defaultUsername(identity === 'preview' ? 'vikas kumar' : email?.split('@')[0] || 'crew_member'),
    bio: '', avatar: 'captain', photoUri: null, bannerUri: null, hideBalances: false,
  });
  const current = useRef(settings);
  const writing = useRef(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Keep unfinished edits across route changes, scoped to this account's mounted
  // provider. Switching accounts or signing out drops the draft automatically.
  const [profileDraft, updateProfileDraft] = useState<ProfileDraft | null>(null);

  useEffect(() => {
    let active = true;
    settingsStorage.read(storageKey).then(raw => {
      if (!active || !raw) return;
      const stored = JSON.parse(raw) as Partial<AccountSettings>;
      if (!stored || typeof stored !== 'object') return;
      const next: AccountSettings = {
        name: typeof stored.name === 'string' && stored.name.trim() ? stored.name.trim().slice(0, 40) : current.current.name,
        bio: typeof stored.bio === 'string' ? stored.bio.slice(0, 140) : '',
        username: typeof stored.username === 'string' && !usernameError(stored.username) ? stored.username : defaultUsername(typeof stored.name === 'string' ? stored.name : current.current.name),
        avatar: stored.avatar === 'initials' ? 'initials' : 'captain',
        photoUri: restoreMediaUri(stored.photoUri),
        bannerUri: restoreMediaUri(stored.bannerUri),
        hideBalances: stored.hideBalances === true,
      };
      current.current = next;
      setSettings(next);
    }).catch(() => { if (active) setError('Saved settings couldn’t be loaded. Please try again.'); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [storageKey]);

  async function updateSettings(patch: Partial<AccountSettings>) {
    if (!ready || writing.current) throw new Error('Please wait for your settings to finish loading or saving.');
    const next = { ...current.current, ...patch };
    if (!next.name.trim() || next.name.length > 40 || next.bio.length > 140) throw new Error('Enter a name of up to 40 characters and a bio of up to 140 characters.');
    const validationError = usernameError(next.username);
    if (validationError) throw new Error(validationError);
    const previous = current.current;
    writing.current = true;
    setSaving(true);
    setError(null);
    try {
      // Copy out of the picker cache before committing metadata. A failed write
      // leaves the previous profile intact and the draft available for retry.
      next.photoUri = await persistMedia(next.photoUri);
      next.bannerUri = await persistMedia(next.bannerUri);
      await settingsStorage.write(storageKey, JSON.stringify(next));
      current.current = next;
      setSettings(next);
      if (Object.keys(patch).some(key => key !== 'hideBalances')) updateProfileDraft(null);
      if (previous.photoUri !== next.photoUri) void deleteMedia(previous.photoUri);
      if (previous.bannerUri !== next.bannerUri) void deleteMedia(previous.bannerUri);
    } catch {
      if (next.photoUri !== previous.photoUri) void deleteMedia(next.photoUri);
      if (next.bannerUri !== previous.bannerUri) void deleteMedia(next.bannerUri);
      const message = 'Your changes couldn’t be saved. Please try again.';
      setError(message);
      throw new Error(message);
    } finally { writing.current = false; setSaving(false); }
  }

  return <SettingsContext.Provider value={{ settings, ready, saving, error, profileDraft, updateProfileDraft, updateSettings }}>{children}</SettingsContext.Provider>;
}

export function useAccountSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useAccountSettings must be used inside SettingsProvider.');
  return context;
}
