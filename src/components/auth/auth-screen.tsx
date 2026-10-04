import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect } from 'react';
import { Dimensions, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { cancelAnimation, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { CoastalScene } from '@/components/auth/coastal-scene';
import { IntroCompleteContext } from '@/components/auth/intro-context';
import { SignInLayout } from '@/components/auth/sign-in-layout';
import { AuthPanel } from '@/constants/theme';

export default function AuthScreen() {
  const { width, height } = useWindowDimensions();
  const introComplete = useContext(IntroCompleteContext);
  const reduceMotion = useReducedMotion();
  const reveal = useSharedValue(0);
  // Keyboard resizing must never move the person or coastline.
  const sceneHeight = Platform.OS === 'web' ? height : Dimensions.get('screen').height;

  useEffect(() => {
    reveal.set(introComplete ? (reduceMotion ? 1 : withSpring(1, {
      damping: 28, stiffness: 240, mass: 0.9, overshootClamping: true,
    })) : 0);
    return () => cancelAnimation(reveal);
  }, [introComplete, reduceMotion, reveal]);

  return <View style={styles.screen} testID="auth-screen">
    <StatusBar style="dark" />
    <CoastalScene width={width} height={sceneHeight} active={introComplete} testIDPrefix="auth" />
    <SignInLayout reveal={reveal} testIDPrefix="auth" enabled={introComplete} />
  </View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, overflow: 'hidden', backgroundColor: AuthPanel.backdrop } });
