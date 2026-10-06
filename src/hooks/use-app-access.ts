import { useBackendAccount } from '@/auth/backend-account-provider';
import { useAuth } from '@/auth/session';
import { useAuthCompletion } from '@/auth/auth-completion-provider';
import { useTestAccess } from '@/auth/test-access';
import { useAccountSettings } from '@/components/settings/settings-provider';

/** A session alone cannot skip an unfinished signup or a failed profile load. */
export function useAppAccess() {
  const { isAuthenticated } = useAuth();
  const { hasTestAccess, needsTestOnboarding } = useTestAccess();
  const { settings, ready, loadError } = useAccountSettings();
  const backend = useBackendAccount();
  const { pending: loginCompleting } = useAuthCompletion();
  const backendReady = backend.status === 'ready' && backend.account !== null;
  const preview = hasTestAccess && !isAuthenticated;
  const hasSession = isAuthenticated || hasTestAccess;
  const needsOnboarding = (preview && (needsTestOnboarding || settings.role === null)) || (isAuthenticated && backendReady && backend.account?.username === null);
  return {
    hasSession,
    needsOnboarding,
    canEnterApp: hasSession && ready && !loadError && !needsOnboarding && !loginCompleting && (preview || backendReady),
    profileSettled: !hasSession || ready,
  };
}
