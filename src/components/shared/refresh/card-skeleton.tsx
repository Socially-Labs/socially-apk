import { StyleSheet, View } from 'react-native';
import { DiscoverPalette as C } from '@/constants/theme';

/** Static placeholders reserve card space without adding motion while data loads. */
export function CardSkeleton({ label, count = 1, compact = false }: { label: string; count?: number; compact?: boolean }) {
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityState={{ busy: true }} style={s.list} testID="card-skeleton">
    {Array.from({ length: count }, (_, index) => <View key={index} style={[s.card, compact && s.compact]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <View style={s.heading}><View style={s.avatar} /><View style={s.title} /></View>
      <View style={s.line} /><View style={s.shortLine} />
      {!compact ? <View style={s.chart} /> : null}
    </View>)}
  </View>;
}
const s = StyleSheet.create({
  list: { gap: 14 },
  card: { padding: 18, gap: 14, borderRadius: 24, borderWidth: 1, borderColor: C.line, minHeight: 216 },
  compact: { minHeight: 126 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.accentTint },
  title: { width: '55%', height: 18, borderRadius: 6, backgroundColor: C.accentTint },
  line: { width: '85%', height: 14, borderRadius: 6, backgroundColor: C.accentTint },
  shortLine: { width: '55%', height: 14, borderRadius: 6, backgroundColor: C.accentTint },
  chart: { height: 70, borderRadius: 12, backgroundColor: C.accentTint },
});
