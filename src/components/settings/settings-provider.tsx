import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';

import { useAuth } from '@/auth/session';
import { settingsStorage } from './settings-storage';
import { defaultUsername, usernameError, type AccountSettings, type ProfileDraft } from './profile-model';
import { deleteMedia, persistMedia, restoreMediaUri } from './profile-media';

export type { ProfileAvatarKind, AccountSettings, ProfileDraft } from './profile-model';
type SettingsContextValue = {
  settings: AccountSettings; ready: boolean; saving: boolean; error: string | null;
  loadError: string | null; reloadSettings: () => void;
  profileDraft: ProfileDraft | null;
  updateProfileDraft: (draft: ProfileDraft | null) => void;
  updateSettings: (patch: Partial<AccountSettings>) => Promise<void>;
};
const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: PropsWithChildren) {
  const { accountId, email, isAuthenticated } = useAuth();
  const identity = accountId ?? (isAuthenticated ? email : null) ?? 'preview';
  return <AccountSettingsProvider identity={identity} email={email}>{children}</AccountSettingsProvider>;
}

function initialSettings(identity: string, email: string | null): AccountSettings {
  return {
    name: identity === 'preview' ? 'Vikas Kumar' : email?.split('@')[0].replace(/[._-]/g, ' ') || 'Crew member',
    username: defaultUsername(identity === 'preview' ? 'vikas kumar' : email?.split('@')[0] || 'crew_member'),
    bio: '', avatar: 'captain', photoUri: null, bannerUri: null, hideBalances: false, role: null,
  };
}

function AccountSettingsProvider({ identity, email, children }: PropsWithChildren<{ identity: string; email: string | null }>) {
  // Stable account IDs prevent social-login accounts from sharing another user's profile.
  // Hex encoding also satisfies SecureStore's restricted key character set.
  const storageKey = `socially.settings.v1.${Array.from(identity, c => c.charCodeAt(0).toString(16).padStart(4, '0')).join('')}`;
  const [settings, setSettings] = useState<AccountSettings>(() => initialSettings(identity, email));
  const [settingsIdentity, setSettingsIdentity] = useState(identity);
  const current = useRef(settings);
  const currentIdentity = useRef(identity);
  const generation = useRef(0);
  const writing = useRef(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  // Keep unfinished edits across route changes, scoped to this account's mounted
  // provider. Switching accounts or signing out drops the draft automatically.
  const [profileDraft, updateProfileDraft] = useState<ProfileDraft | null>(null);

  // Reset account data before children can read it, while preserving the auth
  // card, splash clock and native navigator through the session change.
  if (settingsIdentity !== identity) {
    setSettingsIdentity(identity);
    setSettings(initialSettings(identity, email));
    setReady(false);
    setSaving(false);
    setError(null);
    setLoadError(null);
    updateProfileDraft(null);
  }

  useEffect(() => {
    if (currentIdentity.current !== identity) {
      currentIdentity.current = identity;
      current.current = initialSettings(identity, email);
      writing.current = false;
    }
  }, [identity, email]);

  useEffect(() => {
    let active = true;
    generation.current += 1;
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
        role: (stored.role === 'crew' || stored.role === 'captain') && typeof stored.username === 'string' && !usernameError(stored.username) ? stored.role : null,
      };
      current.current = next;
      setSettings(next);
    }).catch(() => { if (active) setLoadError('Your profile couldn’t be loaded. Please try again.'); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; generation.current += 1; };
  }, [storageKey, loadAttempt]);

  function reloadSettings() {
    setReady(false);
    setLoadError(null);
    setLoadAttempt(attempt => attempt + 1);
  }

  async function updateSettings(patch: Partial<AccountSettings>) {
    if (!ready || writing.current) throw new Error('Please wait for your settings to finish loading or saving.');
    const next = { ...current.current, ...patch };
    if (!next.name.trim() || next.name.length > 40 || next.bio.length > 140) throw new Error('Enter a name of up to 40 characters and a bio of up to 140 characters.');
    const validationError = usernameError(next.username);
    if (validationError) throw new Error(validationError);
    if (next.role !== null && next.role !== 'crew' && next.role !== 'captain') throw new Error('Choose Captain or Crew.');
    if (loadError) throw new Error(loadError);
    const previous = current.current;
    const saveGeneration = generation.current;
    writing.current = true;
    setSaving(true);
    setError(null);
    try {
      // Copy out of the picker cache before committing metadata. A failed write
      // leaves the previous profile intact and the draft available for retry.
      next.photoUri = await persistMedia(next.photoUri);
      next.bannerUri = await persistMedia(next.bannerUri);
      await settingsStorage.write(storageKey, JSON.stringify(next));
      if (generation.current === saveGeneration) {
        current.current = next;
        setSettings(next);
        if (Object.keys(patch).some(key => key !== 'hideBalances')) updateProfileDraft(null);
      }
      if (previous.photoUri !== next.photoUri) void deleteMedia(previous.photoUri);
      if (previous.bannerUri !== next.bannerUri) void deleteMedia(previous.bannerUri);
    } catch {
      if (next.photoUri !== previous.photoUri) void deleteMedia(next.photoUri);
      if (next.bannerUri !== previous.bannerUri) void deleteMedia(next.bannerUri);
      const message = 'Your changes couldn’t be saved. Please try again.';
      if (generation.current === saveGeneration) setError(message);
      throw new Error(message);
    } finally { if (generation.current === saveGeneration) { writing.current = false; setSaving(false); } }
  }

  return <SettingsContext.Provider value={{ settings, ready, saving, error, loadError, reloadSettings, profileDraft, updateProfileDraft, updateSettings }}>{children}</SettingsContext.Provider>;
}

export function useAccountSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useAccountSettings must be used inside SettingsProvider.');
  return context;
}
