import { useNetworkState } from 'expo-network';
import { Wifi, WifiOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';

import { InterFont } from '@/constants/fonts';
import { Motion } from '@/constants/motion';
import { Dashboard } from '@/constants/theme';

export function ConnectionNotice({ bottom }: { bottom: number }) {
  const network = useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;
  const connected = network.isConnected === true && network.isInternetReachable !== false;
  const [wasOffline, setWasOffline] = useState(false);
  const [reconnected, setReconnected] = useState(false);
  const reduceMotion = useReducedMotion();

  if (offline && !wasOffline) {
    setWasOffline(true);
    setReconnected(false);
  } else if (connected && wasOffline) {
    setWasOffline(false);
    setReconnected(true);
  }
  useEffect(() => {
    if (!reconnected) return;
    const timeout = setTimeout(() => setReconnected(false), 2500);
    return () => clearTimeout(timeout);
  }, [reconnected]);

  if (!offline && !reconnected) return null;
  const Icon = offline ? WifiOff : Wifi;
  return <Animated.View pointerEvents="none" accessibilityLiveRegion="polite" accessibilityRole="text"
    testID="connection-notice" entering={reduceMotion ? undefined : FadeIn.duration(Motion.reveal)}
    exiting={reduceMotion ? undefined : FadeOut.duration(Motion.feedback)} style={[styles.notice, { bottom }]}>
    <Icon size={16} color={Dashboard.ink} />
    <Text style={styles.text}>{offline ? 'You’re offline' : 'Connection restored'}</Text>
  </Animated.View>;
}

const styles = StyleSheet.create({
  notice: { position: 'absolute', alignSelf: 'center', zIndex: 30, flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 22, backgroundColor: Dashboard.background,
    boxShadow: '0 4px 18px rgba(37,60,96,0.12)' },
  text: { fontFamily: InterFont.medium, fontSize: 12, color: Dashboard.ink },
});
