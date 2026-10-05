import { useState, type ReactNode } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import { ChevronRight, Plus, Clock3, ArrowLeft } from 'lucide-react-native';

import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { FundVaultIcon } from '@/components/shared/icons/product-icons';
import { TokenIcon } from '@/components/shared/markets/market-graphics';
import { AuthButton } from '@/components/shared/motion';
import { captainCrewMembers, captainMoney, captainTotals, type CaptainVault } from '@/constants/captain-dashboard';
import { BrandFont, InterFont } from '@/constants/fonts';
import { DiscoverPalette as D } from '@/constants/theme';
import type { CaptainPanel } from './captain-home-types';
import { CaptainVaultStatus } from './captain-home-sections';

export function CaptainDashboardSheet({ panel, vaults, hidden, onClose, onPanel, onCreate, onToggleDeposits }: {
  panel: CaptainPanel | null; vaults: readonly CaptainVault[]; hidden: boolean; onClose: () => void;
  onPanel: (panel: CaptainPanel) => void; onCreate: (name: string, strategy: CaptainVault['strategy']) => void;
  onToggleDeposits: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [strategy, setStrategy] = useState<CaptainVault['strategy']>('Balanced');
  const [formError, setFormError] = useState<string | null>(null);
  const total = captainTotals(vaults);
  const selected = panel && 'id' in panel ? vaults.find(vault => vault.id === panel.id) : undefined;
  const titles = { overview: 'Assets under management', manage: 'Manage your vaults', crew: 'Your Crew', earnings: 'Your earnings', create: 'Create a vault', vault: selected?.name ?? 'Vault', rules: 'Vault rules', exits: 'Exit requests' };
  function create() {
    if (name.trim().length < 3) { setFormError('Use at least 3 characters for your vault name.'); return; }
    Keyboard.dismiss(); onCreate(name.trim(), strategy); setName(''); setStrategy('Balanced'); setFormError(null);
  }
  let footer: ReactNode;
  if (panel?.kind === 'create') footer = <AuthButton accessibilityRole="button" testID="captain-create-submit" onPress={create} style={styles.primaryAction}><Plus size={18} color={D.heroInk} /><Text style={styles.primaryText}>Create draft</Text></AuthButton>;
  else if (panel?.kind === 'manage') footer = <AuthButton accessibilityRole="button" onPress={() => onPanel({ kind: 'create' })} style={styles.primaryAction}><Plus size={18} color={D.heroInk} /><Text style={styles.primaryText}>Create a vault</Text></AuthButton>;
  else if (selected && (panel?.kind === 'rules' || panel?.kind === 'exits')) footer = <AuthButton accessibilityRole="button" testID="captain-detail-back" onPress={() => onPanel({ kind: 'vault', id: selected.id })} style={styles.secondaryAction}><ArrowLeft size={17} color={D.ink} /><Text style={styles.secondaryText}>Back to vault</Text></AuthButton>;
  else if (selected && panel?.kind === 'vault' && selected.status !== 'Draft') footer = <AuthButton accessibilityRole="button" testID="captain-toggle-deposits" onPress={() => onToggleDeposits(selected.id)} style={styles.secondaryAction}><Text style={styles.secondaryText}>{selected.status === 'Active' ? 'Pause deposits' : 'Resume deposits'}</Text></AuthButton>;

  return <DashboardSheet visible={panel !== null} title={panel ? titles[panel.kind] : 'Captain dashboard'} onClose={onClose} footer={footer}>
    <View style={styles.content} testID="captain-dashboard-details">
      {panel?.kind === 'overview' ? <>
        <Text style={styles.caption}>Total managed across your sample vaults</Text><Text style={styles.largeValue}>{hidden ? '••••' : captainMoney(total.aumCents)}</Text>
        <Text style={styles.copy}>AUM includes Crew allocations and changes in vault value. Its movement is separate from a vault’s investment return.</Text>
        {vaults.map(vault => <DetailRow key={vault.id} label={vault.name} value={hidden ? '••••' : captainMoney(vault.aumCents)} />)}
      </> : null}

      {panel?.kind === 'manage' ? <>
        <Text style={styles.copy}>{vaults.length} sample vaults · {total.active} accepting deposits</Text>
        {vaults.map(vault => <AuthButton key={vault.id} testID={`captain-manage-${vault.id}`} accessibilityRole="button" onPress={() => onPanel({ kind: 'vault', id: vault.id })} style={styles.listRow}>
          <View style={styles.icon}><FundVaultIcon size={22} color={D.accent} /></View><View style={styles.flex}><Text style={styles.rowTitle}>{vault.name}</Text><Text style={styles.caption}>{vault.strategy} · {vault.crew} Crew</Text><View style={styles.statusSpacing}><CaptainVaultStatus vault={vault} /></View></View><ChevronRight size={18} color={D.secondary} />
        </AuthButton>)}
      </> : null}

      {panel?.kind === 'crew' ? <>
        <Text style={styles.caption}>Across your vaults</Text><Text style={styles.largeValue}>{total.crew} <Text style={styles.valueSuffix}>Crew</Text></Text>
        <Text style={styles.copy}>A few recent members from your sample Crew.</Text>
        {captainCrewMembers.map(member => <View key={member.name} style={styles.listRow}>
          <View style={styles.memberAvatar}><Text style={styles.memberInitials}>{member.initials}</Text></View><View style={styles.flex}><Text style={styles.rowTitle}>{member.name}</Text><Text style={styles.caption}>{vaults.find(vault => vault.id === member.vault)?.name}</Text><Text style={styles.caption}>{member.joined}</Text></View><Text style={styles.rowValue}>{hidden ? '••••' : captainMoney(member.amountCents)}</Text>
        </View>)}
      </> : null}

      {panel?.kind === 'earnings' ? <>
        <Text style={styles.caption}>Your share of performance fees · Sample</Text><Text style={styles.largeValue} testID="captain-earnings-total">{hidden ? '••••' : captainMoney(total.earnedCents)}</Text>
        <Text style={styles.copy}>Performance fees are earned in fund shares. These amounts show their sample value in USD.</Text>
        {vaults.filter(vault => vault.status !== 'Draft').map(vault => <DetailRow key={vault.id} label={vault.name} value={hidden ? '••••' : captainMoney(vault.earnedCents)} />)}
        <View style={styles.note}><DetailRow label="Performance fee" value="10% of new profit" /><DetailRow label="Captain / protocol split" value="80% / 20%" /><Text style={styles.caption}>Fees apply above the previous profit high. Recovering a loss does not charge the same profit again.</Text></View>
      </> : null}

      {panel?.kind === 'create' ? <View testID="captain-create-form" style={styles.content}>
        <Text style={styles.copy}>Give your next strategy a home.</Text>
        <Text style={styles.fieldLabel}>Vault name</Text>
        <TextInput testID="captain-create-name" accessibilityLabel="Vault name" value={name} onChangeText={value => { setName(value); setFormError(null); }} maxLength={28}
          placeholder="e.g. Horizon Growth" placeholderTextColor={D.muted} selectionColor={D.accent} autoCapitalize="words" returnKeyType="done" submitBehavior="blurAndSubmit" onSubmitEditing={Keyboard.dismiss} style={styles.input} />
        {formError ? <Text testID="captain-create-error" accessibilityRole="alert" style={styles.error}>{formError}</Text> : null}
        <Text style={styles.fieldLabel}>Strategy</Text>
        <View style={styles.strategies} accessibilityRole="radiogroup" accessibilityLabel="Vault strategy">{(['Balanced', 'Momentum', 'Long term'] as const).map(value => <AuthButton key={value} testID={`captain-create-strategy-${value.replace(' ', '-').toLowerCase()}`} accessibilityRole="radio" accessibilityState={{ checked: strategy === value }} aria-checked={strategy === value}
          onPress={() => setStrategy(value)} style={[styles.strategy, strategy === value && styles.selectedStrategy]}><Text style={[styles.strategyText, strategy === value && styles.selectedStrategyText]}>{value}</Text></AuthButton>)}</View>
        <DetailRow label="Deposit currency" value="USDC · Solana" /><DetailRow label="Performance fee" value="10% of new profit" />
        <Text style={styles.caption}>Creates a local preview draft. No vault is deployed and no funds move.</Text>
      </View> : null}

      {selected && panel?.kind === 'vault' ? <>
        <View style={styles.vaultIdentity}><View style={styles.icon}><FundVaultIcon size={24} color={D.accent} /></View><View style={styles.flex}><Text style={styles.rowTitle}>{selected.strategy} strategy</Text><Text style={styles.caption}>USDC on Solana · Sample vault</Text></View><CaptainVaultStatus vault={selected} /></View>
        <Text style={styles.caption}>Assets under management</Text><Text style={styles.largeValue}>{hidden ? '••••' : captainMoney(selected.aumCents)}</Text>
        <DetailRow label="Crew members" value={String(selected.crew)} /><DetailRow label="Performance fee" value="10% of new profit" />
        {selected.status === 'Draft' ? <View style={styles.note}><Text style={styles.rowTitle}>Your draft is ready.</Text><Text style={styles.copy}>This preview draft stays here while you explore Captain Home.</Text></View> : <>
          <Text style={styles.fieldLabel}>Vault holdings</Text><View style={styles.holdings}>{selected.holdings.map(holding => <View key={holding.symbol} style={styles.holding}><TokenIcon symbol={holding.symbol} size={24} /><Text style={styles.rowValue}>{holding.symbol}</Text><Text style={styles.caption}>{holding.weight}%</Text></View>)}</View>
          <AuthButton accessibilityRole="button" testID="captain-vault-rules" onPress={() => onPanel({ kind: 'rules', id: selected.id })} style={styles.listRow}><Text style={[styles.rowTitle, styles.flex]}>Vault rules</Text><ChevronRight size={18} color={D.secondary} /></AuthButton>
          <AuthButton accessibilityRole="button" testID="captain-vault-exits" onPress={() => onPanel({ kind: 'exits', id: selected.id })} style={styles.listRow}><Text style={[styles.rowTitle, styles.flex]}>Exit requests</Text><Text style={styles.rowValue}>{selected.exits} pending</Text><ChevronRight size={18} color={D.secondary} /></AuthButton>
          {selected.status === 'Deposits paused' ? <Text style={styles.caption}>New deposits are paused in this preview. Crew exit requests remain visible.</Text> : null}
        </>}
      </> : null}

      {selected && panel?.kind === 'rules' ? <>
        <Text style={styles.copy}>Sample trading boundaries for {selected.name}.</Text>
        <DetailRow label="Deposit asset" value="USDC" /><DetailRow label="Largest position" value="75% maximum" /><DetailRow label="Trade slippage limit" value="1%" /><DetailRow label="Performance fee" value="10% of new profit" />
        <View style={styles.note}><Text style={styles.rowTitle}>Trading authority</Text><Text style={styles.copy}>A Captain trades within vault rules. Crew capital stays inside the program-controlled fund.</Text></View>
      </> : null}

      {selected && panel?.kind === 'exits' ? <>
        <Text style={styles.copy}>{selected.name} · {selected.exits} sample requests</Text>
        {selected.exits > 0 ? ['Maya', 'Isha'].slice(0, selected.exits).map((member, index) => <View key={member} style={styles.listRow}><View style={styles.icon}><Clock3 size={21} color={D.risk} /></View><View style={styles.flex}><Text style={styles.rowTitle}>{member}</Text><Text style={styles.caption}>Awaiting liquidity · {index === 0 ? '2 hours ago' : '4 hours ago'}</Text></View><Text style={styles.rowValue}>{hidden ? '••••' : captainMoney(index === 0 ? 120000 : 80000)}</Text></View>) : <View style={styles.empty}><Clock3 size={26} color={D.secondary} /><Text style={styles.rowTitle}>No pending exits</Text><Text style={styles.copy}>Crew exit requests will appear here.</Text></View>}
        <Text style={styles.caption}>Exit-request preview only. No liquidation or settlement takes place.</Text>
      </> : null}
    </View>
  </DashboardSheet>;
}

function DetailRow({ label, value }: { label: string; value: string }) { return <View style={styles.detailRow}><Text style={[styles.copy, styles.flex]}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  content: { gap: 14, paddingVertical: 4 }, flex: { flex: 1, minWidth: 0 },
  caption: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 17, color: D.secondary },
  copy: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 20, color: D.secondary },
  largeValue: { fontFamily: BrandFont.editorial, fontSize: 42, lineHeight: 48, color: D.ink, fontVariant: ['lining-nums', 'tabular-nums'] },
  valueSuffix: { fontSize: 27 },
  rowTitle: { fontFamily: InterFont.semiBold, fontSize: 14, lineHeight: 21, color: D.ink },
  rowValue: { fontFamily: InterFont.medium, fontSize: 12, lineHeight: 19, color: D.ink, fontVariant: ['tabular-nums'] },
  detailRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', rowGap: 4, columnGap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: D.line },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: D.line },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: D.accentTint, alignItems: 'center', justifyContent: 'center' },
  statusSpacing: { alignSelf: 'flex-start', marginTop: 6 },
  primaryAction: { minHeight: 50, borderRadius: 25, backgroundColor: D.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryText: { fontFamily: InterFont.semiBold, fontSize: 14, color: D.heroInk },
  secondaryAction: { minHeight: 50, borderRadius: 25, backgroundColor: D.soft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryText: { fontFamily: InterFont.medium, fontSize: 14, color: D.ink },
  memberAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: D.accentTint },
  memberInitials: { fontFamily: InterFont.semiBold, fontSize: 12, color: D.accent },
  note: { padding: 14, borderRadius: 16, backgroundColor: D.soft, gap: 7 },
  fieldLabel: { fontFamily: InterFont.medium, fontSize: 13, lineHeight: 19, color: D.ink, marginTop: 3 },
  input: { minHeight: 50, borderWidth: 1, borderColor: D.line, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: D.surface, fontFamily: InterFont.regular, fontSize: 15, lineHeight: 21, color: D.ink },
  error: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 18, color: D.negative },
  strategies: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  strategy: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: D.soft },
  selectedStrategy: { backgroundColor: D.ink }, strategyText: { fontFamily: InterFont.medium, fontSize: 12, color: D.secondary }, selectedStrategyText: { color: D.heroInk },
  vaultIdentity: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 9 },
  holdings: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, holding: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 12, backgroundColor: D.soft },
  empty: { paddingVertical: 18, alignItems: 'center', gap: 10 },
});
