import { SettingsPalette as S } from '@/constants/theme';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { sharedStyles } from './settings-detail-styles';
import { Card, ErrorCopy } from './settings-detail-ui';
import { useAccountSettings } from './settings-provider';

export function DisplayPreferences() {
  const { settings, ready, saving, error, updateSettings } = useAccountSettings();
  const [localError, setLocalError] = useState<string | null>(null);
  async function toggle(value: boolean) {
    setLocalError(null);
    try { await updateSettings({ hideBalances: value }); }
    catch (cause) { setLocalError(cause instanceof Error ? cause.message : 'This preference couldn’t be saved.'); }
  }
  return <Card>
    <View style={styles.switchRow}><View style={styles.flex}><Text style={styles.itemTitle}>Hide wallet balances</Text><Text style={styles.copy}>Keep your wallet amounts private until you choose to reveal them.</Text></View>
      <Switch testID="settings-hide-balances" accessibilityLabel="Hide wallet balances" value={settings.hideBalances}
        disabled={!ready || saving} onValueChange={value => { void toggle(value); }} trackColor={{ false: S.avatar, true: S.primary }} thumbColor={S.primaryInk} />
    </View>
    <ErrorCopy>{localError ?? error}</ErrorCopy>
    <View style={styles.divider} />
    <Text style={styles.itemTitle}>Appearance</Text><Text style={styles.copy}>Socially’s light voyage theme</Text>
    <Text style={styles.itemTitle}>Language</Text><Text style={styles.copy}>English</Text>
    <Text style={styles.itemTitle}>Display currency</Text><Text style={styles.copy}>USD · Token amounts retain their original units.</Text>
  </Card>;
}

const styles = StyleSheet.create({
  ...sharedStyles,
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
