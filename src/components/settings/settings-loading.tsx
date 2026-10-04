import { StyleSheet, View } from 'react-native';

import { SettingsPalette as S } from '@/constants/theme';

/** Reserve the form's major shapes while saved settings are actually loading. */
export function SettingsLoading({ profile }: { profile: boolean }) {
  return <View style={styles.card} accessible accessibilityRole="progressbar"
    accessibilityLabel="Loading saved settings" accessibilityState={{ busy: true }}>
    {profile ? <View style={styles.avatar} /> : null}
    <View style={styles.label} />
    <View style={styles.field} />
    <View style={styles.label} />
    <View style={[styles.field, profile && styles.bio]} />
    {profile ? <View style={styles.field} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { padding: 20, gap: 16, borderRadius: S.cardRadius, backgroundColor: S.surface },
  avatar: { alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: S.avatar },
  label: { width: '42%', height: 16, borderRadius: 5, backgroundColor: S.line },
  field: { height: 50, borderRadius: 14, backgroundColor: S.field },
  bio: { height: 94 },
});
