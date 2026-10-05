import { router } from 'expo-router';
import { ArrowUpRight, ChevronRight, Compass, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CaptainAvatar, RiskLabel } from '@/components/discover/discover-controls';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { AuthButton } from '@/components/shared/motion';
import { crewGainCents, crewInvestedCents, crewMoney, crewPercent, crewPositions, crewSignedMoney, crewTotalCents, type CrewPosition } from '@/constants/crew-portfolio';
import { discoverCaptains, percent } from '@/constants/discover';
import { BrandFont, InterFont } from '@/constants/fonts';
import { DiscoverPalette as D } from '@/constants/theme';

export function CrewVaults({ hidden }: { hidden: boolean }) {
  const [selected, setSelected] = useState<CrewPosition | null>(null);
  function openCaptain(invest = false) {
    if (!selected) return;
    setSelected(null);
    router.push({ pathname: invest ? '/invest/[id]' : '/captain/[id]', params: { id: selected.captain.id } });
  }
  return <View style={styles.section} testID="crew-vaults">
    <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>Your Captain vaults</Text><Text style={styles.count}>{crewPositions.length} vaults</Text></View>
    <Text style={styles.subtitle}>Your share of each voyage.</Text>
    <View style={styles.vaultList}>{crewPositions.map(position => {
      const { captain } = position;
      const allocation = position.valueCents / crewTotalCents * 100;
      return <AuthButton key={captain.id} testID={`home-vault-${captain.id}`} accessibilityRole="button"
        accessibilityLabel={`${captain.name}, ${captain.fund}. ${hidden ? 'Balances hidden.' : `Your value ${crewMoney(position.valueCents)}, gain ${crewSignedMoney(position.gainCents)} since invested.`} View your position.`}
        onPress={() => setSelected(position)} style={styles.vault}>
        <View style={styles.identity}><CaptainAvatar captain={captain} size={42} /><View style={styles.flex}><Text style={styles.captainName}>{captain.name}</Text><Text style={styles.fund}>{captain.fund}</Text></View><ChevronRight size={17} color={D.muted} /></View>
        <View style={styles.positionRow}><View style={styles.flex}><Text style={styles.smallLabel}>Your value</Text><Text style={styles.value} testID={`home-vault-value-${captain.id}`}>{hidden ? '••••' : crewMoney(position.valueCents)}</Text></View>
          <View style={styles.returnColumn}><Text style={styles.smallLabel}>Since invested</Text><Text style={styles.gain} testID={`home-vault-gain-${captain.id}`}>{hidden ? '••••' : `${crewSignedMoney(position.gainCents)} · ${crewPercent(position.gainCents / position.investedCents * 100)}`}</Text></View>
        </View>
        <View style={styles.allocationRow}><View style={styles.allocationTrack}><View style={[styles.allocationFill, { width: `${allocation}%` }]} /></View><Text style={styles.smallLabel}>{Math.round(allocation)}% allocation</Text></View>
      </AuthButton>;
    })}</View>
    <DashboardSheet visible={selected !== null} title="Your vault position" onClose={() => setSelected(null)}
      footer={<View style={styles.footer}><AuthButton testID="home-position-captain" accessibilityRole="button" onPress={() => openCaptain()} style={styles.secondaryAction}><Text style={styles.secondaryText}>View Captain</Text><ArrowUpRight size={16} color={D.ink} /></AuthButton><AuthButton testID="home-position-add" accessibilityRole="button" onPress={() => openCaptain(true)} style={styles.primaryAction}><Plus size={16} color={D.heroInk} /><Text style={styles.primaryText}>Add funds</Text></AuthButton></View>}>
      {selected ? <View style={styles.details} testID="home-position-details">
        <View style={styles.identity}><CaptainAvatar captain={selected.captain} size={48} /><View style={styles.flex}><Text style={styles.captainName}>{selected.captain.name}</Text><Text style={styles.fund}>{selected.captain.fund}</Text></View></View>
        <Text style={styles.smallLabel}>Your current value</Text><Text style={styles.detailValue}>{hidden ? '••••' : crewMoney(selected.valueCents)}</Text>
        <DetailRow label="You invested" value={hidden ? '••••' : crewMoney(selected.investedCents)} />
        <DetailRow label="Your return since invested" value={hidden ? '••••' : `${crewSignedMoney(selected.gainCents)} (${crewPercent(selected.gainCents / selected.investedCents * 100)})`} />
        <DetailRow label="Portfolio allocation" value={`${(selected.valueCents / crewTotalCents * 100).toFixed(1)}%`} />
        <RiskLabel captain={selected.captain} /><Text style={styles.detailCopy}>Sample position for the Crew preview. Add funds opens the investment preview.</Text>
      </View> : null}
    </DashboardSheet>
  </View>;
}

