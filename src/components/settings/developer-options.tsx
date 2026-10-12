import { useHomePreview } from '@/components/dev/home-preview-provider';
import { useAccountSettings } from './settings-provider';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { SettingsPalette as S } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
import type { ToastPreviewKind } from '@/components/notifications/notification-provider';

/** Local UI preview only; never writes the account's signup role. */
export function DeveloperOptions({ onPreviewToast }: { onPreviewToast?: (kind: ToastPreviewKind) => void }) {
  const { role: previewRole, setRole } = useHomePreview();
  const { settings } = useAccountSettings();
  const role = previewRole ?? settings.role ?? 'crew';
  if (!__DEV__) return null;

  return <View testID="settings-developer-options" style={styles.content}>
    <Text style={styles.title}>Role preview</Text>
    <Text style={styles.caption}>Preview Captain Home and Markets or the Crew experience without changing your account role.</Text>
    <View accessibilityRole="tablist" accessibilityLabel="Home role preview" style={styles.controls}>
      {(['captain', 'crew'] as const).map(value => <AuthButton key={value}
        testID={`settings-home-preview-${value}`} accessibilityRole="tab" accessibilityLabel={`Preview ${value === 'captain' ? 'Captain' : 'Crew'} experience`}
        accessibilityState={{ selected: role === value }} aria-selected={role === value}
        onPress={() => setRole(value)} style={[styles.option, role === value && styles.selected]}>
        <Text style={[styles.label, role === value && styles.selectedLabel]}>{value === 'captain' ? 'Captain' : 'Crew'}</Text>
      </AuthButton>)}
    </View>
    {onPreviewToast ? <>
      <Text style={styles.title}>Notification preview</Text>
      <Text style={styles.caption}>Try the pearl toast and its light sweep. These examples don’t create account activity.</Text>
      <View style={styles.controls}>
        <AuthButton testID="preview-toast-crew" accessibilityRole="button" onPress={() => onPreviewToast('crew')} style={styles.option}>
          <Text style={styles.label}>Crew joined</Text>
        </AuthButton>
        <AuthButton testID="preview-toast-sol" accessibilityRole="button" onPress={() => onPreviewToast('sol')} style={styles.option}>
          <Text style={styles.label}>SOL added</Text>
        </AuthButton>
      </View>
    </> : null}
  </View>;
}

const styles = StyleSheet.create({
  content: { paddingVertical: 16, gap: 8 },
  title: { fontFamily: InterFont.medium, fontSize: S.rowTitleSize, lineHeight: 21, color: S.ink },
  caption: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 17, color: S.secondary },
  controls: { flexDirection: 'row', padding: 3, borderRadius: 13, backgroundColor: S.iconWell, marginTop: 4 },
  option: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  selected: { backgroundColor: S.solidSurface },
  label: { fontFamily: InterFont.medium, fontSize: 12, lineHeight: 17, color: S.secondary },
  selectedLabel: { fontFamily: InterFont.semiBold, color: S.ink },
});
