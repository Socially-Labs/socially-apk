import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useId, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps, useAnimatedStyle, useFrameCallback, useReducedMotion,
  useSharedValue, type SharedValue,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Ellipse, G, Image as SvgImage, Path, Rect } from 'react-native-svg';

import { COASTAL_ART, COASTAL_BOAT, COASTAL_WATER, coastalBoatMotion, coastalFrame } from './coastal-motion';
import { AuthPanel, CoastalPalette as C } from '@/constants/theme';

const POSTER = require('@/assets/images/auth/coastal-voyage.webp');
const WATER = require('@/assets/images/auth/coastal-water.webp');
const BOAT = require('@/assets/images/auth/coastal-boat.png');
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedSvgImage = Animated.createAnimatedComponent(SvgImage);
const BANDS = [0, 1, 2, 3, 4, 5];
const WAVES = [
  { x: 482, y: 866, width: 150 }, { x: 758, y: 912, width: 196 },
  { x: 457, y: 970, width: 219 }, { x: 719, y: 1054, width: 240 },
  { x: 596, y: 1140, width: 160 }, { x: 687, y: 1278, width: 245 },
];

type ClockProps = { clock: SharedValue<number>; prefix: string };

function SeaWave({ clock, prefix, index }: ClockProps & { index: number }) {
  const wave = WAVES[index];
  const animatedProps = useAnimatedProps(() => {
    const phase = clock.get() / (6200 + index * 700) * Math.PI * 2 + index * 1.7;
    const y = wave.y + Math.sin(phase) * (2 + index * 0.35);
    const x = wave.x + Math.cos(phase * 0.5) * 5;
    return {
      d: `M${x} ${y} q${wave.width * 0.25} ${-2.4 * Math.sin(phase)} ${wave.width * 0.5} 0 t${wave.width * 0.5} 0`,
      opacity: 0.08 + 0.23 * (0.5 + 0.5 * Math.sin(phase)),
    };
  });
  return <AnimatedPath testID={`${prefix}-coast-wave-${index}`} animatedProps={animatedProps}
    fill="none" stroke={C.foam} strokeWidth={1.7} strokeLinecap="round" />;
}

function WaterBand({ clock, prefix, index, id }: ClockProps & { index: number; id: string }) {
  const y = 846 + index * 88;
  const props = useAnimatedProps(() => ({
    x: Math.sin(clock.get() / 5800 * Math.PI * 2 + index * 0.8) * (2.2 + index * 0.45),
    y: Math.sin(clock.get() / 6800 * Math.PI * 2 + index) * 1.6,
  }));
  return <G clipPath={`url(#${id}-water-band-${index})`}>
    <Defs><ClipPath id={`${id}-water-band-${index}`}><Rect x={0} y={y} width={941} height={74} /></ClipPath></Defs>
    <AnimatedSvgImage testID={`${prefix}-coast-surface-${index}`} href={WATER}
      width={941} height={1672} opacity={0.22} animatedProps={props} />
  </G>;
}

function ReflectionBand({ clock, prefix, index, id }: ClockProps & { index: number; id: string }) {
  const props = useAnimatedProps(() => {
    const boat = coastalBoatMotion(clock.get() - 120);
    return { x: COASTAL_BOAT.x + boat.x + Math.sin(clock.get() / 4500 * Math.PI * 2 + index * 1.2) * (index + 1) * 0.65 };
  });
  return <G clipPath={`url(#${id}-reflection-${index})`}>
    <Defs><ClipPath id={`${id}-reflection-${index}`}><Rect x={680} y={822 + index * 18} width={170} height={14} /></ClipPath></Defs>
    <G transform="translate(0 1274) scale(1 -0.55)">
      <AnimatedSvgImage testID={`${prefix}-coast-reflection-${index}`} href={BOAT}
        y={COASTAL_BOAT.y} width={COASTAL_BOAT.width} height={COASTAL_BOAT.height}
        opacity={0.2 * (1 - index / 7)} animatedProps={props} />
    </G>
  </G>;
}

function HullRipple({ clock, prefix, index }: ClockProps & { index: number }) {
  const props = useAnimatedProps(() => {
    const phase = (clock.get() / 7200 + index / 2) % 1;
    const boat = coastalBoatMotion(clock.get());
    return {
      cx: 762 + boat.x, cy: 822 + phase * 13,
      rx: 60 + phase * 66, ry: 1.2 + phase * 5,
      opacity: Math.sin(phase * Math.PI) ** 2 * 0.22,
    };
  });
  return <AnimatedEllipse testID={`${prefix}-coast-ripple-${index}`} animatedProps={props}
    fill="none" stroke={C.foam} strokeWidth={1.3} />;
}

function ShoreFoam({ clock, prefix, index }: ClockProps & { index: number }) {
  const props = useAnimatedProps(() => {
    const phase = (clock.get() / 8200 + index * 0.5) % 1;
    const wash = Math.sin(phase * Math.PI) ** 2;
    const offset = 3 + wash * 9;
    return {
      d: `M${603 + offset} 1218 q48 8 28 25 t-22 13 q-14 11 -49 10 M${577 + offset} 1294 q54 17 26 30 t-37 8 q-10 16 -43 21`,
      opacity: wash * 0.32,
      strokeDashoffset: -phase * 38,
    };
  });
  return <AnimatedPath testID={`${prefix}-coast-foam-${index}`} animatedProps={props}
    stroke={C.foam} strokeWidth={2} strokeDasharray="14 8 5 11" strokeLinecap="round" fill="none" />;
}

