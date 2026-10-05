import { useAuth } from '@/auth/session';
import { useTestAccess } from '@/auth/test-access';
import { useAccountSettings } from '@/components/settings/settings-provider';

/** A session alone cannot skip an unfinished signup or a failed profile load. */
export function useAppAccess() {
  const { isAuthenticated } = useAuth();
  const { hasTestAccess, needsTestOnboarding } = useTestAccess();
  const { settings, ready, loadError } = useAccountSettings();
  const hasSession = isAuthenticated || hasTestAccess;
  const needsOnboarding = needsTestOnboarding || (isAuthenticated && settings.role === null);
  return {
    hasSession,
    needsOnboarding,
    canEnterApp: hasSession && ready && !loadError && !needsOnboarding,
    profileSettled: !hasSession || ready,
  };
}
