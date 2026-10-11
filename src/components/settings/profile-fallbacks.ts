export const PROFILE_FALLBACKS = ['silver-captain', 'storm-navigator', 'ivory-corsair', 'harbor-rogue', 'midnight-quartermaster'].map((name, index) => ({
  id: index + 1, name,
}));

/** Account identity keeps the same matching pair across devices and profile edits. */
export function profileFallback(identity: string) {
  let hash = 2166136261;
  for (const character of identity) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  return PROFILE_FALLBACKS[hash % PROFILE_FALLBACKS.length]!;
}

/** An upload always wins; missing or failed uploads use the bundled pair. */
export function profileMediaUri(upload: string | null | undefined, failed: string | null) {
  return upload && upload !== failed ? upload : null;
}
