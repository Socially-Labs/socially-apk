import { Image, type ImageSource } from 'expo-image';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { profileMediaUri } from './profile-fallbacks';

const bundledPairs = [
  { avatar: require('@/assets/images/profile-fallbacks/1/avatar.webp'), banner: require('@/assets/images/profile-fallbacks/1/banner.webp') },
  { avatar: require('@/assets/images/profile-fallbacks/2/avatar.webp'), banner: require('@/assets/images/profile-fallbacks/2/banner.webp') },
  { avatar: require('@/assets/images/profile-fallbacks/3/avatar.webp'), banner: require('@/assets/images/profile-fallbacks/3/banner.webp') },
  { avatar: require('@/assets/images/profile-fallbacks/4/avatar.webp'), banner: require('@/assets/images/profile-fallbacks/4/banner.webp') },
  { avatar: require('@/assets/images/profile-fallbacks/5/avatar.webp'), banner: require('@/assets/images/profile-fallbacks/5/banner.webp') },
] as const;

export function ProfileMediaImage({ uri, fallbackId, kind, onDisplay, bundled }: {
  uri?: string | null; fallbackId: number; kind: 'avatar' | 'banner'; onDisplay?: () => void; bundled?:ImageSource|number;
}) {
  const index = Math.max(0, Math.min(4, fallbackId - 1));
  return <MediaImage key={`${uri ?? ''}:${index}:${kind}`} uri={uri} bundled={bundled ?? bundledPairs[index]![kind]} onDisplay={onDisplay} />;
}

function MediaImage({ uri, bundled, onDisplay }: { uri?: string | null; bundled: ImageSource | number; onDisplay?: () => void }) {
  const [failed, setFailed] = useState<string | null>(null);
  const selected = profileMediaUri(uri, failed);
  return <Image source={selected ? { uri: selected } : bundled} style={StyleSheet.absoluteFill}
    contentFit="cover" contentPosition="center" transition={0} loading="eager" onDisplay={onDisplay}
    onError={() => { if (selected) setFailed(selected); }}
    accessibilityElementsHidden importantForAccessibility="no" />;
}
