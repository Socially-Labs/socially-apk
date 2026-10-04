import { Check, RotateCcw, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { selectionFeedback } from '@/components/shared/feedback';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { DiscoverPalette as D } from '@/constants/theme';
import { emptyFilters, strategies, type Filters } from '@/constants/discover';
import { discoveryStyles as S } from './discover-ui';

function Choices<T extends string>({ label, values, selected, onChange }: { label: string; values: readonly T[]; selected: T; onChange: (value: T) => void }) {
  return <View style={styles.group}><Text style={styles.groupTitle}>{label}</Text><View style={styles.choices}>
    {values.map(value => <AuthButton key={value} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}
      accessibilityState={{ selected: value === selected }} onPress={() => { selectionFeedback(); onChange(value); }}
      style={[styles.choice, value === selected && styles.chosen]}>
      <Text style={[styles.choiceText, value === selected && styles.chosenText]}>{value}</Text>
    </AuthButton>)}
  </View></View>;
}
function Toggle({ label, copy, value, onChange }: { label: string; copy: string; value: boolean; onChange: () => void }) {
  return <AuthButton accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked: value }} onPress={onChange} style={styles.toggle}>
    <View style={{ flex: 1, gap: 4 }}><Text style={styles.groupTitle}>{label}</Text><Text style={S.label}>{copy}</Text></View>
    <View style={[styles.checkbox, value && styles.checked]}>{value ? <Check size={16} color={D.heroInk} /> : null}</View>
  </AuthButton>;
}
export function FilterSheet({ initial, visible, onClose, onApply, count }: {
  initial: Filters; visible: boolean; onClose: () => void; onApply: (filters: Filters) => void; count: (filters: Filters) => number;
}) {
  const [draft, setDraft] = useState(initial);
  const [opened, setOpened] = useState(visible);
  // Each opening starts from applied filters. Closing discards pending edits.
  if (opened !== visible) {
    setOpened(visible);
    if (visible) setDraft(initial);
  }
  function update(patch: Partial<Filters>) { setDraft(current => ({ ...current, ...patch })); }
  const matches = count(draft);
  const footer = <View style={styles.actions}>
    <AuthButton accessibilityRole="button" accessibilityLabel="Reset filters" onPress={() => setDraft({ ...emptyFilters })} style={styles.reset}>
      <RotateCcw size={16} color={D.secondary} /><Text style={S.label}>Reset</Text>
    </AuthButton>
    <AuthButton accessibilityRole="button" onPress={() => onApply(draft)} testID="discover-apply-filters" style={[S.button, { flex: 1 }]}>
      <Text style={S.buttonText}>{`Show ${matches} Captain${matches === 1 ? '' : 's'}`}</Text>
    </AuthButton>
  </View>;
  return <DashboardSheet visible={visible} title="Find your fit" onClose={onClose} footer={footer}>
    <View testID="discover-filter-editor" style={styles.editor}>
    <Text style={S.body}>Choose a trading approach that suits you.</Text>
    <Choices label="Risk level" values={['Any', 'Lower', 'Moderate', 'Higher'] as const} selected={draft.risk} onChange={risk => update({ risk })} />
    <Text style={styles.note}>Lower risk is relative to other sample Captains. Capital can still be lost.</Text>
    <Choices label="Strategy" values={['Any', ...strategies]} selected={draft.strategy} onChange={strategy => update({ strategy })} />
    <Choices label="Assets under management" values={['Any', 'Under $100K', '$100K–$1M', '$1M+'] as const} selected={draft.aum} onChange={aum => update({ aum })} />
    <View style={S.divider} />
    <Toggle label="Established track record" copy="At least 12 months of history" value={draft.proven} onChange={() => update({ proven: !draft.proven })} />
    <Toggle label="Positive returns only" copy="Within your selected time period" value={draft.positive} onChange={() => update({ positive: !draft.positive })} />
    </View>
  </DashboardSheet>;
}
export function OptionRow({ label, copy, selected, onPress, icon: Icon }: { label: string; copy?: string; selected?: boolean; onPress: () => void; icon?: LucideIcon }) {
  return <AuthButton accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} onPress={onPress} style={styles.option}>
    {Icon ? <Icon size={20} color={D.accent} /> : null}
    <View style={{ flex: 1, gap: 4 }}><Text style={styles.groupTitle}>{label}</Text>{copy ? <Text style={S.label}>{copy}</Text> : null}</View>
    {selected ? <Check size={20} color={D.accent} /> : null}
  </AuthButton>;
}
const styles = StyleSheet.create({
  editor: { gap: 20 }, group: { gap: 12 }, groupTitle: { fontFamily: InterFont.semiBold, fontSize: 14, color: D.ink },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { minHeight: 44, paddingHorizontal: 14, borderRadius: 12, justifyContent: 'center', borderWidth: 1, borderColor: D.line, backgroundColor: D.surface },
  chosen: { borderColor: D.accent, backgroundColor: D.accentTint }, choiceText: { fontFamily: InterFont.medium, fontSize: 12, color: D.secondary }, chosenText: { color: D.ink },
  note: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 17, color: D.secondary, marginTop: -10 },
  toggle: { flexDirection: 'row', gap: 16, alignItems: 'center', minHeight: 54 },
  checkbox: { width: 24, height: 24, borderRadius: 8, backgroundColor: D.surface, borderWidth: 1, borderColor: D.line, alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: D.accent, borderColor: D.accent },
  actions: { flexDirection: 'row', gap: 14, paddingHorizontal: 4 }, reset: { minWidth: 76, minHeight: 48, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  option: { flexDirection: 'row', gap: 14, alignItems: 'center', minHeight: 64, borderBottomWidth: 1, borderBottomColor: D.line, paddingVertical: 12 },
});
