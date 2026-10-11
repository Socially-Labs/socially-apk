import { ChartNoAxesColumnIncreasing, ChevronRight, Plus, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { FundVaultIcon } from '@/components/shared/icons/product-icons';
import { AuthButton } from '@/components/shared/motion';
import { type CaptainVault } from '@/constants/captain-dashboard';
import { InterFont } from '@/constants/fonts';
import { CaptainHomePalette as C, DiscoverPalette as D } from '@/constants/theme';
import { formatUsdc } from '@/api/wallet';
import type { CaptainDashboard } from '@/api/captain-dashboard';
import type { CaptainPanel } from './captain-home-types';

export function CaptainActions({ dashboard, hidden, compact, onPanel }: { dashboard: CaptainDashboard; hidden: boolean; compact: boolean; onPanel: (panel: CaptainPanel) => void }) {
  const actions = [
    { kind: 'manage' as const, label: 'Manage vaults', caption: `${dashboard.vaultCount} vaults · ${dashboard.activeVaults} active`, icon: FundVaultIcon },
    { kind: 'crew' as const, label: 'Your Crew', caption: `${dashboard.crewMembers} members`, icon: Users },
    { kind: 'earnings' as const, label: 'Earnings', caption: hidden ? 'Balances hidden' : `$${formatUsdc(dashboard.earnings.earnedUsdc)} in fees`, icon: ChartNoAxesColumnIncreasing },
    { kind: 'create' as const, label: 'Create vault', caption: 'Start a paper strategy', icon: Plus },
  ];
  return <View style={styles.actions} testID="captain-actions">{actions.map(({ kind, label, caption, icon: Icon }) => {
    const create = kind === 'create';
    const earnings = kind === 'earnings';
    return <AuthButton key={kind} testID={`captain-action-${kind}`} accessibilityRole="button" onPress={() => onPanel({ kind })}
      accessibilityLabel={`${label}. ${caption}.`} style={[styles.action, compact && styles.compactAction, earnings && styles.earningsAction, create && styles.createAction]}>
      {create ? <LinearGradient colors={C.create} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" /> : null}
      <View style={styles.actionTop}>
        <View style={[styles.actionIcon, earnings && styles.earningsIcon, create && styles.createIcon]}>
          <Icon size={21} color={create ? C.createInk : earnings ? C.gain : C.icon} strokeWidth={1.7} />
        </View>
        <ChevronRight size={17} color={create ? C.createSecondary : C.secondary} strokeWidth={1.7} />
      </View>
      <View style={styles.actionCopy}>
        <Text style={[styles.actionLabel, create && styles.createLabel]}>{label}</Text>
        <Text style={[styles.actionCaption, create && styles.createCaption]}>{caption}</Text>
      </View>
    </AuthButton>;
  })}</View>;
}

export function CaptainVaultStatus({ vault }: { vault: CaptainVault }) {
  const color = vault.status === 'Active' ? D.positive : vault.status === 'Draft' ? D.secondary : D.risk;
  return <View style={[styles.status, { backgroundColor: vault.status === 'Deposits paused' ? D.riskTint : D.soft }]}>
    <View style={[styles.statusDot, { backgroundColor: color }]} /><Text style={[styles.statusText, { color }]}>{vault.status}</Text>
  </View>;
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  action: { width: '48%', flexGrow: 1, minHeight: 92, padding: 9, gap: 3, borderRadius: 19, borderCurve: 'continuous', backgroundColor: C.tile, borderWidth: 1, borderColor: C.tileBorder, boxShadow: C.shadow, overflow: 'hidden' },
  compactAction: { minHeight: 96, padding: 10 },
  actionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionCopy: { gap: 3 },
  earningsAction: { backgroundColor: C.earnings, borderColor: C.earningsBorder },
  createAction: { backgroundColor: C.create[1], borderColor: C.createBorder },
  actionIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.tileIcon, justifyContent: 'center', alignItems: 'center' },
  earningsIcon: { backgroundColor: C.earningsIcon },
  createIcon: { backgroundColor: C.createIcon },
  actionLabel: { fontFamily: InterFont.semiBold, fontSize: 13, lineHeight: 18, color: C.ink },
  actionCaption: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 15, color: C.secondary },
  createLabel: { color: C.createInk },
  createCaption: { color: C.createSecondary },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 4, height: 4, borderRadius: 2 },
  statusText: { fontFamily: InterFont.medium, fontSize: 10, lineHeight: 15 },
});
