import { StyleSheet } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Ellipse, G, Image, Path, Rect } from 'react-native-svg';

import { SCENE, boatMotion, rippleMotion, sceneFrame, type Timeline } from '@/components/auth/splash/splash-timeline';
import { SplashWaterPalette } from '@/constants/theme';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedImage = Animated.createAnimatedComponent(Image);
const ORIGINAL = require('@/assets/images/voyage/original.png');
const RIPPLES = [0, 1, 2];
const WAVES = Array.from({ length: 9 }, (_, index) => index);
const SHIMMER_BANDS = Array.from({ length: 14 }, (_, index) => index);
// Trace the sea up to the stairs/platform, so no ripple ever crosses the architecture.
const WATER_OUTLINE = 'M496 1138 L689 1138 L689 1150 L841 1154 L841 1400 L553 1333 L553 1314 L523 1314 L523 1286 L496 1286 Z';

type WaterProps = { clock: SharedValue<number>; timeline: Timeline; travel: number };

function HullRipple({ clock, timeline, travel, index, scale }: WaterProps & { index: number; scale: number }) {
  const animatedProps = useAnimatedProps(() => {
    const ripple = rippleMotion(clock.get(), timeline, index);
    const boat = boatMotion(clock.get(), timeline, travel);
    return { ...ripple, cx: 580 + boat.x / scale };
  });
  return (
    <AnimatedEllipse
      testID={`voyage-ripple-${index}`}
      animatedProps={animatedProps}
      fill="none"
      stroke={SplashWaterPalette.crest}
      strokeWidth={2.2}
    />
  );
}

function SurfaceWave({ clock, timeline, index }: WaterProps & { index: number }) {
  const animatedProps = useAnimatedProps(() => {
    const elapsed = Math.max(0, clock.get() - timeline.voyage.from);
    const phase = elapsed / 5200 * Math.PI * 2 - index * 0.8;
    const depth = index / (WAVES.length - 1);
    const y = 1157 + depth * 215 + Math.sin(phase) * (2 + depth * 3);
    const start = 502 + Math.sin(phase * 0.5 + index) * 12;
    const bend = Math.sin(phase + 1) * (3 + depth * 6);
    return {
      d: `M${start} ${y} Q580 ${y + bend} 660 ${y} T852 ${y + bend * 0.5}`,
      opacity: timeline.reduceMotion ? 0 : Math.min(1, elapsed / 1000)
        * (0.16 + depth * 0.15) * (0.75 + Math.sin(phase) * 0.25),
    };
  });
  return (
    <AnimatedPath
      testID={`voyage-wave-${index}`}
      animatedProps={animatedProps}
      fill="none"
      stroke={index % 3 === 0 ? SplashWaterPalette.trough : SplashWaterPalette.crest}
      strokeWidth={1.4 + index * 0.15}
      strokeLinecap="round"
    />
  );
}

/** Shift only the reflected arches in horizontal slices; their masonry stays still. */
function ReflectionShimmer({ clock, timeline, index }: WaterProps & { index: number }) {
  const animatedProps = useAnimatedProps(() => {
    const elapsed = Math.max(0, clock.get() - timeline.voyage.from);
    const depth = (index + 1) / SHIMMER_BANDS.length;
    return {
      x: timeline.reduceMotion ? 0 : Math.min(1, elapsed / 1200)
        * Math.sin(elapsed / 5600 * Math.PI * 2 - index * 0.7) * (1 + depth * 5),
    };
  });
  return (
    <G clipPath={`url(#voyage-shimmer-${index})`}>
      <AnimatedImage
        testID={`voyage-water-reflection-${index}`}
        href={ORIGINAL}
        y={0} width={SCENE.width} height={SCENE.height}
        animatedProps={animatedProps}
      />
    </G>
  );
}

export function SplashWater({ clock, timeline, travel, frame }: WaterProps & { frame: ReturnType<typeof sceneFrame> }) {
  return (
    <Svg
      testID="voyage-water"
      width={frame.width} height={frame.height}
      viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
      style={StyleSheet.absoluteFill}>
      <Defs>
        <ClipPath id="voyage-water-outline"><Path d={WATER_OUTLINE} /></ClipPath>
        {SHIMMER_BANDS.map((index) => (
          <ClipPath key={index} id={`voyage-shimmer-${index}`}>
            <Rect x={690} y={1154 + index * 18} width={151} height={18.5} />
          </ClipPath>
        ))}
      </Defs>
      <G clipPath="url(#voyage-water-outline)">
        {SHIMMER_BANDS.map((index) => <ReflectionShimmer key={index} clock={clock} timeline={timeline} travel={travel} index={index} />)}
        {WAVES.map((index) => <SurfaceWave key={index} clock={clock} timeline={timeline} travel={travel} index={index} />)}
        {RIPPLES.map((index) => <HullRipple key={index} clock={clock} timeline={timeline} travel={travel} index={index} scale={frame.scale} />)}
      </G>
    </Svg>
  );
}
