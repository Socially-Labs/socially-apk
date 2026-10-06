export type AuthCompletionState = { initialized: boolean; subject: string | null; pending: boolean };
export const initialAuthCompletion: AuthCompletionState = { initialized: false, subject: null, pending: false };

export function observeAuthSession(state: AuthCompletionState, ready: boolean, subject: string | null): AuthCompletionState {
  if (!ready) return state;
  // Restored sessions enter immediately; only a new login gets the success interlude.
  if (!state.initialized) return { initialized: true, subject, pending: false };
  if (state.subject === subject) return state;
  return { initialized: true, subject, pending: subject !== null };
}

export function completeAuthSession(state: AuthCompletionState, subject: string | null): AuthCompletionState {
  return state.subject === subject && state.pending ? { ...state, pending: false } : state;
}
