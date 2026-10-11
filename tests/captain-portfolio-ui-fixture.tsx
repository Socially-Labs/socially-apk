// Browser-only integration fixture. Never imported by the production entrypoint.
// @ts-expect-error Existing fixture pattern uses the installed React DOM client.
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { ExpoRoot, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthContext } from '@/auth/session';
import { BackendAccountProvider } from '@/auth/backend-account-provider';
import { SettingsProvider, useAccountSettings } from '@/components/settings/settings-provider';
import { DashboardShell } from '@/components/shared/dashboard/dashboard-shell';
import { HomeHeader } from '@/components/home/home-header';
import { CaptainOverview } from '@/components/home/captain-overview';
import type { CaptainPanel } from '@/components/home/captain-home-types';
import { AppFontMap } from '@/constants/fonts';
import { Text } from 'react-native';

declare global { var setCaptainFixtureAccount: (subject: string) => void; }
function Layout() {
  const [loaded] = useFonts(AppFontMap), [subject, setSubject] = useState('did:privy:captain-fixture');
  useEffect(() => { globalThis.setCaptainFixtureAccount = setSubject; }, []);
  if (!loaded) return null;
  return <SafeAreaProvider><AuthContext.Provider value={{ isReady: true, isConfigured: true, isAuthenticated: true,
    accountId: subject, email: 'vikas@example.com', getAccessToken: async () => subject, sendCode: async () => {}, verifyCode: async () => {},
    loginWithSocial: async () => {}, oauthPending: false, oauthError: null, logout: async () => {} }}>
    <BackendAccountProvider><SettingsProvider><Stack screenOptions={{ headerShown: false, animation: 'none' }} /></SettingsProvider></BackendAccountProvider>
  </AuthContext.Provider></SafeAreaProvider>;
}
function Home() {
  const { width } = useWindowDimensions(), [panel, setPanel] = useState<CaptainPanel | null>(null);
  const { settings, fallbackProfile } = useAccountSettings();
  return <DashboardShell variant="captain" fixed><HomeHeader name={settings.name} avatar={settings.avatar} photoUri={settings.photoUri}
    fallbackId={fallbackProfile.id} greeting={settings.name.split(' ')[0]} role="captain" onProfile={() => {}} onNotifications={() => {}} unreadCount={0} notificationsOpen={false} />
    <CaptainOverview compact={width < 360} panel={panel} onPanel={setPanel} />
  </DashboardShell>;
}
const modules: Record<string, { default: () => React.JSX.Element | null }> = { './_layout.tsx': { default: Layout }, './index.tsx': { default: Home },
  './vaults/[id].tsx': { default: () => <Text testID="fixture-vault-route">Vault details</Text> },
  './vaults/create.tsx': { default: () => <Text testID="fixture-create-route">Create vault</Text> } };
const context = Object.assign((key: string) => modules[key], { keys: () => Object.keys(modules), resolve: (key: string) => key, id: 'captain-portfolio-fixture' });
createRoot(document.getElementById('root')!).render(<ExpoRoot context={context} />);
