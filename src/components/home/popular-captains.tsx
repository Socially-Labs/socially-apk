import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/shared/motion';
import { CaptainList } from '@/components/shared/captains/captain-list';
import { popularCaptains, shouldShowPopularCaptains } from '@/constants/captains';
import { InterFont } from '@/constants/fonts';
import { Dashboard } from '@/constants/theme';

export function PopularCaptains({ marketCount }: { marketCount: number }) {
  if (!shouldShowPopularCaptains(marketCount)) return null;
  return <View style={styles.section} testID="popular-captains">
    <View style={styles.heading}>
      <Text style={styles.title} accessibilityRole="header">Popular Captains</Text>
      <AuthButton testID="view-all-captains" accessibilityRole="button" accessibilityLabel="View all captains in Discover"
        onPress={() => router.navigate('/explore')} style={styles.viewAll}>
        <Text style={styles.link}>View all</Text><ChevronRight size={14} color={Dashboard.icon} />
      </AuthButton>
    </View>
    <CaptainList captains={popularCaptains.slice(0, 3)} horizontal />
  </View>;
}

const styles = StyleSheet.create({
  section: { marginTop: 20 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6, paddingLeft: 2 },
  title: { fontFamily: InterFont.semiBold, fontSize: 17, lineHeight: 23, color: Dashboard.ink },
  viewAll: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 3, paddingLeft: 8 },
  link: { fontFamily: InterFont.medium, fontSize: 11, color: Dashboard.icon },
});
