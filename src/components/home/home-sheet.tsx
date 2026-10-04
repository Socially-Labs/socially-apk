import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont, InterFont } from '@/constants/fonts';
import { portfolio } from '@/constants/portfolio';
import { Dashboard } from '@/constants/theme';
import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export type HomeSheetKind = 'notifications' | 'portfolio' | 'profile';

export function HomeSheet({ sheet, greeting, email, bio, pending, error, previewing, onClose, onSettings, onSignOut }: {
  sheet: HomeSheetKind | null; greeting: string; email: string | null; bio: string; pending: boolean; error: string | null;
  previewing: boolean; onClose: () => void; onSettings: () => void; onSignOut: () => void;
}) {
  return (
    <DashboardSheet visible={sheet !== null} title={sheet === 'profile' ? 'Your profile' : sheet === 'portfolio' ? 'Portfolio overview' : 'Notifications'} onClose={onClose}>
      {sheet === 'profile' ? <View style={styles.sheetContent}>
        <Image source={require('@/assets/images/splash-icon.png')} style={styles.profileLogo} contentFit="contain" />
        <Text style={styles.wordmark}>SOCIALLY</Text>
        <Text style={styles.sheetTitle}>Hello, {greeting}</Text>
        {email ? <Text style={styles.sheetCopy}>{email}</Text> : null}
        {bio ? <Text style={styles.sheetCopy}>{bio}</Text> : null}
        <AuthButton accessibilityRole="button" onPress={onSettings} style={styles.signOut}>
          <Text style={styles.signOutText}>Manage profile & settings</Text>
        </AuthButton>
        <AuthButton accessibilityRole="button" onPress={onSignOut} disabled={pending} style={styles.signOut}>
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
  );
}

const styles = StyleSheet.create({
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
