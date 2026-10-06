import { createContext, useCallback, useContext, useState, type PropsWithChildren } from 'react';
import { useAuth } from './session';
import { completeAuthSession, initialAuthCompletion, observeAuthSession } from './auth-completion-model';

const Context = createContext<{ pending: boolean; complete: () => void } | null>(null);

export function AuthCompletionProvider({ children }: PropsWithChildren) {
  const { isReady, isAuthenticated, accountId } = useAuth();
  const subject = isAuthenticated ? accountId : null;
  const [state, setState] = useState(initialAuthCompletion);
  const current = observeAuthSession(state, isReady, subject);
  // Set the route gate before descendants render the new authenticated session.
  if (current !== state) setState(current);
  const complete = useCallback(() => setState(previous => completeAuthSession(previous, subject)), [subject]);
  return <Context.Provider value={{ pending: current.pending, complete }}>{children}</Context.Provider>;
}

export function useAuthCompletion() {
  const context = useContext(Context);
  if (!context) throw new Error('useAuthCompletion must be used inside AuthCompletionProvider.');
  return context;
}
