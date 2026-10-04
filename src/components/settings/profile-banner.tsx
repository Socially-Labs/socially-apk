import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { SettingsPalette as S } from '@/constants/theme';

export function ProfileBanner({ uri }: { uri: string | null }) {
  return <View style={styles.cover} testID="profile-banner-preview">
    <Image source={uri ? { uri } : require('@/assets/images/auth/coastal-voyage.webp')}
      style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="center" transition={0} />
    <LinearGradient colors={S.coverShade} style={StyleSheet.absoluteFill} />
  </View>;
}
const styles = StyleSheet.create({ cover: { height: 120, backgroundColor: S.cover, overflow: 'hidden' } });
