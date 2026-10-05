import type { AccountRole } from '@/components/settings/profile-model';
import { createContext, useContext, useState, type PropsWithChildren } from 'react';

type HomePreview = { role: AccountRole | null; setRole: (role: AccountRole) => void };
const HomePreviewContext = createContext<HomePreview>({ role: null, setRole: () => {} });

/** Shared by the app tabs, kept in memory, and discarded when leaving the app. */
export function HomePreviewProvider({ children }: PropsWithChildren) {
  const [role, setRole] = useState<AccountRole | null>(null);
  return <HomePreviewContext.Provider value={{ role, setRole }}>{children}</HomePreviewContext.Provider>;
}

export function useHomePreview() { return useContext(HomePreviewContext); }
