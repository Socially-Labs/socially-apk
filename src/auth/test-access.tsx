import { createContext, useContext, useState, type PropsWithChildren } from 'react';

// Preview is opt-in, development-only, and never creates a backend session.
export const AUTH_TEST_MODE = __DEV__ && process.env.EXPO_PUBLIC_AUTH_PREVIEW === 'true';

type TestAccess = {
  hasTestAccess: boolean;
  needsTestOnboarding: boolean;
  enterTestApp: () => void;
  beginTestSignup: () => void;
  completeTestSignup: () => void;
  leaveTestApp: () => void;
};

const TestAccessContext = createContext<TestAccess | null>(null);

/** In-memory preview access; this does not create a Privy account or session. */
export function TestAccessProvider({ children }: PropsWithChildren) {
  const [entered, setEntered] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  return (
    <TestAccessContext.Provider value={{
      hasTestAccess: AUTH_TEST_MODE && entered,
      needsTestOnboarding: AUTH_TEST_MODE && needsOnboarding,
      enterTestApp: () => { if (AUTH_TEST_MODE) { setNeedsOnboarding(false); setEntered(true); } },
      beginTestSignup: () => { if (AUTH_TEST_MODE) { setNeedsOnboarding(true); setEntered(true); } },
      completeTestSignup: () => setNeedsOnboarding(false),
      leaveTestApp: () => { setEntered(false); setNeedsOnboarding(false); },
    }}>
      {children}
    </TestAccessContext.Provider>
  );
}

export function useTestAccess() {
  const access = useContext(TestAccessContext);
  if (!access) throw new Error('useTestAccess must be used inside TestAccessProvider.');
  return access;
}
