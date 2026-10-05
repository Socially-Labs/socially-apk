import { authErrorMessage } from '@/auth/auth-errors';
import { useAuth } from '@/auth/session';
import { useTestAccess } from '@/auth/test-access';
import { useAppRole } from '@/hooks/use-app-role';
import type { AccountRole } from '@/components/settings/profile-model';
import { useAccountSettings } from '@/components/settings/settings-provider';
import { DashboardShell } from '@/components/shared/dashboard/dashboard-shell';
import { router } from 'expo-router';
import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { CaptainOverview } from './captain-overview';
import { HomeHeader } from './home-header';
import { HomeSheet, type HomeSheetKind } from './home-sheet';
import { CrewHome } from './crew-home';
import type { CaptainPanel } from './captain-home-types';
import { sampleHomeNotifications } from '@/constants/home-notifications';
import { NotificationPopover, type NotificationAnchor } from './notification-popover';

export default function HomeScreen() {
  const role = useAppRole();
  // Changing the Settings preview starts a fresh Home, including scroll and sheets.
  return <HomeContent key={role} role={role} />;
}

function HomeContent({ role }: { role: AccountRole }) {
  const { email, logout, isAuthenticated } = useAuth();
  const { hasTestAccess, leaveTestApp } = useTestAccess();
  const { settings, ready: settingsReady, updateProfileDraft } = useAccountSettings();
  const { height, width } = useWindowDimensions();
  const compact = width < 360;
  const [sheet, setSheet] = useState<HomeSheetKind | null>(null);
  const [captainPanel, setCaptainPanel] = useState<CaptainPanel | null>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<NotificationAnchor | null>(null);
  const [readNotificationIds, setReadNotificationIds] = useState<ReadonlySet<string>>(() => new Set());
  const [portfolioHidden, setPortfolioHidden] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewing = hasTestAccess && !isAuthenticated;
  const firstName = settings.name.split(/\s+/)[0];
  const greeting = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const heroSpace = Math.max(155, Math.min(height * 0.2, 190));
  const isCaptain = role === 'captain';
  const notifications = sampleHomeNotifications[role];
  const unreadCount = notifications.filter(item => item.unread && !readNotificationIds.has(item.id)).length;

  function readNotification(id: string) {
    setReadNotificationIds(current => current.has(id) ? current : new Set([...current, id]));
  }

  async function signOut() {
    if (pending) return;
    if (previewing) {
      updateProfileDraft(null);
      leaveTestApp();
      return;
    }
    setPending(true);
    setError(null);
    try { await logout(); }
    catch (cause) { setError(authErrorMessage(cause, 'logout')); }
    finally { setPending(false); }
  }

  return (
    <DashboardShell testID="home-dashboard" variant={isCaptain ? 'captain' : 'crew'}>
      <HomeHeader name={settings.name} avatar={settings.avatar} photoUri={settings.photoUri} greeting={greeting} role={role}
        onProfile={() => setSheet('profile')} onNotifications={setNotificationAnchor} unreadCount={unreadCount} notificationsOpen={notificationAnchor !== null} />
      {isCaptain ? <CaptainOverview compact={compact} heroSpace={heroSpace} panel={captainPanel} onPanel={setCaptainPanel} />
        : <CrewHome compact={compact} heroSpace={heroSpace} onOverview={hidden => { setPortfolioHidden(hidden); setSheet('portfolio'); }} />}
      <HomeSheet sheet={sheet} greeting={greeting} email={email} bio={settings.bio} pending={pending} error={error}
        previewing={previewing} hidden={!settingsReady || settings.hideBalances || portfolioHidden} onClose={() => setSheet(null)} onSignOut={() => { void signOut(); }}
        onSettings={() => { setSheet(null); router.push('/settings'); }} />
      <NotificationPopover anchor={notificationAnchor} notifications={notifications} readIds={readNotificationIds}
        hidden={!settingsReady || settings.hideBalances || portfolioHidden} onRead={readNotification}
        onReadAll={() => setReadNotificationIds(new Set(notifications.map(item => item.id)))} onClose={() => setNotificationAnchor(null)}
        onExitRequests={id => setCaptainPanel({ kind: 'exits', id })} />
    </DashboardShell>
  );
}
