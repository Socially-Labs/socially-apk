import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { SettingsPalette as S } from '@/constants/theme';
import { ProfileMediaImage } from './profile-media-image';

export function ProfileBanner({ uri, fallbackId }: { uri: string | null; fallbackId: number }) {
  return <View style={styles.cover} testID="profile-banner-preview">
    <ProfileMediaImage uri={uri} fallbackId={fallbackId} kind="banner" />
    <LinearGradient colors={S.coverShade} style={StyleSheet.absoluteFill} />
  </View>;
}
const styles = StyleSheet.create({ cover: { height: 120, backgroundColor: S.cover, overflow: 'hidden' } });
