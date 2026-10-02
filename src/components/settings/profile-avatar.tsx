import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { InterFont } from '@/constants/fonts';
import { SettingsPalette as S } from '@/constants/theme';
import type { ProfileAvatarKind } from './settings-provider';

export function ProfileAvatar({ name, avatar, size = 68 }: { name: string; avatar: ProfileAvatarKind; size?: number }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} accessible={false}>
    {avatar === 'captain' ? <Image source={require('@/assets/images/splash-icon.png')} contentFit="contain"
      style={{ width: size * 0.84, height: size * 0.84 }} transition={0} />
      : <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  avatar: { backgroundColor: S.avatar, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials: { fontFamily: InterFont.semiBold, color: S.ink },
});
