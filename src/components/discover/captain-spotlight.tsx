import { AuthButton } from '@/components/shared/motion';
import { drawdown, money, percent, periodLabel, type DiscoverCaptain, type Period } from '@/constants/discover';
import { InterFont } from '@/constants/fonts';
import { DiscoverPalette as D, Dashboard } from '@/constants/theme';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Sparkle, Users } from 'lucide-react-native';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { sharedStyles } from './discover-component-styles';
import { CaptainAvatar, RiskLabel } from './discover-controls';
import { discoveryStyles } from './discover-styles';
import { PerformanceChart } from './performance-chart';

export function Spotlight({ captain, period, onOpen, onInteract, eyebrow = 'TOP CAPTAIN', testID = 'discover-spotlight', disabled = false }: {
  captain: DiscoverCaptain; period: Period; onOpen: () => void; onInteract?: () => void; eyebrow?: string; testID?: string; disabled?: boolean;
}) {
  const compact = useWindowDimensions().width < 360;
  return <AuthButton onPress={onOpen} disabled={disabled} accessibilityRole="button" accessibilityLabel={`View Captain ${captain.name}`}
    onPressIn={onInteract} onFocus={onInteract} testID={testID} style={styles.spotlight}>
    <Image source={require('@/assets/images/discover/captain-horizon.png')} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="left center" transition={0} accessible={false} />
    <LinearGradient colors={D.heroOverlay} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
    <View style={discoveryStyles.between}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Sparkle size={12} color={D.heroInk} fill={D.heroInk} /><Text style={styles.spotlightEyebrow}>{eyebrow}</Text></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Users size={13} color={D.heroSecondary} /><Text style={styles.spotlightStrategy}>{captain.crew} Crew</Text></View>
    </View>
    <View style={styles.spotlightIdentity}>
      <CaptainAvatar captain={captain} size={compact ? 42 : 48} />
      <View style={styles.identityCopy}><Text numberOfLines={1} style={styles.spotlightName}>{captain.name}</Text><Text style={styles.spotlightStrategy}>{captain.fund}</Text></View>
      <View style={styles.drawdown}>
        <Text style={[styles.spotlightReturn, { color: captain.returns[period] >= 0 ? D.heroPositive : D.heroNegative }, compact && { fontSize: 23 }]}>{percent(captain.returns[period])}</Text>
        <Text style={styles.spotlightStrategy}>{periodLabel(period)}</Text>
        <Text style={styles.spotlightLoss}>−{drawdown(captain, period).toFixed(1)}% drawdown</Text>
      </View>
    </View>
    <Text numberOfLines={2} style={styles.spotlightCopy}>{captain.description}</Text>
    <View style={{ marginTop: 12, marginBottom: 6 }}><PerformanceChart captain={captain} period={period} height={64} dark color={captain.returns[period] >= 0 ? D.heroChart : D.heroNegative} /></View>
    <View style={styles.spotlightFooter}>
      <Text style={styles.spotlightMeta}>{money(captain.aum)} <Text style={styles.spotlightStrategy}>AUM</Text></Text>
      <RiskLabel captain={captain} dark />
      <View style={styles.spotlightArrow}><ArrowRight size={19} color={D.heroInk} /></View>
    </View>
  </AuthButton>;
}

const styles = StyleSheet.create({
  ...sharedStyles,
  drawdown: { alignItems: 'flex-end', gap: 2 },
  spotlight: { borderRadius: 24, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 13, overflow: 'hidden', maxWidth: Dashboard.maxWidth, borderWidth: 1, borderColor: D.heroBorder, backgroundColor: D.hero[0] },
  spotlightEyebrow: { fontFamily: InterFont.semiBold, fontSize: 9, letterSpacing: 1.5, color: D.heroSecondary },
  spotlightName: { fontFamily: InterFont.semiBold, fontSize: 20, color: D.heroInk },
  spotlightStrategy: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: D.heroSecondary },
  spotlightReturn: { fontFamily: InterFont.semiBold, fontSize: 27, letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  spotlightFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, borderTopColor: D.heroLine, paddingTop: 11 },
  spotlightIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  spotlightCopy: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: D.heroSecondary, marginTop: 8, marginBottom: 2 },
  spotlightLoss: { fontFamily: InterFont.medium, fontSize: 10, color: D.heroSecondary },
  spotlightArrow: { width: 36, height: 32, borderRadius: 16, backgroundColor: D.heroArrow, alignItems: 'center', justifyContent: 'center' },
  spotlightMeta: { fontFamily: InterFont.medium, fontSize: 12, color: D.heroInk },
});
