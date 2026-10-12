import { useSolanaBalance } from '@/hooks/use-solana-balance';
import { useWalletFunding } from '@/hooks/use-wallet-funding';
// Browser integration fixture; excluded from the production entrypoint.
// @ts-expect-error React DOM client follows the existing browser fixture pattern.
import { createRoot } from 'react-dom/client';
import { ExpoRoot, Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AuthContext } from '@/auth/session';
import { TestAccessProvider } from '@/auth/test-access';
import { AuthCompletionProvider } from '@/auth/auth-completion-provider';
import { BackendAccountProvider } from '@/auth/backend-account-provider';
import { SettingsProvider } from '@/components/settings/settings-provider';
import { NotificationProvider } from '@/components/notifications/notification-provider';
import { AppFontMap } from '@/constants/fonts';
import { useAppAccess } from '@/hooks/use-app-access';
import { ShipLoader } from '@/components/shared/refresh/ship-loader';
import HomeScreen from '@/components/home/home-screen';
import { Text } from 'react-native';
import SettingsScreen from '@/components/settings/settings-screen';
declare global { var notificationTestNavigate: (path: '/' | '/other' | '/settings' | '/wallet-test') => void; }
const token = async () => 'did:privy:captain-fixture';
function Layout() {
  const [loaded] = useFonts(AppFontMap);
  useEffect(() => { globalThis.notificationTestNavigate = path => router.push(path as '/'); }, []);
  if (!loaded) return null;
  const safeTop = Number(new URLSearchParams(window.location.search).get('safeTop') ?? 0);
  return <SafeAreaProvider><SafeAreaInsetsContext.Provider value={{ top: safeTop, right: 0, bottom: 0, left: 0 }}><TestAccessProvider><AuthContext.Provider value={{ isReady: true, isConfigured: true, isAuthenticated: true,
    accountId: 'did:privy:captain-fixture', solanaAddress: new URLSearchParams(window.location.search).has('walletAlerts') ? '11111111111111111111111111111112' : null, email: 'vikas@example.com', getAccessToken: token, sendCode: async () => {}, verifyCode: async () => {},
    loginWithSocial: async () => {}, oauthPending: false, oauthError: null, logout: async () => {} }}>
    <AuthCompletionProvider><BackendAccountProvider><SettingsProvider><NotificationProvider><Stack screenOptions={{ headerShown: false, animation: 'none' }} /></NotificationProvider></SettingsProvider></BackendAccountProvider></AuthCompletionProvider>
  </AuthContext.Provider></TestAccessProvider></SafeAreaInsetsContext.Provider></SafeAreaProvider>;
}
function Home() { const { canEnterApp } = useAppAccess(); return canEnterApp ? <HomeScreen /> : <ShipLoader label="Loading your account…" />; }
function WalletProbe() { const sol = useSolanaBalance(); const funding = useWalletFunding(); return <Text testID="wallet-balance-probe">{sol.amount ?? 'loading'} SOL · {funding.summary?.available.amount ?? 'loading'} USDC</Text>; }
const modules: Record<string, { default: () => React.JSX.Element | null }> = { './_layout.tsx': { default: Layout }, './index.tsx': { default: Home }, './settings.tsx': { default: SettingsScreen }, './wallet-test.tsx': { default: WalletProbe }, './other.tsx': { default: () => <Text>Another Captain screen</Text> } };
const context = Object.assign((key: string) => modules[key], { keys: () => Object.keys(modules), resolve: (key: string) => key, id: 'notification-fixture' });
createRoot(document.getElementById('root')!).render(<ExpoRoot context={context} />);
