import { authErrorMessage } from '@/auth/auth-errors';
import { useAuth } from '@/auth/session';
import { useTestAccess } from '@/auth/test-access';
import { MarketList } from '@/components/home/market-list';
import { PopularCaptains } from '@/components/home/popular-captains';
import { useAccountSettings } from '@/components/settings/settings-provider';
import { DashboardShell } from '@/components/shared/dashboard/dashboard-shell';
import { InterFont } from '@/constants/fonts';
import { stakedMarkets } from '@/constants/portfolio';
import { Dashboard } from '@/constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeHeader } from './home-header';
import { HomeSheet, type HomeSheetKind } from './home-sheet';
import { PortfolioSummary } from './portfolio-summary';

export default function HomeScreen() {
  const { email, logout, isAuthenticated } = useAuth();
  const { hasTestAccess, leaveTestApp } = useTestAccess();
  const { settings, updateProfileDraft } = useAccountSettings();
  const { height, width } = useWindowDimensions();
  const compact = width < 360;
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState<HomeSheetKind | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewing = hasTestAccess && !isAuthenticated;
  const firstName = settings.name.split(/\s+/)[0];
  const greeting = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const headerTop = Math.max(insets.top + 8, 54);
  const heroSpace = Math.max(100, Math.min(height * 0.354, 350) - headerTop - 48);

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
    <DashboardShell testID="home-dashboard">
      <HomeHeader name={settings.name} avatar={settings.avatar} greeting={greeting}
        onProfile={() => setSheet('profile')} onNotifications={() => setSheet('notifications')} />
      <View style={{ height: heroSpace }} pointerEvents="none" />
      <PortfolioSummary compact={compact} onOverview={() => setSheet('portfolio')} />
      <Text style={styles.sectionTitle} accessibilityRole="header">Staked Markets</Text>
      <MarketList />
      <PopularCaptains marketCount={stakedMarkets.length} />
      <HomeSheet sheet={sheet} greeting={greeting} email={email} bio={settings.bio} pending={pending} error={error}
        previewing={previewing} onClose={() => setSheet(null)} onSignOut={() => { void signOut(); }}
        onSettings={() => { setSheet(null); router.push('/settings'); }} />
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontFamily: InterFont.semiBold, fontSize: 17, lineHeight: 23, color: Dashboard.ink, marginTop: 22, marginBottom: 9, marginLeft: 2 },
});
