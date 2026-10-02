import { Image } from 'expo-image';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import {
  BOAT, REFLECTION, REFLECTION_BANDS, WATER_PLATE,
  boatMotion, progress, reflectionMotion, sceneFrame, type Timeline,
} from '@/components/auth/splash/splash-timeline';
import { SplashWater } from '@/components/auth/splash/splash-water';

const ORIGINAL = require('@/assets/images/voyage/original.png');
const PLATE_IMAGE = require('@/assets/images/voyage/water-plate.png');
const BOAT_IMAGE = require('@/assets/images/voyage/boat.png');
const REFLECTION_IMAGE = require('@/assets/images/voyage/reflection.png');
const BANDS = Array.from({ length: REFLECTION_BANDS }, (_, i) => i);

type MotionProps = { clock: SharedValue<number>; timeline: Timeline; travel: number };
type Frame = ReturnType<typeof sceneFrame>;

function ReflectionBand({
  clock, timeline, travel, frame, index, onDisplay, onError,
}: MotionProps & { frame: Frame; index: number; onDisplay: () => void; onError: () => void }) {
  const bandHeight = (REFLECTION.height / REFLECTION_BANDS) * frame.scale;
  const animatedStyle = useAnimatedStyle(() => {
    const motion = reflectionMotion(clock.get(), timeline, index, travel);
    return { transform: [{ translateX: motion.x }, { translateY: motion.y }] };
  });
  return (
    <Animated.View
      style={[
        styles.band,
        {
          left: REFLECTION.x * frame.scale,
          top: REFLECTION.y * frame.scale + index * bandHeight,
          width: REFLECTION.width * frame.scale,
          // Subpixel overlap avoids hairlines between neighboring bands.
          height: bandHeight + 0.5,
        },
        animatedStyle,
      ]}>
      <Image
        source={REFLECTION_IMAGE}
        style={{
          position: 'absolute', left: 0, top: -index * bandHeight,
          width: REFLECTION.width * frame.scale,
          height: REFLECTION.height * frame.scale,
        }}
        contentFit="fill"
        transition={0}
        priority="high"
        loading="eager"
        onDisplay={onDisplay}
        onError={onError}
      />
    </Animated.View>
  );
}

export function VoyageScene({
  clock, motionClock, timeline, width, height, motionEnabled, onReady,
}: {
  clock: SharedValue<number>;
  motionClock: SharedValue<number>;
  timeline: Timeline;
  width: number;
  height: number;
  motionEnabled: boolean;
  onReady: (canAnimate: boolean) => void;
}) {
  const displayed = useRef(new Set<string>());
  const failed = useRef(false);
  const frame = sceneFrame(width, height);
  const travel = Math.min(5, width * 0.013);

  function markDisplayed(key: string) {
    displayed.current.add(key);
    if (displayed.current.has('original') && (displayed.current.size === 4 || failed.current)) {
      onReady(!failed.current);
    }
  }

  function markFailed() {
    failed.current = true;
    if (displayed.current.has('original')) onReady(false);
  }

  const layerStyle = useAnimatedStyle(() => ({
    opacity: motionEnabled && !timeline.reduceMotion ? progress(clock.get(), timeline.blend) : 0,
  }));
  const boatStyle = useAnimatedStyle(() => {
    const motion = boatMotion(motionClock.get(), timeline, travel);
    return {
      transform: [{ translateX: motion.x }, { translateY: motion.y }, { rotate: `${motion.roll}deg` }],
    };
  });

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Image
        source={ORIGINAL}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="center"
        transition={0}
        priority="high"
        loading="eager"
        onDisplay={() => markDisplayed('original')}
        onError={() => onReady(false)}
      />
      <Animated.View
        testID="voyage-motion-layers"
        style={[styles.layers, { width: frame.width, height: frame.height, left: frame.left, top: frame.top }, layerStyle]}>
        <Image
          source={PLATE_IMAGE}
          style={{
            position: 'absolute', left: WATER_PLATE.x * frame.scale, top: WATER_PLATE.y * frame.scale,
            width: WATER_PLATE.width * frame.scale, height: WATER_PLATE.height * frame.scale,
          }}
          contentFit="fill"
          transition={0}
          priority="high"
          loading="eager"
          onDisplay={() => markDisplayed('plate')}
          onError={markFailed}
        />
        {BANDS.map((index) => (
          <ReflectionBand
            key={index}
            clock={motionClock}
            timeline={timeline}
            travel={travel}
            frame={frame}
            index={index}
            onDisplay={() => markDisplayed('reflection')}
            onError={markFailed}
          />
        ))}
        <SplashWater clock={motionClock} timeline={timeline} travel={travel} frame={frame} />
        <Animated.View
          testID="voyage-boat"
          style={[
            {
              position: 'absolute', left: BOAT.x * frame.scale, top: BOAT.y * frame.scale,
              width: BOAT.width * frame.scale, height: BOAT.height * frame.scale,
            },
            boatStyle,
          ]}>
          <Image
            source={BOAT_IMAGE}
            style={StyleSheet.absoluteFill}
            contentFit="fill"
            transition={0}
            priority="high"
            loading="eager"
            onDisplay={() => markDisplayed('boat')}
            onError={markFailed}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layers: { position: 'absolute' },
  band: { position: 'absolute', overflow: 'hidden', opacity: 0.8 },
});
