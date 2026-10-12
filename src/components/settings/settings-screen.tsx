import { router, useFocusEffect } from 'expo-router';
import { ArrowRight, Bell, LogOut, MoreHorizontal } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { AuthButton } from '@/components/shared/motion';
import { SettingsPalette as S, SettingsHubPalette as H } from '@/constants/theme/settings';
import { DeveloperOptions } from './developer-options';
import { ProfileAvatar } from './profile-avatar';
import { SettingsHub, SettingsInfo } from './settings-hub';
import { settingsHubStyles as s } from './settings-hub-styles';
import { LogoutSheet } from './settings-logout';
import { useAccountSettings } from './settings-provider';
import { SettingsSurface } from './settings-surface';
import { CardSkeleton } from '@/components/shared/refresh/card-skeleton';
import { useNotifications, type ToastPreviewKind } from '@/components/notifications/notification-provider';

export { appVersion } from './settings-detail-config';
function openSection(section: string) { router.push({ pathname: '/account/[section]', params: { section } }); }

export default function SettingsScreen() {
  const { settings, fallbackProfile, ready, error, loadError, reloadSettings } = useAccountSettings();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [developerOpen, setDeveloperOpen] = useState(false);
  const { previewToast, enablePush } = useNotifications();
  const [pushMessage,setPushMessage]=useState<string|null>(null);
  const [pushBusy,setPushBusy]=useState(false);
  const pendingPreview = useRef<ToastPreviewKind | null>(null);
  useFocusEffect(useCallback(() => () => { setLogoutOpen(false); setDeveloperOpen(false); }, []));

  if (!ready) return <SettingsSurface compact testID="settings-loading"><CardSkeleton label="Loading your settings…" count={2} /></SettingsSurface>;
  if (loadError) return <SettingsSurface compact testID="settings-load-error"><Text accessibilityRole="alert" style={s.error}>{loadError}</Text><AuthButton accessibilityRole="button" onPress={reloadSettings} style={s.logout}><Text style={s.infoTitle}>Retry loading settings</Text></AuthButton></SettingsSurface>;

  return <SettingsSurface compact testID="settings-dashboard">
    <View style={[s.heading, compact && s.compactHeading]}>
      <View style={s.headingCopy}>
        <Text style={[s.title, compact && s.compactTitle]} accessibilityRole="header">Settings</Text>
        <Text style={s.copy}>Manage your account and preferences.</Text>
      </View>
      {__DEV__ ? <AuthButton testID="settings-developer-open" accessibilityRole="button" accessibilityLabel="Developer options"
        onPress={() => setDeveloperOpen(true)} style={s.more}><MoreHorizontal size={20} color={H.secondary} /></AuthButton> : null}
    </View>
    <View style={[s.profile, compact && s.compactProfile]}>
      <ProfileAvatar name={settings.name} avatar={settings.avatar} photoUri={settings.photoUri} fallbackId={fallbackProfile.id} size={compact ? 48 : 64} />
      <View style={s.identity}>
        <Text style={[s.name, compact && s.compactName]} numberOfLines={2}>{settings.name}</Text>
        <Text style={[s.username, compact && s.compactUsername]} numberOfLines={1} testID="settings-username">@{settings.username}</Text>
      </View>
      <AuthButton testID="settings-profile" accessibilityRole="button" accessibilityLabel="Edit profile" accessibilityState={{ disabled: !ready }}
        disabled={!ready} onPress={() => openSection('profile')} style={[s.editProfile, compact && s.compactEdit]}>
        <Text style={[s.editText, compact && s.compactEditText]}>Edit profile</Text><ArrowRight size={compact ? 16 : 18} color={H.ink} />
      </AuthButton>
    </View>
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    <SettingsHub compact={compact} onOpen={openSection} />
    <SettingsInfo onOpen={openSection} />
    <AuthButton accessibilityRole="button" accessibilityLabel="Enable push notifications" disabled={pushBusy}
      accessibilityState={{disabled:pushBusy,busy:pushBusy}} style={s.logout} onPress={()=>{
        setPushBusy(true);setPushMessage(null);
        void enablePush().then(()=>setPushMessage('Notifications enabled for this device.')).catch(cause=>setPushMessage(cause instanceof Error?cause.message:'Could not enable notifications.')).finally(()=>setPushBusy(false));
      }}>
      <Bell size={20} color={H.ink}/><Text style={s.infoTitle}>{pushBusy?'Enabling notifications…':'Enable push notifications'}</Text><ArrowRight size={17} color={H.ink}/>
    </AuthButton>
    {pushMessage?<Text accessibilityLiveRegion="polite" style={s.copy}>{pushMessage}</Text>:null}
    <AuthButton testID="settings-logout" accessibilityRole="button" accessibilityLabel="Log out"
      accessibilityHint="Opens a confirmation before signing out" onPress={() => setLogoutOpen(true)} style={s.logout}>
      <LogOut size={20} color={S.danger} strokeWidth={1.7} /><Text style={s.logoutText}>Log out</Text><ArrowRight size={17} color={S.danger} />
    </AuthButton>
    <LogoutSheet visible={logoutOpen} onClose={() => setLogoutOpen(false)} />
    {__DEV__ ? <DashboardSheet visible={developerOpen} title="Developer options" onClose={() => setDeveloperOpen(false)}
      onDismiss={() => { const kind = pendingPreview.current; pendingPreview.current = null; if (kind) previewToast(kind); }}>
      <DeveloperOptions onPreviewToast={kind => { pendingPreview.current = kind; setDeveloperOpen(false); }} />
    </DashboardSheet> : null}
  </SettingsSurface>;
}
