import { UserRound, Users } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { DashboardShell } from '@/components/shared/dashboard/dashboard-shell';
import { InterFont } from '@/constants/fonts';
import { portfolio } from '@/constants/portfolio';
import { Dashboard } from '@/constants/theme';

export default function CrewScreen() {
  return <DashboardShell testID="crew-dashboard">
    <View style={styles.heading}><Users size={24} color={Dashboard.icon} /><Text style={styles.title}>Your crew</Text></View>
    <Text style={styles.copy}>Crew members allocate capital to a shared fund.</Text>
    <View style={styles.card}><Text style={styles.copy}>Crew Members</Text><Text style={styles.total}>{portfolio.crewMembers}</Text>
      <View style={styles.avatars}>{Array.from({ length: portfolio.crewMembers }, (_, index) => <View key={index} style={styles.avatar}><UserRound size={20} color={Dashboard.icon} /></View>)}</View>
      <Text style={styles.captain}>Vikas · Captain</Text>
    </View>
  </DashboardShell>;
}
const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: InterFont.semiBold, fontSize: 26, color: Dashboard.ink },
  copy: { fontFamily: InterFont.regular, fontSize: 14, color: Dashboard.secondary, marginTop: 12 },
  card: { marginTop: 70, padding: 24, borderRadius: 22, backgroundColor: Dashboard.glass },
  total: { fontFamily: InterFont.medium, fontSize: 44, color: Dashboard.ink, marginTop: 10 },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E5EBF3', alignItems: 'center', justifyContent: 'center' },
  captain: { fontFamily: InterFont.medium, fontSize: 14, color: Dashboard.ink, marginTop: 24 },
});
