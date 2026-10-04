import { AuthButton } from '@/components/shared/motion';
import { drawdown, money, percent, periodLabel, type DiscoverCaptain, type Period } from '@/constants/discover';
import { InterFont } from '@/constants/fonts';
import { DiscoverPalette as D } from '@/constants/theme';
import { Bookmark, ChevronRight } from 'lucide-react-native';
import { StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { sharedStyles } from './discover-component-styles';
import { CaptainAvatar, RiskLabel } from './discover-controls';
import { PerformanceChart } from './performance-chart';

export function CaptainCard({ captain, period, saved, onSave, onOpen, style }: {
  captain: DiscoverCaptain; period: Period; saved: boolean; onSave: () => void; onOpen: () => void; style?: StyleProp<ViewStyle>;
}) {
  const compact = useWindowDimensions().width < 360;
  return <View style={[styles.captainCard, style]} testID={`discover-card-${captain.id}`}>
    <AuthButton onPress={onOpen} accessibilityRole="button" testID={`captain-open-${captain.id}`}
      accessibilityLabel={`View Captain ${captain.name}. ${periodLabel(period)} ${percent(captain.returns[period])}. Maximum drawdown ${drawdown(captain, period).toFixed(1)} percent.`} style={styles.compactRow}>
      <CaptainAvatar captain={captain} size={compact ? 36 : 42} />
      <View style={styles.identityCopy}><Text style={styles.captainName} numberOfLines={1}>{captain.name}</Text><Text style={styles.fundName} numberOfLines={1}>{captain.fund}</Text></View>
      <View style={{ width: compact ? 28 : 46 }}><PerformanceChart captain={captain} period={period} height={34} /></View>
      <View style={styles.rowReturn}><Text style={[styles.cardReturn, { color: captain.returns[period] >= 0 ? D.positive : D.negative }]}>{percent(captain.returns[period])}</Text><Text style={styles.metricLabel}>{period === 'ALL' ? 'All time' : period} return</Text><Text style={styles.rowDrawdown}>−{drawdown(captain, period).toFixed(1)}% drawdown</Text></View>
      <ChevronRight size={17} color={D.ink} />
    </AuthButton>
    <View style={styles.rowFooter}>
      <Text style={styles.metaText}>{money(captain.aum)} <Text style={styles.metaLabel}>AUM</Text> · {captain.crew} <Text style={styles.metaLabel}>Crew</Text></Text>
      <RiskLabel captain={captain} />
      <AuthButton accessibilityRole="button" accessibilityLabel={`${saved ? 'Unsave' : 'Save'} ${captain.name}`} accessibilityState={{ selected: saved }} onPress={onSave}
        hitSlop={10} testID={`captain-save-${captain.id}`} style={styles.rowSave}><Bookmark size={14} color={saved ? D.accent : D.secondary} fill={saved ? D.accent : 'none'} /></AuthButton>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  ...sharedStyles,
  captainCard: { paddingHorizontal: 12, paddingTop: 11, paddingBottom: 10, backgroundColor: D.glass, borderRadius: 22, borderWidth: 1, borderColor: D.glassBorder },
  captainName: { fontFamily: InterFont.semiBold, fontSize: 15, color: D.ink },
  fundName: { fontFamily: InterFont.regular, fontSize: 11, color: D.secondary },
  cardReturn: { fontFamily: InterFont.semiBold, fontSize: 19, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  metaText: { fontFamily: InterFont.medium, fontSize: 11, color: D.ink },
  metaLabel: { color: D.secondary, fontFamily: InterFont.regular },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
  rowReturn: { alignItems: 'flex-end', gap: 2, minWidth: 72 },
  rowFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 5, marginTop: 4 },
  rowSave: { width: 26, height: 24, justifyContent: 'center', alignItems: 'flex-end' },
  rowDrawdown: { fontFamily: InterFont.regular, fontSize: 9, color: D.secondary, lineHeight: 13 },
});
