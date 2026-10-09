import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Eye, FileText, Globe2, Info, LifeBuoy, ShieldCheck, UserRound, UserRoundPlus, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AuthButton } from '@/components/shared/motion';
import { SettingsHubPalette as H } from '@/constants/theme/settings';
import { appVersion } from './settings-detail-config';
import { settingsHubStyles as s } from './settings-hub-styles';

type Destination = {
  section: string; title: string; copy: string; compactCopy: string; icon: LucideIcon;
  invite?: boolean; community?: boolean;
};
const destinations: readonly Destination[] = [
  { section: 'account', title: 'Account', copy: 'Manage your profile and sign-in settings.', compactCopy: 'Profile & sign-in', icon: UserRound },
  { section: 'display', title: 'Display', copy: 'Balances, language & currency.', compactCopy: 'Balance visibility', icon: Eye },
  { section: 'referral', title: 'Invite a friend', copy: 'Share Socially with your crew.', compactCopy: 'Share with your crew', icon: UserRoundPlus, invite: true, community: true },
  { section: 'support', title: 'Help & support', copy: 'Get help or contact our team.', compactCopy: 'Get a little help', icon: LifeBuoy, community: true },
];
const info: readonly { section: string; title: string; icon: LucideIcon }[] = [
  { section: 'network', title: 'Network · Solana Devnet', icon: Globe2 },
  { section: 'about', title: 'About Socially', icon: Info },
  { section: 'terms', title: 'Terms of service', icon: FileText },
  { section: 'privacy', title: 'Privacy policy', icon: ShieldCheck },
];

function SettingsTile({ item, compact, onOpen }: { item: Destination; compact: boolean; onOpen: (section: string) => void }) {
  const Icon = item.icon;
  return <AuthButton accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.copy}`}
    testID={`settings-${item.section}`} onPress={() => onOpen(item.section)} style={[s.tile, compact && s.compactTile]}>
    <LinearGradient colors={item.invite ? H.invite : H.tile} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      pointerEvents="none" style={[StyleSheet.absoluteFill, s.tileSurface]} />
    <View style={[s.tileIcon, compact && s.compactTileIcon, item.invite && s.inviteIcon]}>
      <Icon size={compact ? 22 : 24} color={item.invite ? H.inviteInk : H.ink} strokeWidth={1.7} />
    </View>
    <Text style={[s.tileTitle, item.community && s.communityTitle, compact && s.compactTileTitle, compact && item.community && s.compactCommunityTitle]}>{item.title}</Text>
    <View style={s.tileFooter}>
      <Text style={[s.tileCopy, compact && s.compactTileCopy]}>{compact ? item.compactCopy : item.copy}</Text>
      <View style={[s.tileArrow, item.invite && s.inviteArrow]}><ArrowRight size={18} color={item.invite ? H.inviteInk : H.ink} strokeWidth={1.8} /></View>
    </View>
  </AuthButton>;
}

export function SettingsHub({ compact, onOpen }: { compact: boolean; onOpen: (section: string) => void }) {
  return <View style={s.grid} testID="settings-tile-grid">
    {[destinations.slice(0, 2), destinations.slice(2)].map((row, index) => <View key={index} style={s.tileRow}>
      {row.map(item => <SettingsTile key={item.section} item={item} compact={compact} onOpen={onOpen} />)}
    </View>)}
  </View>;
}

export function SettingsInfo({ onOpen }: { onOpen: (section: string) => void }) {
  return <View style={s.about} testID="settings-info-panel">
    <LinearGradient colors={H.tile} pointerEvents="none" style={[StyleSheet.absoluteFill, s.aboutSurface]} />
    {info.map(({ section, title, icon: Icon }, index) => <AuthButton key={section} accessibilityRole="button" accessibilityLabel={title}
      testID={`settings-${section}`} onPress={() => onOpen(section)} style={[s.infoRow, index < info.length - 1 && s.infoBorder]}>
      <Icon size={19} color={H.secondary} strokeWidth={1.7} /><Text style={s.infoTitle}>{title}</Text><ArrowRight size={17} color={H.secondary} />
    </AuthButton>)}
    <Text style={s.version}>v{appVersion}</Text>
  </View>;
}
