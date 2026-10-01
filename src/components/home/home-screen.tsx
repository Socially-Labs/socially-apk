import { Image } from 'expo-image';
import { Bell, ChartNoAxesColumn, Circle, TrendingUp, Users } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authErrorMessage } from '@/auth/auth-errors';
import { useAuth } from '@/auth/session';
import { useTestAccess } from '@/auth/test-access';
import { AuthButton } from '@/components/shared/motion';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { DashboardShell } from '@/components/shared/dashboard/dashboard-shell';
import { MarketList } from '@/components/home/market-list';
import { PopularCaptains } from '@/components/home/popular-captains';
import { BrandFont, InterFont } from '@/constants/fonts';
import { portfolio, stakedMarkets } from '@/constants/portfolio';
import { Dashboard } from '@/constants/theme';

export default function HomeScreen() {
  const { email, logout, isAuthenticated } = useAuth();
  const { hasTestAccess, leaveTestApp } = useTestAccess();
  const { height, width } = useWindowDimensions();
  const compact = width < 360;
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState<'notifications' | 'portfolio' | 'profile' | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewing = hasTestAccess && !isAuthenticated;
  const firstName = previewing || !email ? 'Vikas' : email.split('@')[0].split(/[._+\d-]/)[0];
  const greeting = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const headerTop = Math.max(insets.top + 8, 54);
  const heroSpace = Math.max(100, Math.min(height * 0.354, 350) - headerTop - 48);

  async function signOut() {
    if (pending) return;
    if (previewing) {
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
      <View style={styles.header}>
        <AuthButton accessibilityRole="button" accessibilityLabel="Open your profile" onPress={() => setSheet('profile')} style={styles.avatar}>
          <Image source={require('@/assets/images/branding/avatar-dev.jpg')} style={styles.profileAvatar} contentFit="cover" transition={0} accessible={false} />
        </AuthButton>
        <View style={styles.greeting}>
          <Text style={styles.hello} accessibilityRole="header">Hello, {greeting}</Text>
          <Text style={styles.subtitle}>Captain mode active.</Text>
        </View>
        <AuthButton testID="home-notifications" accessibilityRole="button" accessibilityLabel="Notifications, unread update"
          onPress={() => setSheet('notifications')} style={styles.notification}>
          <Bell size={21} color={Dashboard.ink} strokeWidth={1.7} />
          <View style={styles.notificationDot} />
        </AuthButton>
      </View>
      <View style={{ height: heroSpace }} pointerEvents="none" />
      <View style={styles.summary} testID="portfolio-summary">
        <Text style={styles.totalLabel}>Total Staked</Text>
        <Text style={[styles.total, compact && styles.compactTotal]} maxFontSizeMultiplier={1.4}>{portfolio.totalStaked}</Text>
        <AuthButton testID="portfolio-overview" accessibilityRole="button" accessibilityLabel="View portfolio overview"
          onPress={() => setSheet('portfolio')} style={styles.overview} hitSlop={4}>
          <ChartNoAxesColumn size={22} color="#687C9D" strokeWidth={2.4} />
        </AuthButton>
        <View style={styles.metrics}>
          <View style={[styles.metric, compact && styles.compactMetric]}>
            <View style={styles.marketIcon}><Circle size={15} color={Dashboard.icon} strokeWidth={1.5} /><Circle size={15} color={Dashboard.icon} strokeWidth={1.5} style={styles.overlappingCircle} /></View>
            <View style={styles.metricText}><Text style={styles.metricLabel}>Markets</Text><Text style={styles.metricValue}>{stakedMarkets.length}</Text></View>
          </View>
          <View style={styles.metricDivider} />
          <View style={[styles.metric, styles.middleMetric, compact && styles.compactMetric]}>
            <TrendingUp size={20} color={Dashboard.icon} strokeWidth={1.8} />
            <View style={styles.metricText}><Text style={styles.metricLabel}>Total PnL</Text><Text style={styles.profit}>{portfolio.pnl}</Text></View>
          </View>
          <View style={styles.metricDivider} />
          <View style={[styles.metric, styles.lastMetric, compact && styles.compactMetric]}>
            <Users size={20} color={Dashboard.icon} strokeWidth={1.8} />
            <View style={styles.metricText}><Text style={styles.metricLabel}>Crew Members</Text><Text style={styles.metricValue}>{portfolio.crewMembers}</Text></View>
          </View>
        </View>
      </View>
      <Text style={styles.sectionTitle} accessibilityRole="header">Staked Markets</Text>
      <MarketList />
      <PopularCaptains marketCount={stakedMarkets.length} />
      <DashboardSheet visible={sheet !== null} title={sheet === 'profile' ? 'Your profile' : sheet === 'portfolio' ? 'Portfolio overview' : 'Notifications'} onClose={() => setSheet(null)}>
        {sheet === 'profile' ? <View style={styles.sheetContent}>
          <Image source={require('@/assets/images/splash-icon.png')} style={styles.profileLogo} contentFit="contain" />
          <Text style={styles.wordmark}>SOCIALLY</Text>
          <Text style={styles.sheetTitle}>Hello, {greeting}</Text>
          {email ? <Text style={styles.sheetCopy}>{email}</Text> : null}
          <AuthButton accessibilityRole="button" onPress={() => { void signOut(); }} disabled={pending} style={styles.signOut}>
            {pending ? <ActivityIndicator color={Dashboard.ink} /> : <Text style={styles.signOutText}>{previewing ? 'Back to sign in' : 'Sign out'}</Text>}
          </AuthButton>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        </View> : sheet === 'portfolio' ? <View style={styles.sheetContent}>
          <Text style={styles.sheetCopy}>Total staked across 3 markets</Text>
          <Text style={styles.sheetTotal}>{portfolio.totalStaked}</Text>
          <Text style={styles.sheetProfit}>{portfolio.pnl} total PnL</Text>
          <Text style={styles.sheetCopy}>SOL 40% · BTC 37% · ETH 23%</Text>
        </View> : <View style={styles.notice}>
          <View style={styles.noticeDot} />
          <View style={styles.noticeText}><Text style={styles.sheetTitle}>Welcome aboard.</Text><Text style={styles.sheetCopy}>Your markets, crew, and wallet are all in one place.</Text></View>
        </View>}
      </DashboardSheet>
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingHorizontal: 3 },
  avatar: { width: 47, height: 47, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(215,223,236,0.72)' },
  profileAvatar: { width: 47, height: 47, borderRadius: 24 },
  greeting: { flex: 1, marginLeft: 11, gap: 3 },
  hello: { fontFamily: InterFont.semiBold, fontSize: 18, lineHeight: 23, color: Dashboard.ink },
  subtitle: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 17, color: Dashboard.secondary },
  notification: { width: 44, height: 44, borderRadius: 22, backgroundColor: Dashboard.softGlass, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { position: 'absolute', right: 10, top: 10, width: 7, height: 7, backgroundColor: Dashboard.negative, borderRadius: 4, borderWidth: 1.5, borderColor: '#FFFFFF' },
  summary: { borderRadius: 18, backgroundColor: Dashboard.glass, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 17 },
  totalLabel: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 17, color: Dashboard.secondary },
  total: { fontFamily: InterFont.medium, fontSize: 32, lineHeight: 42, letterSpacing: -0.8, color: Dashboard.ink, marginTop: 1, fontVariant: ['tabular-nums'] },
  compactTotal: { fontSize: 28 },
  overview: { position: 'absolute', top: 23, right: 17, width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.84)' },
  metrics: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  metric: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  middleMetric: { paddingLeft: 12 },
  lastMetric: { paddingLeft: 12 },
  compactMetric: { flexDirection: 'column', alignItems: 'flex-start', paddingLeft: 4, gap: 6 },
  metricText: { flex: 1, gap: 3 },
  metricLabel: { fontFamily: InterFont.regular, fontSize: 9, lineHeight: 12, color: Dashboard.secondary },
  metricValue: { fontFamily: InterFont.medium, fontSize: 14, lineHeight: 18, color: Dashboard.ink },
  profit: { fontFamily: InterFont.medium, fontSize: 12, lineHeight: 18, color: Dashboard.positive },
  metricDivider: { width: 1, height: 36, backgroundColor: Dashboard.line },
  marketIcon: { width: 21, height: 17, justifyContent: 'center' },
  overlappingCircle: { position: 'absolute', left: 6, top: 1 },
  sectionTitle: { fontFamily: InterFont.semiBold, fontSize: 17, lineHeight: 23, color: Dashboard.ink, marginTop: 22, marginBottom: 9, marginLeft: 2 },
  sheetContent: { alignItems: 'center', gap: 14, paddingVertical: 14 },
  profileLogo: { width: 64, height: 64 },
  wordmark: { fontFamily: BrandFont.wordmark, fontSize: 28, letterSpacing: 4, color: Dashboard.ink },
  sheetTitle: { fontFamily: InterFont.semiBold, fontSize: 16, lineHeight: 23, color: Dashboard.ink },
  sheetCopy: { fontFamily: InterFont.regular, fontSize: 14, lineHeight: 21, color: Dashboard.secondary },
  sheetTotal: { fontFamily: InterFont.medium, fontSize: 34, color: Dashboard.ink },
  sheetProfit: { fontFamily: InterFont.medium, fontSize: 16, color: Dashboard.positive },
  signOut: { minHeight: 48, paddingHorizontal: 24, justifyContent: 'center' },
  signOutText: { fontFamily: InterFont.medium, fontSize: 14, color: Dashboard.ink },
  error: { fontFamily: InterFont.regular, fontSize: 12, color: Dashboard.negative },
  notice: { flexDirection: 'row', gap: 14, paddingVertical: 18 },
  noticeDot: { width: 8, height: 8, marginTop: 7, backgroundColor: Dashboard.positive, borderRadius: 4 },
  noticeText: { flex: 1, gap: 6 },
});
