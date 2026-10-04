import { CoastalScene } from '@/components/auth/coastal-scene';
import { SplashSignInCard } from '@/components/auth/splash/splash-sign-in-card';
import { progress } from '@/components/auth/splash/splash-timeline';
import { AuthPanel } from '@/constants/theme';
import { useSplashController } from '@/hooks/use-splash-controller';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SplashLockup } from './splash-lockup';

export function SplashOverlay({ onComplete }: { onComplete: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [layout, setLayout] = useState({ width, height });
  const { phase, clock, timeline, card, cardMounted, sceneReady, isReady, authGraceOver, traits } = useSplashController(onComplete);

  const rootStyle = useAnimatedStyle(() => ({ opacity: 1 - progress(clock.get(), timeline.exit) }));
  const lockupStyle = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, card.get() * 2.5) }));
  if (!traits.render) return null;

  return (
    // An in-tree overlay covers the navigator without needing a separate window.
    // The native launch screen stays visible until the scene is ready.
    <Animated.View
      style={[styles.root, rootStyle]}
      testID="voyage-splash"
      accessibilityViewIsModal
      pointerEvents={traits.pointerEvents}
      onLayout={({ nativeEvent: { layout: measured } }) => {
        // Android's keyboard resizes the window; keep the scene's framing stable.
        if (cardMounted && measured.width === layout.width) return;
        setLayout((current) => current.width === measured.width && current.height === measured.height
          ? current : { width: measured.width, height: measured.height });
      }}>
      <StatusBar style="dark" />
      <CoastalScene
        width={layout.width}
        height={layout.height}
        active={phase === 'performing' || phase === 'waiting' || phase === 'leaving'}
        testIDPrefix="splash"
        onReady={sceneReady}
      />
      <SplashLockup bottomInset={insets.bottom} lockupStyle={lockupStyle} cardMounted={cardMounted}
        loading={!isReady && !authGraceOver} />
      {cardMounted ? <SplashSignInCard reveal={card} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: AuthPanel.backdrop, overflow: 'hidden' },
});
