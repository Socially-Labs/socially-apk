import { AuthButton } from '@/components/shared/motion';
import { money, type DiscoverCaptain } from '@/constants/discover';
import { InterFont } from '@/constants/fonts';
import { DiscoverPalette as D } from '@/constants/theme';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, BadgeCheck, Bookmark, Check, MoreHorizontal, Plus } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { CaptainAvatar, IconButton, RiskLabel, discoveryStyles as S, Tag } from './discover-ui';

import { sharedStyles } from './captain-profile-styles';

export function CaptainProfileHeader({ captain, compact, topInset, failedBanner, isSaved, isFollowing, onBannerError, onBack, onSave, onFollow, onActions }: {
  captain: DiscoverCaptain; compact: boolean; topInset: number; failedBanner: string | null; isSaved: boolean; isFollowing: boolean;
  onBannerError: (url: string) => void; onBack: () => void; onSave: () => void; onFollow: () => void; onActions: () => void;
}) {
  return (
    <View testID="captain-profile">
      <View style={[styles.banner, { height: Math.max(topInset + 170, 200) }]} testID="captain-profile-banner">
        <Image source={captain.bannerUrl && failedBanner !== captain.bannerUrl ? { uri: captain.bannerUrl } : require('@/assets/images/discover/captain-horizon.png')}
          contentFit="cover" contentPosition="right center" transition={0} style={StyleSheet.absoluteFill}
          onError={() => { if (captain.bannerUrl) onBannerError(captain.bannerUrl); }} accessible={false} />
        <LinearGradient colors={D.profileBannerFade} locations={[0, 0.55, 1]} style={styles.bannerFade} pointerEvents="none" />
        <View style={[styles.topbar, { paddingTop: Math.max(topInset + 8, 42) }]}>
          <IconButton icon={ArrowLeft} label="Back to Discover" onPress={onBack} testID="captain-back" style={styles.headerButton} />
          <View style={S.row}>
            <IconButton icon={Bookmark} label={`${isSaved ? 'Unsave' : 'Save'} ${captain.name}`} selected={isSaved} onPress={onSave} testID="captain-profile-save" style={styles.headerButton} />
            <IconButton icon={MoreHorizontal} label="More Captain options" onPress={onActions} testID="captain-profile-more" style={styles.headerButton} />
          </View>
        </View>
      </View>
      <View style={styles.identity}>
        <View style={styles.profileRow}>
          <View style={styles.profilePhoto}><CaptainAvatar captain={captain} size={compact ? 76 : 86} /></View>
          <View style={styles.profileCopy}>
            <View style={styles.statusBadge}>{captain.verified ? <BadgeCheck size={12} color={D.accent} /> : null}<Text style={styles.statusText}>{captain.verified ? 'Verified Captain' : 'Sample Captain'}</Text></View>
            <View style={styles.nameRow}><Text accessibilityRole="header" numberOfLines={1} style={styles.name}>{captain.name}</Text>
              <AuthButton onPress={onFollow} accessibilityRole="button" accessibilityLabel={`${isFollowing ? 'Unfollow' : 'Follow'} ${captain.name}`} accessibilityState={{ selected: isFollowing }} testID="captain-follow" style={[styles.follow, isFollowing && styles.following]}>
                {isFollowing ? <Check size={13} color={D.ink} /> : <Plus size={13} color={D.heroInk} />}<Text style={[styles.followText, isFollowing && { color: D.ink }]}>{isFollowing ? 'Following' : 'Follow'}</Text>
              </AuthButton>
            </View>
            <Text style={styles.fundName}>{captain.fund}</Text>
            <Text style={styles.bio} numberOfLines={2}>{captain.description}</Text>
          </View>
        </View>
        <View style={[styles.tags, !compact && { paddingLeft: 98 }]}><Tag label={captain.strategy} /><Tag label={captain.tags[0]} /><View style={styles.riskTag}><RiskLabel captain={captain} textColor={D.ink} /></View></View>
        <View style={styles.identityFooter}>
          <ProfileStat value={`${captain.months} months`} label="Trading" />
          <ProfileStat value={String(captain.crew)} label="Crew" />
          <ProfileStat value={money(captain.aum)} label="AUM" last />
        </View>
      </View>
    </View>
  );
}

function ProfileStat({ value, label, last = false }: { value: string; label: string; last?: boolean }) {
  return <View style={[styles.profileStat, !last && styles.profileStatDivider]}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  ...sharedStyles,
  topbar: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  headerButton: { borderRadius: 22, backgroundColor: D.searchGlass },
  banner: { position: 'relative', backgroundColor: D.soft },
  bannerFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  identity: { paddingHorizontal: 16, marginTop: -60, paddingBottom: 8, gap: 8 },
  profileRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  profilePhoto: { borderRadius: 25, padding: 2, backgroundColor: D.profilePhotoBorder, borderWidth: 1, borderColor: D.profilePhotoBorder },
  profileCopy: { flex: 1, gap: 4, paddingTop: 8 },
  statusBadge: { flexDirection: 'row', alignSelf: 'flex-start', gap: 4, alignItems: 'center', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6, backgroundColor: D.glass },
  statusText: { fontFamily: InterFont.medium, fontSize: 9, color: D.ink },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  name: { fontFamily: InterFont.semiBold, fontSize: 26, letterSpacing: -0.8, color: D.ink, flexShrink: 1 },
  fundName: { fontFamily: InterFont.regular, fontSize: 14, color: D.secondary },
  bio: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: D.secondary, marginTop: 2 },
  follow: { flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', minHeight: 34, paddingHorizontal: 9, backgroundColor: D.ink, borderRadius: 9 },
  followText: { fontFamily: InterFont.semiBold, fontSize: 10, color: D.heroInk },
  following: { backgroundColor: D.accentTint },
  riskTag: { paddingHorizontal: 8, paddingVertical: 5, backgroundColor: D.accentTint, borderRadius: 8 },
  identityFooter: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, marginTop: 2 },
  profileStat: { flex: 1, alignItems: 'center', gap: 3 },
  profileStatDivider: { borderRightWidth: 1, borderRightColor: D.line },
  statValue: { fontFamily: InterFont.semiBold, fontSize: 12, color: D.ink },
  statLabel: { fontFamily: InterFont.regular, fontSize: 11, color: D.secondary },
});
