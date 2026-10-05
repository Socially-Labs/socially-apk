import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, ChevronRight, Compass, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CaptainAvatar, RiskLabel } from '@/components/discover/discover-controls';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { AuthButton } from '@/components/shared/motion';
import { crewGainCents, crewInvestedCents, crewMoney, crewPercent, crewPositions, crewSignedMoney, crewTotalCents, type CrewPosition } from '@/constants/crew-portfolio';
import { discoverCaptains } from '@/constants/discover';
import { BrandFont, InterFont } from '@/constants/fonts';
import { CaptainHomePalette as H, DiscoverPalette as D } from '@/constants/theme';

export function CrewVaults({ hidden, compact }: { hidden: boolean; compact: boolean }) {
  const [selected, setSelected] = useState<CrewPosition | null>(null);
  function openCaptain(invest = false) {
    if (!selected) return;
    setSelected(null);
    router.push({ pathname: invest ? '/invest/[id]' : '/captain/[id]', params: { id: selected.captain.id } });
  }
  return <View style={styles.section} testID="crew-vaults">
    <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>Your Captain vaults</Text><Text style={styles.count}>{crewPositions.length} vaults</Text></View>
    <View style={styles.vaultCaptions}><Text style={styles.subtitle}>Your share of each voyage.</Text><Text style={styles.sinceInvested}>Since invested</Text></View>
    <View style={styles.vaultList}>{crewPositions.map(position => {
      const { captain } = position;
      const allocation = position.valueCents / crewTotalCents * 100;
      return <AuthButton key={captain.id} testID={`home-vault-${captain.id}`} accessibilityRole="button"
        accessibilityLabel={`${captain.name}, ${captain.fund}. ${hidden ? 'Balances hidden.' : `Your value ${crewMoney(position.valueCents)}, gain ${crewSignedMoney(position.gainCents)} since invested.`} View your position.`}
        onPress={() => setSelected(position)} style={styles.vault}>
        <CaptainAvatar captain={captain} size={compact ? 34 : 40} />
        <View style={styles.flex}>
          <View style={styles.vaultTop}>
            <View style={styles.flex}><Text style={styles.vaultName}>{captain.name}</Text><Text style={styles.vaultFund} numberOfLines={1}>{captain.fund}</Text></View>
            <View style={styles.returnColumn}>
              <Text style={styles.value} testID={`home-vault-value-${captain.id}`}>{hidden ? '••••' : crewMoney(position.valueCents)}</Text>
              <Text style={[styles.gain, compact && styles.compactGain]} testID={`home-vault-gain-${captain.id}`}>{hidden ? '••••' : `${crewSignedMoney(position.gainCents)} (${crewPercent(position.gainCents / position.investedCents * 100)})`}</Text>
            </View>
          </View>
          <View style={styles.allocationRow}><View style={styles.allocationTrack}><View style={[styles.allocationFill, { width: `${allocation}%` }]} /></View><Text style={styles.allocationLabel}>{Math.round(allocation)}% allocation</Text></View>
        </View>
        <ChevronRight size={15} color={H.secondary} strokeWidth={1.7} />
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

export function CrewDiscoverEntry({ compact }: { compact: boolean }) {
  const captains = discoverCaptains.filter(captain => captain.id === 'bluewater' || captain.id === 'tide');
  return <View style={styles.discoverSection} testID="home-discover-captains">
    <AuthButton testID="view-all-captains" accessibilityRole="button" accessibilityLabel="Find your next Captain. Explore all Captains."
      onPress={() => router.navigate('/explore')} style={styles.discoverEntry}>
      <LinearGradient colors={H.create} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={styles.discoverIcon}><Compass size={21} color={H.createInk} strokeWidth={1.7} /></View>
      <View style={styles.flex}><Text style={styles.discoverTitle}>Find your next Captain</Text><Text style={styles.discoverCaption}>Explore new strategies</Text></View>
      {!compact ? <View style={styles.discoverPortraits}>{captains.map(captain => <View key={captain.id} style={styles.discoverPortrait}><CaptainAvatar captain={captain} size={24} /></View>)}</View> : null}
      <ChevronRight size={16} color={H.createSecondary} strokeWidth={1.7} />
    </AuthButton>
  </View>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={[styles.detailCopy, styles.flex]}>{label}</Text><Text style={styles.detailRowValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  section: { marginTop: 18 }, heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontFamily: InterFont.semiBold, fontSize: 16, lineHeight: 22, color: H.ink, flexShrink: 1 },
  count: { fontFamily: InterFont.medium, fontSize: 11, color: H.secondary },
  vaultCaptions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 8, rowGap: 3, marginTop: 3, marginBottom: 10 },
  subtitle: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: H.secondary },
  sinceInvested: { fontFamily: InterFont.regular, fontSize: 9, lineHeight: 16, color: H.secondary },
  vaultList: { gap: 8 },
  vault: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 64, backgroundColor: H.tile, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 18, borderCurve: 'continuous', borderWidth: 1, borderColor: H.tileBorder, boxShadow: H.shadow },
  vaultTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vaultName: { fontFamily: InterFont.semiBold, fontSize: 13, lineHeight: 18, color: H.ink },
  vaultFund: { fontFamily: InterFont.regular, fontSize: 10, lineHeight: 14, color: H.secondary },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 11 }, flex: { flex: 1, minWidth: 0 },
  captainName: { fontFamily: InterFont.semiBold, fontSize: 15, lineHeight: 21, color: D.ink },
  fund: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 18, color: D.secondary, marginTop: 1 },
  smallLabel: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: D.secondary },
  value: { fontFamily: InterFont.semiBold, fontSize: 14, lineHeight: 18, color: H.ink, fontVariant: ['tabular-nums'] },
  returnColumn: { alignItems: 'flex-end', gap: 1, flexShrink: 0 },
  gain: { fontFamily: InterFont.medium, fontSize: 10, lineHeight: 14, color: H.gain, fontVariant: ['tabular-nums'] },
  compactGain: { fontSize: 9 },
  allocationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  allocationLabel: { fontFamily: InterFont.regular, fontSize: 9, lineHeight: 12, color: H.secondary },
  allocationTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: '#E9F0F7', overflow: 'hidden' },
  allocationFill: { height: 3, borderRadius: 2, backgroundColor: H.secondary },
  details: { gap: 14, paddingVertical: 10 }, detailCopy: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 20, color: D.secondary },
  detailValue: { fontFamily: BrandFont.editorial, fontSize: 42, lineHeight: 48, color: D.ink, fontVariant: ['lining-nums', 'tabular-nums'] },
  detailRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 4, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: D.line },
  detailRowValue: { fontFamily: InterFont.medium, fontSize: 13, lineHeight: 20, color: D.ink },
  footer: { flexDirection: 'row', gap: 10 },
  primaryAction: { flex: 1, minHeight: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: D.ink, borderRadius: 25 },
  primaryText: { fontFamily: InterFont.semiBold, fontSize: 13, color: D.heroInk },
  secondaryAction: { flex: 1, minHeight: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: D.soft, borderRadius: 25 },
  secondaryText: { fontFamily: InterFont.medium, fontSize: 13, color: D.ink },
  discoverSection: { marginTop: 12 },
  discoverEntry: { minHeight: 58, padding: 10, gap: 8, flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderCurve: 'continuous', borderWidth: 1, borderColor: H.createBorder, backgroundColor: H.create[1], boxShadow: H.shadow, overflow: 'hidden' },
  discoverIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: H.createIcon, alignItems: 'center', justifyContent: 'center' },
  discoverTitle: { fontFamily: InterFont.medium, fontSize: 12, lineHeight: 17, color: H.createInk },
  discoverCaption: { fontFamily: InterFont.regular, fontSize: 10, lineHeight: 15, color: H.createSecondary, marginTop: 2 },
  discoverPortraits: { flexDirection: 'row', gap: 3 },
  discoverPortrait: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: H.createSecondary, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
