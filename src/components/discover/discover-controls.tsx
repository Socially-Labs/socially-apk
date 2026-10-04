import { AuthButton } from '@/components/shared/motion';
import { hasPeriod, periods, type DiscoverCaptain, type Period } from '@/constants/discover';
import { InterFont } from '@/constants/fonts';
import { DiscoverPalette as D } from '@/constants/theme';
import { Image } from 'expo-image';
import { type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { sharedStyles } from './discover-component-styles';

export function IconButton({ icon: Icon, label, onPress, selected = false, testID, dark = false, style }: {
  icon: LucideIcon; label: string; onPress: () => void; selected?: boolean; testID?: string; dark?: boolean; style?: StyleProp<ViewStyle>;
}) {
  return <AuthButton accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }}
    onPress={onPress} testID={testID} style={[styles.iconButton, dark && styles.darkButton, selected && !dark && styles.selectedButton, style]}>
    <Icon size={20} strokeWidth={1.8} color={dark ? D.heroInk : D.ink} fill={selected ? (dark ? D.heroInk : D.ink) : 'none'} />
  </AuthButton>;
}

export function CaptainAvatar({ captain, size = 44 }: { captain: DiscoverCaptain; size?: number }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const photoUrl = captain.profilePhotoUrl;
  const portrait = captain.id === 'drift' ? 6 : captain.avatar;
  return <View style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.26 }]}
    accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {photoUrl && failedUrl !== photoUrl ? <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFill}
      contentFit="cover" transition={0} onError={() => setFailedUrl(photoUrl)} />
      : <Image source={require('@/assets/images/discover/captain-portraits.png')} contentFit="fill" transition={0}
        style={{ position: 'absolute', width: size * 4, height: size * 2, left: -(portrait % 4) * size, top: -Math.floor(portrait / 4) * size }} />}
  </View>;
}

export function Tag({ label, dark = false }: { label: string; dark?: boolean }) {
  return <View style={[styles.tag, dark && styles.darkTag]}><Text style={[styles.tagText, dark && styles.darkText]}>{label}</Text></View>;
}

export function RiskLabel({ captain, dark = false, textColor }: { captain: DiscoverCaptain; dark?: boolean; textColor?: string }) {
  const level = captain.risk === 'Lower' ? 1 : captain.risk === 'Moderate' ? 2 : 3;
  const riskColor = dark ? D.heroRisk[level - 1] : captain.risk === 'Lower' ? D.riskLower : captain.risk === 'Higher' ? D.riskHigher : D.risk;
  return <View style={styles.risk} accessible accessibilityLabel={`${captain.risk} risk. Sample classification.`}>
    <View style={styles.riskBars}>{[1, 2, 3].map(bar => <View key={bar} style={{
      width: 3, height: 5 + bar * 3, borderRadius: 1,
      backgroundColor: bar <= level ? riskColor : (dark ? D.heroLine : D.line)
    }} />)}</View>
    <Text style={[styles.riskText, { color: textColor ?? (dark ? D.heroSecondary : D.secondary) }]}>{captain.risk} risk</Text>
  </View>;
}

export function PeriodControl({ value, onChange, captain }: { value: Period; onChange: (period: Period) => void; captain?: DiscoverCaptain }) {
  return <View style={styles.periods}>{periods.map(period => {
    const unavailable = captain ? !hasPeriod(captain, period) : false;
    return <AuthButton key={period} accessibilityRole="button" accessibilityLabel={`${period === 'ALL' ? 'All time' : period} performance${unavailable ? ', insufficient history' : ''}`}
      accessibilityState={{ selected: value === period, disabled: unavailable }} disabled={unavailable}
      onPress={() => onChange(period)} testID={`period-${period}`} style={[styles.period, value === period && styles.activePeriod, unavailable && styles.disabled]}>
      <Text style={[styles.periodText, value === period && styles.activePeriodText]}>{period}</Text>
    </AuthButton>;
  })}</View>;
}

export function Metric({ label, value, dark = false, accent = false }: { label: string; value: string; dark?: boolean; accent?: boolean }) {
  return <View style={[styles.metric, { minWidth: '42%', flexGrow: 1 }]}>
    <Text style={[styles.metricValue, dark && styles.darkText, accent && { color: dark ? D.heroChart : D.positive }]}>{value}</Text>
    <Text style={[styles.metricLabel, dark && { color: D.heroSecondary }]}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  ...sharedStyles,
  iconButton: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: D.soft },
  selectedButton: { backgroundColor: D.accentTint },
  darkButton: { backgroundColor: D.heroPill },
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: D.soft },
  tagText: { fontFamily: InterFont.medium, fontSize: 11, color: D.secondary },
  darkTag: { backgroundColor: D.heroPill },
  darkText: { color: D.heroInk },
  risk: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  riskBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  riskText: { fontFamily: InterFont.medium, fontSize: 10, color: D.risk },
  periods: { flexDirection: 'row', backgroundColor: D.soft, padding: 4, borderRadius: 14, gap: 3 },
  period: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  activePeriod: { backgroundColor: D.surface, boxShadow: '0 2px 6px rgba(30,50,80,0.07)' },
  periodText: { fontFamily: InterFont.medium, fontSize: 12, color: D.secondary },
  activePeriodText: { color: D.ink },
  disabled: { opacity: 0.35 },
  metric: { gap: 5 },
  metricValue: { fontFamily: InterFont.semiBold, fontSize: 20, color: D.ink, fontVariant: ['tabular-nums'] },
});