/** A static shore with a separately composited boat and clipped SVG water. */
export function CoastalScene({ width, height, active, testIDPrefix, onReady }: {
  width: number; height: number; active: boolean; testIDPrefix: 'auth' | 'splash';
  onReady?: (canAnimate: boolean) => void;
}) {
  const initialReduceMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(initialReduceMotion);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const displayed = useRef(new Set<string>());
  const id = `coast-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const clock = useSharedValue(0);
  const frame = coastalFrame(width, height);
  const motion = useFrameCallback(({ timeSincePreviousFrame }) => {
    // One UI-thread clock; resuming the app never skips ahead in the scene.
    clock.set(clock.get() + Math.min(timeSincePreviousFrame ?? 0, 64));
  }, false);

  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (live) setReduceMotion(value); }).catch(() => {});
    const reduce = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const app = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => { live = false; reduce.remove(); app.remove(); };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPreference = () => setReduceMotion(preference.matches);
    const onVisibility = () => setForeground(document.visibilityState === 'visible');
    onPreference(); onVisibility();
    preference.addEventListener('change', onPreference);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      preference.removeEventListener('change', onPreference);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    motion.setActive(active && foreground && ready && !failed && !reduceMotion);
    return () => motion.setActive(false);
  }, [active, foreground, ready, failed, reduceMotion, motion]);

  function didDisplay(layer: string) {
    displayed.current.add(layer);
    if (layer === 'poster') onReady?.(true);
    if (displayed.current.size === 3) setReady(true);
  }

  const boatStyle = useAnimatedStyle(() => {
    const boat = coastalBoatMotion(clock.get());
    return { transform: [{ translateX: boat.x * frame.scale }, { translateY: boat.y * frame.scale }, { rotate: `${boat.roll}deg` }] };
  });
  const showLayers = ready && !failed && !reduceMotion;

  return <View style={[styles.scene, { width, height }]} pointerEvents="none"
    accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID={`${testIDPrefix}-coastal-scene`}>
    <View testID={`${testIDPrefix}-coast-frame`} style={[styles.frame, { width: frame.width, height: frame.height, left: frame.left, top: frame.top }]}>
      <Image testID={`${testIDPrefix}-coast-poster`} source={POSTER} style={StyleSheet.absoluteFill}
        contentFit="fill" transition={0} priority="high" onDisplay={() => didDisplay('poster')} onError={() => onReady?.(false)} />
      <View testID={`${testIDPrefix}-coast-motion`} style={[StyleSheet.absoluteFill, { opacity: showLayers ? 1 : 0 }]}>
        <Image source={WATER} style={StyleSheet.absoluteFill} contentFit="fill" transition={0}
          priority="high" onDisplay={() => didDisplay('water')} onError={() => setFailed(true)} />
        <Svg testID={`${testIDPrefix}-coast-water`} width="100%" height="100%"
          viewBox={`0 0 ${COASTAL_ART.width} ${COASTAL_ART.height}`} preserveAspectRatio="none">
          <Defs><ClipPath id={`${id}-water`}><Path d={COASTAL_WATER} /></ClipPath></Defs>
          <G clipPath={`url(#${id}-water)`}>
            {BANDS.map(index => <WaterBand key={index} index={index} clock={clock} prefix={testIDPrefix} id={id} />)}
            {BANDS.map(index => <ReflectionBand key={`reflection-${index}`} index={index} clock={clock} prefix={testIDPrefix} id={id} />)}
            {WAVES.map((_, index) => <SeaWave key={`wave-${index}`} index={index} clock={clock} prefix={testIDPrefix} />)}
            {[0, 1].map(index => <HullRipple key={`ripple-${index}`} index={index} clock={clock} prefix={testIDPrefix} />)}
            {[0, 1].map(index => <ShoreFoam key={`foam-${index}`} index={index} clock={clock} prefix={testIDPrefix} />)}
          </G>
        </Svg>
        <Animated.View testID={`${testIDPrefix}-coast-boat`} style={[styles.boat, {
          left: COASTAL_BOAT.x * frame.scale, top: COASTAL_BOAT.y * frame.scale,
          width: COASTAL_BOAT.width * frame.scale, height: COASTAL_BOAT.height * frame.scale,
        }, boatStyle]}>
          <Image source={BOAT} style={StyleSheet.absoluteFill} contentFit="fill" transition={0}
            priority="high" onDisplay={() => didDisplay('boat')} onError={() => setFailed(true)} />
        </Animated.View>
      </View>
      <LinearGradient colors={C.bottomFade} style={styles.artFade} locations={[0, 0.65, 1]} />
      {width > 640 ? <LinearGradient colors={[AuthPanel.backdrop, 'rgba(228,237,245,0)', 'rgba(228,237,245,0)', AuthPanel.backdrop]}
        locations={[0, 0.13, 0.87, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} /> : null}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  scene: { position: 'absolute', top: 0, left: 0, overflow: 'hidden', backgroundColor: AuthPanel.backdrop },
  frame: { position: 'absolute' },
  boat: { position: 'absolute' },
  artFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '24%' },
});
