/** Account-scoped invalidations. Amounts always come from authenticated/RPC reads. */
const listeners = new Map<string, Set<() => void>>();
export function publishWalletChange(subject: string) {
  for (const listener of listeners.get(subject) ?? []) listener();
}
export function subscribeWalletChanges(subject: string, listener: () => void) {
  let group = listeners.get(subject);
  if (!group) listeners.set(subject, group = new Set());
  group.add(listener);
  return () => { group.delete(listener); if (!group.size) listeners.delete(subject); };
}
