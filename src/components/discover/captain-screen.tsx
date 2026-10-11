import CrewCaptainScreen from './crew-captain-screen';
import { selectionFeedback } from '@/components/shared/feedback';
import { AuthButton } from '@/components/shared/motion';
import { discoverCaptains, drawdown, hasPeriod, periods, type DiscoverCaptain, type Period } from '@/constants/discover';
import { InterFont } from '@/constants/fonts';
import { DiscoverPalette as D, Dashboard } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Bookmark, Users } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaptainDetailSheet } from './captain-detail-sheet';
import { CaptainProfileHeader } from './captain-profile-header';
import { CaptainProfileTabContent } from './captain-profile-tab-content';
import { tabs, type Detail, type ProfileTab } from './captain-profile-types';
import { useDiscover } from './discover-provider';
import { DiscoverSurface, discoveryStyles as S } from './discover-ui';

function backToDiscover() { if (router.canGoBack()) router.back(); else router.replace('/explore'); }

export default function CaptainScreen() {
  const { id, period: requested } = useLocalSearchParams<{ id: string; period?: string }>();
  if (typeof id === 'string' && /^[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(id)) return <CrewCaptainScreen key={id} id={id} />;
  const captain = discoverCaptains.find(item => item.id === id);
  if (!captain) return <DiscoverSurface><View style={styles.missing}><Text style={S.title}>Captain not found</Text><Text style={S.body}>This Captain isn’t part of the current preview.</Text><AuthButton accessibilityRole="button" onPress={backToDiscover} style={S.button}><Text style={S.buttonText}>Back to Discover</Text></AuthButton></View></DiscoverSurface>;
  return <CaptainProfile key={captain.id} captain={captain} requested={requested} />;
}

function CaptainProfile({ captain, requested }: { captain: DiscoverCaptain; requested?: string }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const [failedBanner, setFailedBanner] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const scroll = useRef<ScrollView>(null);
  const tabOffset = useRef(0);
  const pendingTabScroll = useRef(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const { saved, toggleSaved, following, toggleFollowing } = useDiscover();
  const isFollowing = following.includes(captain.id);
  const isSaved = saved.includes(captain.id);
  const requestedPeriod = periods.find(value => value === requested) ?? '90D';
  const [period, setPeriod] = useState<Period>(hasPeriod(captain, requestedPeriod) ? requestedPeriod : '90D');
  const [selectedTab, setTab] = useState<ProfileTab>('Overview');
  // Fast Refresh can preserve a removed tab while this screen is open.
  const tab = tabs.includes(selectedTab) || selectedTab === 'Vault' ? selectedTab : 'Overview';
  const [detail, setDetail] = useState<Detail | null>(null);
  const worst = drawdown(captain, period);
  function changeTab(next: ProfileTab) {
    selectionFeedback(); pendingTabScroll.current = true; setTab(next);
    if (next === tab) {
      scroll.current?.scrollTo({ y: Math.max(0, tabOffset.current - insets.top), animated: !reduceMotion });
      pendingTabScroll.current = false;
    }
  }
  return <DiscoverSurface><StatusBar style="dark" />
    <View style={styles.scrollViewport} onLayout={event => {
      if (event.nativeEvent.layout.height > 0) setViewportHeight(event.nativeEvent.layout.height);
    }}>
      <ScrollView ref={scroll} style={styles.scroll} contentContainerStyle={styles.content}
        removeClippedSubviews={false} showsVerticalScrollIndicator testID="captain-profile-scroll">
        <CaptainProfileHeader captain={captain} compact={compact} topInset={insets.top} failedBanner={failedBanner}
          isSaved={isSaved} isFollowing={isFollowing} onBannerError={setFailedBanner} onBack={backToDiscover}
          onSave={() => toggleSaved(captain.id)} onFollow={() => toggleFollowing(captain.id)} onActions={() => setDetail({ kind: 'actions' })} />
        <View style={styles.tabBar} testID="captain-profile-tabs" onLayout={event => { tabOffset.current = event.nativeEvent.layout.y; }}>
          {tabs.map(item => <AuthButton accessibilityRole="button" accessibilityState={{ selected: item === tab }} key={item} onPress={() => changeTab(item)} testID={`captain-tab-${item.toLowerCase()}`} style={[styles.tab, item === tab && styles.selectedTab]}><Text style={[styles.tabText, item === tab && styles.selectedTabText]}>{item}</Text></AuthButton>)}
        </View>
        <View key={tab} collapsable={false} style={[styles.tabContent, { minHeight: Math.max(0, viewportHeight - 44) }]}
          testID={`captain-content-${tab.toLowerCase()}`} onLayout={() => {
            // Scroll only after the new panel has laid out; otherwise a shorter
            // previous panel can clamp the offset and keep the new data below it.
            if (pendingTabScroll.current) {
              pendingTabScroll.current = false;
              scroll.current?.scrollTo({ y: Math.max(0, tabOffset.current - insets.top), animated: !reduceMotion });
            }
          }}>
          <CaptainProfileTabContent captain={captain} period={period} tab={tab} onDetail={setDetail}
            onPeriod={next => { selectionFeedback(); setPeriod(next); }} />
        </View>
      </ScrollView>
    </View>
    <View testID="captain-join-footer" style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.bottomInner}>
        {tab === 'Vault' ? <AuthButton accessibilityRole="button" onPress={() => toggleSaved(captain.id)} style={S.button}><Bookmark size={17} color={D.heroInk} fill={isSaved ? D.heroInk : 'none'} /><Text style={S.buttonText}>{isSaved ? 'Saved to your shortlist' : 'Save this Captain'}</Text></AuthButton>
          : <AuthButton accessibilityRole="button" onPress={() => { selectionFeedback(); router.push({ pathname: '/invest/[id]', params: { id: captain.id } }); }} testID="captain-view-vault" style={styles.join}><Users size={19} color={D.heroInk} /><Text style={styles.joinText}>Join this Captain</Text></AuthButton>}
      </View>
    </View>
    <CaptainDetailSheet captain={captain} period={period} detail={detail} worst={worst} onClose={() => setDetail(null)}
      onDetail={setDetail} onPeriod={next => { selectionFeedback(); setPeriod(next); setDetail(null); }}
      onVault={() => { setDetail(null); changeTab('Vault'); }} />
  </DiscoverSurface>;
}

const styles = StyleSheet.create({
  missing: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center', gap: 20 },
  content: { width: '100%', maxWidth: Dashboard.maxWidth, alignSelf: 'center', paddingBottom: 20 },
  scrollViewport: { flex: 1, minHeight: 0 },
  scroll: { flex: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: D.background, marginHorizontal: 16, borderBottomWidth: 1, borderBottomColor: D.line },
  tab: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  selectedTab: { borderBottomColor: D.ink },
  tabText: { fontFamily: InterFont.medium, fontSize: 12, color: D.secondary },
  selectedTabText: { color: D.ink },
  tabContent: { gap: 16, paddingTop: 14, paddingHorizontal: 16 },
  bottomBar: { flexShrink: 0, paddingTop: 12, paddingHorizontal: 16, backgroundColor: D.background, borderTopWidth: 1, borderTopColor: D.line },
  bottomInner: { maxWidth: Dashboard.maxWidth - 32, width: '100%', alignSelf: 'center', gap: 8 },
  join: { minHeight: 50, borderRadius: 26, backgroundColor: D.ink, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 18 },
  joinText: { fontFamily: InterFont.semiBold, fontSize: 16, color: D.heroInk },
});
