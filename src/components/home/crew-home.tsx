import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAccountSettings } from '@/components/settings/settings-provider';
import { selectionFeedback } from '@/components/shared/feedback';
import { BrandFont, InterFont } from '@/constants/fonts';
import { DiscoverPalette as D } from '@/constants/theme';
import type { CrewPeriod } from '@/constants/crew-portfolio';
import { CrewPortfolioCard } from './crew-portfolio-card';
import { CrewDiscoverEntry, CrewVaults } from './crew-vaults';

export function CrewHome({ compact, heroSpace, onOverview }: { compact: boolean; heroSpace: number; onOverview: (hidden: boolean) => void }) {
  const { settings, ready, saving, updateSettings } = useAccountSettings();
  const [period, setPeriod] = useState<CrewPeriod>('30D');
  const [locallyHidden, setLocallyHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hidden = !ready || settings.hideBalances || locallyHidden;
  async function toggleBalances() {
    const next = !hidden;
    if (next) setLocallyHidden(true);
    setError(null);
    try { await updateSettings({ hideBalances: next }); setLocallyHidden(false); }
    catch { setError(next ? 'Hidden here. Your preference couldn’t be saved.' : 'Couldn’t show balances. Try again.'); }
  }
  return <>
    <View style={[styles.hero, { minHeight: heroSpace }]}>
      <Text accessibilityRole="header" style={[styles.title, compact && styles.compactTitle]}>Your portfolio,{'\n'}under way.</Text>
      <Text style={styles.copy}>A shared voyage. Your own horizon.</Text>
    </View>
    <CrewPortfolioCard compact={compact} period={period} onPeriod={value => { selectionFeedback(); setPeriod(value); }}
      hidden={hidden} canToggle={ready && !saving} onToggle={() => { void toggleBalances(); }} error={error} onOverview={() => onOverview(hidden)} />
    <CrewVaults hidden={hidden} compact={compact} />
    <CrewDiscoverEntry compact={compact} />
  </>;
}

const styles = StyleSheet.create({
  hero: { paddingTop: 25, paddingBottom: 28, paddingHorizontal: 3 },
  title: { fontFamily: BrandFont.editorial, fontSize: 40, lineHeight: 40, letterSpacing: -0.4, color: D.ink },
  compactTitle: { fontSize: 34, lineHeight: 35 },
  copy: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 18, color: D.secondary, marginTop: 10, maxWidth: 210 },
});
