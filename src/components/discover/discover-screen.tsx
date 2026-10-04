import { Compass, Search, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';

import Animated, { LinearTransition, useReducedMotion } from 'react-native-reanimated';

import { selectionFeedback } from '@/components/shared/feedback';
import { AuthButton } from '@/components/shared/motion';
import { CaptainList } from '@/components/shared/captains/captain-list';
import { DashboardShell } from '@/components/shared/dashboard/dashboard-shell';
import { popularCaptains } from '@/constants/captains';
import { InterFont } from '@/constants/fonts';
import { Dashboard } from '@/constants/theme';

export default function DiscoverScreen() {
  const input = useRef<TextInput>(null);
  const reduceMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const search = query.trim().toLowerCase();
  const captains = popularCaptains.filter(captain => `${captain.name} ${captain.strategy}`.toLowerCase().includes(search));
  return <DashboardShell testID="explore-dashboard">
    <View testID="discover-dashboard">
      <View style={styles.heading}><Compass size={24} color={Dashboard.icon} /><Text style={styles.title} accessibilityRole="header">Discover</Text></View>
      <Text style={styles.copy}>Find a captain for your next voyage.</Text>
      <View style={[styles.search, focused && styles.searchFocused]}>
        <Search size={19} color={Dashboard.icon} />
        <TextInput ref={input} testID="captain-search" accessibilityLabel="Search captains" placeholder="Search captains or strategies"
          placeholderTextColor={Dashboard.secondary} value={query} onChangeText={setQuery} autoCapitalize="none" autoCorrect={false}
          returnKeyType="search" submitBehavior="blurAndSubmit" onSubmitEditing={() => Keyboard.dismiss()}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} autoComplete="off"
          selectionColor={Dashboard.icon} underlineColorAndroid="transparent" style={styles.input} />
        {query ? <AuthButton accessibilityRole="button" accessibilityLabel="Clear captain search" onPress={() => { selectionFeedback(); setQuery(''); input.current?.focus(); }} style={styles.clear}><X size={17} color={Dashboard.icon} /></AuthButton> : null}
      </View>
      <View style={styles.sectionHeading}><Text style={styles.section} accessibilityRole="header">{search ? 'Search results' : 'Popular Captains'}</Text>
        <Text style={styles.count}>{captains.length} captains</Text></View>
      <Animated.View layout={reduceMotion ? undefined : LinearTransition.duration(180)}>
      {captains.length ? <CaptainList captains={captains} /> : <View style={styles.empty}>
        <Search size={26} color={Dashboard.icon} /><Text style={styles.emptyTitle}>No captains found</Text>
        <Text style={styles.emptyCopy}>Try a name or a strategy like Solana.</Text>
      </View>}
      </Animated.View>
    </View>
  </DashboardShell>;
}
const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: InterFont.semiBold, fontSize: 26, color: Dashboard.ink },
  copy: { fontFamily: InterFont.regular, fontSize: 14, color: Dashboard.secondary, marginTop: 12 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingLeft: 16, paddingRight: 8, backgroundColor: Dashboard.glass, borderRadius: 16, marginTop: 30, borderWidth: 1, borderColor: 'transparent' },
  searchFocused: { borderColor: Dashboard.icon },
  input: { flex: 1, minWidth: 0, fontFamily: InterFont.regular, fontSize: 13, color: Dashboard.ink, paddingVertical: 16 },
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 14 },
  section: { fontFamily: InterFont.semiBold, fontSize: 17, color: Dashboard.ink },
  count: { fontFamily: InterFont.regular, fontSize: 11, color: Dashboard.secondary },
  empty: { alignItems: 'center', paddingVertical: 42, gap: 12, backgroundColor: Dashboard.glass, borderRadius: 18 },
  emptyTitle: { fontFamily: InterFont.medium, fontSize: 16, color: Dashboard.ink },
  emptyCopy: { fontFamily: InterFont.regular, fontSize: 12, color: Dashboard.secondary },
});