export function CrewPortfolioBreakdown({ hidden }: { hidden: boolean }) {
  return <View style={styles.details}>
    <Text style={styles.detailCopy}>Your sample positions across {crewPositions.length} Captain vaults.</Text>
    <DetailRow label="Current value" value={hidden ? '••••' : crewMoney(crewTotalCents)} />
    <DetailRow label="Total invested" value={hidden ? '••••' : crewMoney(crewInvestedCents)} />
    <DetailRow label="Return since invested" value={hidden ? '••••' : crewSignedMoney(crewGainCents)} />
    {crewPositions.map(position => <DetailRow key={position.captain.id} label={position.captain.name} value={hidden ? '••••' : crewMoney(position.valueCents)} />)}
  </View>;
}

export function CrewDiscoverEntry() {
  const captains = discoverCaptains.filter(captain => captain.id === 'bluewater' || captain.id === 'tide');
  return <View style={styles.section} testID="home-discover-captains">
    <View style={styles.heading}><Text style={styles.title} accessibilityRole="header">Find your next Captain</Text>
      <AuthButton testID="view-all-captains" accessibilityRole="button" accessibilityLabel="Explore all Captains" onPress={() => router.navigate('/explore')} style={styles.explore}><Text style={styles.exploreText}>Explore</Text><ArrowUpRight size={15} color={D.accent} /></AuthButton>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
      {captains.map(captain => <AuthButton key={captain.id} accessibilityRole="button" testID={`home-discover-${captain.id}`} accessibilityLabel={`View ${captain.name}, ${captain.strategy}, ${percent(captain.returns['30D'])} sample 30 day strategy return`}
        onPress={() => router.push({ pathname: '/captain/[id]', params: { id: captain.id, period: '30D' } })} style={styles.discoverCard}>
        <View style={styles.identity}><CaptainAvatar captain={captain} size={36} /><View style={styles.flex}><Text style={styles.captainName}>{captain.name}</Text><Text style={styles.fund}>{captain.strategy}</Text></View></View>
        <View style={styles.discoverReturn}><Text style={styles.discoverValue}>{percent(captain.returns['30D'])}</Text><Compass size={18} color={D.accent} /></View>
        <Text style={styles.smallLabel}>30D strategy return · Sample</Text>
        <RiskLabel captain={captain} />
      </AuthButton>)}
    </ScrollView>
  </View>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={[styles.detailCopy, styles.flex]}>{label}</Text><Text style={styles.detailRowValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  section: { marginTop: 25 }, heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontFamily: InterFont.semiBold, fontSize: 18, lineHeight: 25, color: D.ink, flexShrink: 1 },
  count: { fontFamily: InterFont.medium, fontSize: 12, color: D.secondary },
  subtitle: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 18, color: D.secondary, marginTop: 4, marginBottom: 13 },
  vaultList: { gap: 10 }, vault: { backgroundColor: D.surface, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: D.line },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 11 }, flex: { flex: 1, minWidth: 0 },
  captainName: { fontFamily: InterFont.semiBold, fontSize: 15, lineHeight: 21, color: D.ink },
  fund: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 18, color: D.secondary, marginTop: 1 },
  positionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 },
  smallLabel: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: D.secondary },
  value: { fontFamily: InterFont.medium, fontSize: 19, lineHeight: 27, color: D.ink, fontVariant: ['tabular-nums'], marginTop: 2 },
  returnColumn: { alignItems: 'flex-end', gap: 5 },
  gain: { fontFamily: InterFont.medium, fontSize: 11, lineHeight: 17, color: D.positive, fontVariant: ['tabular-nums'] },
  allocationRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14 },
  allocationTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: D.soft, overflow: 'hidden' },
  allocationFill: { height: 3, borderRadius: 2, backgroundColor: D.accent },
  details: { gap: 14, paddingVertical: 10 }, detailCopy: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 20, color: D.secondary },
  detailValue: { fontFamily: BrandFont.editorial, fontSize: 42, lineHeight: 48, color: D.ink, fontVariant: ['lining-nums', 'tabular-nums'] },
  detailRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 4, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: D.line },
  detailRowValue: { fontFamily: InterFont.medium, fontSize: 13, lineHeight: 20, color: D.ink },
  footer: { flexDirection: 'row', gap: 10 },
  primaryAction: { flex: 1, minHeight: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: D.ink, borderRadius: 25 },
  primaryText: { fontFamily: InterFont.semiBold, fontSize: 13, color: D.heroInk },
  secondaryAction: { flex: 1, minHeight: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: D.soft, borderRadius: 25 },
  secondaryText: { fontFamily: InterFont.medium, fontSize: 13, color: D.ink },
  explore: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 },
  exploreText: { fontFamily: InterFont.medium, fontSize: 12, color: D.accent },
  carousel: { gap: 12, paddingTop: 10, paddingBottom: 4 },
  discoverCard: { width: 218, backgroundColor: D.surface, borderWidth: 1, borderColor: D.line, borderRadius: 20, padding: 16, gap: 9 },
  discoverReturn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  discoverValue: { fontFamily: BrandFont.editorial, fontSize: 30, lineHeight: 35, color: D.positive, fontVariant: ['lining-nums', 'tabular-nums'] },
});
