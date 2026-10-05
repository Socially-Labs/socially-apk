export type ProfileAvatarKind = 'captain' | 'initials';
export type AccountRole = 'crew' | 'captain';
export type AccountSettings = {
  name: string; username: string; bio: string; avatar: ProfileAvatarKind;
  photoUri: string | null; bannerUri: string | null; hideBalances: boolean;
  role: AccountRole | null;
};
export type ProfileDraft = Omit<AccountSettings, 'hideBalances' | 'role'>;

export function usernameError(username: string): string | null {
  if (!username) return 'Choose a username.';
  if (!/^[a-z0-9_]{3,24}$/.test(username)) return 'Use 3–24 letters, numbers or underscores.';
  if (!/^[a-z]/.test(username)) return 'Start your username with a letter.';
  return null;
}

export function defaultUsername(name: string) {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
  return !usernameError(cleaned) ? cleaned : `crew_${cleaned}`.slice(0, 24);
}

export function profileFromSettings(settings: AccountSettings): ProfileDraft {
  const { hideBalances: _, role: __, ...profile } = settings;
  return profile;
}
