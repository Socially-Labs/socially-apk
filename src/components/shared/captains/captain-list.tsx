import { ChevronRight, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native';

import Animated, { LinearTransition, useReducedMotion } from 'react-native-reanimated';

import { selectionFeedback } from '@/components/shared/feedback';
import { AuthButton } from '@/components/shared/motion';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { type Captain } from '@/constants/captains';
import { InterFont } from '@/constants/fonts';
import { Dashboard } from '@/constants/theme';

export function CaptainList({ captains, horizontal = false }: { captains: readonly Captain[]; horizontal?: boolean }) {
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<Captain | null>(null);
  const cards = captains.map((captain) => (
    <Animated.View key={captain.id} layout={reduceMotion ? undefined : LinearTransition.duration(180)}><AuthButton testID={`captain-${captain.id}`} accessibilityRole="button"
      accessibilityLabel={`${captain.name}, ${captain.strategy}, ${captain.return30d} over 30 days, ${captain.crew} crew members. View captain.`}
      onPress={() => { Keyboard.dismiss(); selectionFeedback(); setSelected(captain); }} style={[styles.card, horizontal && styles.horizontalCard]}>
      <View style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: captain.tint }]}><Text style={[styles.initials, { color: captain.color }]}>{captain.initials}</Text></View>
        <View style={styles.nameColumn}><Text style={styles.name}>{captain.name}</Text><Text style={styles.strategy}>{captain.strategy}</Text></View>
        {horizontal ? null : <ChevronRight size={17} color={Dashboard.secondary} />}
      </View>
      <View style={styles.metrics}>
        <View style={styles.performance}><Text style={styles.return}>{captain.return30d}</Text><Text style={styles.caption}>30D return</Text></View>
        <View style={styles.crew}><Users size={14} color={Dashboard.icon} /><Text style={styles.crewText}>{captain.crew} crew</Text></View>
      </View>
    </AuthButton></Animated.View>
  ));
  return <>
    {horizontal ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel} testID="captain-carousel">{cards}</ScrollView>
      : <View style={styles.list}>{cards}</View>}
    <DashboardSheet visible={selected !== null} title={selected ? `Captain ${selected.name}` : 'Captain'} onClose={() => setSelected(null)}>
      {selected ? <View style={styles.details}>
        <View style={[styles.largeAvatar, { backgroundColor: selected.tint }]}><Text style={[styles.largeInitials, { color: selected.color }]}>{selected.initials}</Text></View>
        <Text style={styles.detailName}>{selected.name}</Text><Text style={styles.detailCopy}>{selected.strategy}</Text>
        <Text style={styles.description}>{selected.description}</Text>
        <View style={styles.detailMetrics}><View style={styles.performance}><Text style={styles.detailReturn}>{selected.return30d}</Text><Text style={styles.caption}>30D return</Text></View>
          <View style={styles.performance}><Text style={styles.detailCrew}>{selected.crew}</Text><Text style={styles.caption}>Crew members</Text></View></View>
      </View> : null}
    </DashboardSheet>
  </>;
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  carousel: { gap: 10, paddingBottom: 4 },
  card: { padding: 16, borderRadius: 18, backgroundColor: Dashboard.glass, gap: 18 },
  horizontalCard: { width: 224 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: InterFont.semiBold, fontSize: 12, letterSpacing: 0.5 },
  nameColumn: { flex: 1, gap: 4 },
  name: { fontFamily: InterFont.semiBold, fontSize: 14, color: Dashboard.ink },
  strategy: { fontFamily: InterFont.regular, fontSize: 10, lineHeight: 14, color: Dashboard.secondary },
  metrics: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  performance: { gap: 4 },
  return: { fontFamily: InterFont.medium, fontSize: 18, color: Dashboard.positive, fontVariant: ['tabular-nums'] },
  caption: { fontFamily: InterFont.regular, fontSize: 10, lineHeight: 14, color: Dashboard.secondary },
  crew: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  crewText: { fontFamily: InterFont.regular, fontSize: 11, color: Dashboard.secondary },
  details: { alignItems: 'center', gap: 12, paddingVertical: 12 },
  largeAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  largeInitials: { fontFamily: InterFont.semiBold, fontSize: 20 },
  detailName: { fontFamily: InterFont.semiBold, fontSize: 24, color: Dashboard.ink },
  detailCopy: { fontFamily: InterFont.regular, fontSize: 13, color: Dashboard.secondary },
  description: { fontFamily: InterFont.regular, fontSize: 14, lineHeight: 22, color: Dashboard.secondary, textAlign: 'center', maxWidth: 320 },
  detailMetrics: { flexDirection: 'row', gap: 48, marginTop: 12 },
  detailReturn: { fontFamily: InterFont.medium, fontSize: 24, color: Dashboard.positive },
  detailCrew: { fontFamily: InterFont.medium, fontSize: 24, color: Dashboard.ink },
});
