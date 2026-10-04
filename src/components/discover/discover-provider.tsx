import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { useAuth } from '@/auth/session';
import { useTestAccess } from '@/auth/test-access';
import { selectionFeedback } from '@/components/shared/feedback';

const DiscoverContext = createContext<{ saved: string[]; toggleSaved: (id: string) => void; following: string[]; toggleFollowing: (id: string) => void } | null>(null);
export function DiscoverProvider({ children }: PropsWithChildren) {
  const { accountId } = useAuth();
  const { hasTestAccess } = useTestAccess();
  return <SessionDiscoverProvider key={accountId ?? (hasTestAccess ? 'preview' : 'signed-out')}>{children}</SessionDiscoverProvider>;
}
function SessionDiscoverProvider({ children }: PropsWithChildren) {
  const [saved, setSaved] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  function toggleSaved(id: string) {
    selectionFeedback();
    setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }
  function toggleFollowing(id: string) {
    selectionFeedback();
    setFollowing(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }
  return <DiscoverContext.Provider value={{ saved, toggleSaved, following, toggleFollowing }}>{children}</DiscoverContext.Provider>;
}
export function useDiscover() {
  const context = useContext(DiscoverContext);
  if (!context) throw new Error('DiscoverProvider is required');
  return context;
}
