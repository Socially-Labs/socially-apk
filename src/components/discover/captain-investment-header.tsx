import { type DiscoverCaptain, drawdown, money, percent } from '@/constants/discover';
import { DiscoverPalette as D } from '@/constants/theme';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, BadgeCheck, ChevronRight } from 'lucide-react-native';
import { AuthButton } from '@/components/shared/motion';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { CaptainAvatar, IconButton } from './discover-ui';
import { investmentStyles as S } from './captain-investment-styles';

export function InvestmentHero({ captain, topInset, onBack }: { captain: DiscoverCaptain; topInset: number; onBack: () => void }) {
  const compact = useWindowDimensions().width < 360;
  return <View style={[S.hero, { minHeight: 302 + topInset }]} testID="investment-hero">
    <Image source={require('@/assets/images/discover/investment-coast.webp')} style={StyleSheet.absoluteFill}
      contentFit="cover" contentPosition="center" transition={0} accessible={false} />
    <LinearGradient colors={['rgba(245,247,251,0)', 'rgba(245,247,251,0.04)', D.background]}
      locations={[0, 0.65, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
    <View style={[S.topbar, { paddingTop: Math.max(topInset + 8, 20) }]}>
      <IconButton icon={ArrowLeft} label={`Back to ${captain.name}`} onPress={onBack} style={S.back} testID="investment-back" />
      <AuthButton onPress={onBack} accessibilityRole="button" accessibilityLabel={`View ${captain.name}’s profile`} style={S.captainLink}>
        <CaptainAvatar captain={captain} size={32} /><View style={S.flex}><Text style={S.linkName} numberOfLines={1}>{captain.name}</Text><Text style={S.linkFund} numberOfLines={1}>{captain.fund}</Text></View><ChevronRight size={16} color={D.ink} />
      </AuthButton>
    </View>
    <View style={S.heroCopy} testID="investment-hero-copy">
      <Text style={S.eyebrow}>JOIN THE CREW</Text>
      <Text accessibilityRole="header" style={[S.heroTitle, compact && { fontSize: 34, lineHeight: 34 }]}>Invest with{ '\n' }{captain.name}</Text>
      <Text style={S.heroSubtitle}>One strategy.{ '\n' }A shared voyage.</Text>
    </View>
  </View>;
}

export function InvestmentCaptainSummary({ captain }: { captain: DiscoverCaptain }) {
  const compact = useWindowDimensions().width < 360;
  const metrics = [
    { value: percent(captain.returns['90D']), label: '90D return', color: captain.returns['90D'] >= 0 ? D.heroPositive : D.heroNegative },
    { value: `−${drawdown(captain, '90D').toFixed(1)}%`, label: 'Drawdown' },
    { value: money(captain.aum), label: 'AUM' },
    { value: captain.crew.toLocaleString('en-US'), label: 'Crew' },
  ];
  return <View style={S.summary} testID="investment-captain-summary">
    <LinearGradient colors={D.hero} style={StyleSheet.absoluteFill} pointerEvents="none" />
    <View style={S.row}>
      <CaptainAvatar captain={captain} size={48} />
      <View style={S.flex}><View style={S.row}><Text style={S.captainName}>{captain.name}</Text>{captain.verified === true && <BadgeCheck size={17} color={D.heroChart} accessibilityLabel="Verified Captain" />}</View><Text style={S.fund}>{captain.fund}</Text></View>
      <Text style={S.preview}>Preview</Text>
    </View>
    <View style={S.metrics}>{metrics.map((metric, index) => <View key={metric.label} style={[S.metric, compact && { paddingHorizontal: 3 }, index === 0 && { paddingLeft: 0 }, index === metrics.length - 1 && { borderRightWidth: 0, paddingRight: 0 }]}>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} testID={`investment-metric-${index}`} style={[S.metricValue, compact && { fontSize: 14 }, metric.color && { color: metric.color }]}>{metric.value}</Text><Text style={S.metricLabel}>{metric.label}</Text>
    </View>)}</View>
    <Text style={S.metricLabel}>{captain.months} months of sample history · Illustrative performance</Text>
  </View>;
}
