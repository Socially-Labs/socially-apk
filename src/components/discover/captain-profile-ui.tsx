import { type AppIcon } from '@/components/shared/icons/product-icons';
import { InterFont } from '@/constants/fonts';
import { DiscoverPalette as D } from '@/constants/theme';
import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { discoveryStyles as S } from './discover-ui';

import { sharedStyles } from './captain-profile-styles';

export function Section({ title, trailing, children, eyebrow = false }: { title: string; trailing?: ReactNode; children: ReactNode; eyebrow?: boolean }) {
  return <View style={S.card}><View style={S.between}><Text style={eyebrow ? S.eyebrow : styles.sectionTitle}>{eyebrow ? title.toUpperCase() : title}</Text>{trailing}</View>{children}</View>;
}

export function Reason({ icon: Icon, title, copy }: { icon: AppIcon; title: string; copy: string }) {
  return <View style={styles.reason}><View style={styles.reasonIcon}><Icon size={18} color={D.accent} /></View><View style={{ flex: 1, gap: 5 }}><Text style={styles.cardHeading}>{title}</Text><Text style={S.label}>{copy}</Text></View></View>;
}

export function Note({ icon: Icon, title, copy }: { icon: AppIcon; title: string; copy: string }) { return <View style={styles.note}><Icon size={18} color={D.secondary} /><View style={{ flex: 1, gap: 8 }}><Text style={styles.cardHeading}>{title}</Text><Text style={S.body}>{copy}</Text></View></View>; }

export function DetailRow({ label, value }: { label: string; value: string }) { return <View style={styles.detailRow}><Text style={[S.label, { flex: 1 }]}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  ...sharedStyles,
  sectionTitle: { fontFamily: InterFont.semiBold, fontSize: 16, color: D.ink, flexShrink: 1 },
  reason: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, minHeight: 42, borderBottomWidth: 1, borderBottomColor: D.line, paddingBottom: 10 },
  detailValue: { fontFamily: InterFont.medium, fontSize: 13, color: D.ink, textAlign: 'right', flexShrink: 1 },
});
