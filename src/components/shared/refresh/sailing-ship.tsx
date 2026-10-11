import { useEffect, useId, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useFrameCallback, useReducedMotion, useSharedValue } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
function waterPath(time: number, period: number, y: number, amplitude: number) {
  'worklet';
  const x = -80 - (time % period) / period * 80;
  return `M${x} ${y}q20 ${-amplitude} 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0`;
}

/** Native SVG paths from the approved sailing-ship preview; no image or webview. */
export function SailingShip({ active, width = 104 }: { active: boolean; width?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const clock = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const [foreground, setForeground] = useState(AppState.currentState == null || AppState.currentState === 'active');
  useEffect(() => {
    const listener = AppState.addEventListener('change', value => setForeground(value === 'active'));
    return () => listener.remove();
  }, []);
  const motion = useFrameCallback(frame => { clock.set(value => value + Math.min(frame.timeSincePreviousFrame ?? 0, 40)); }, false);
  useEffect(() => {
    motion.setActive(active && foreground && !reducedMotion);
    return () => motion.setActive(false);
  }, [active, foreground, reducedMotion, motion]);
  const hullStyle = useAnimatedStyle(() => {
    const cycle = Math.cos(clock.get() / 3200 * Math.PI * 2);
    return { transform: [{ translateY: cycle * width / 160 }, { rotate: `${-1.5 * cycle}deg` }] };
  });
  const flagProps = useAnimatedProps(() => {
    const wind = Math.sin(clock.get() / 1100 * Math.PI * 2) * 1.5;
    return { d: `M100 24Q110 ${19 + wind} 123 ${23 + wind}L116 ${27 + wind}Q108 25 100 28Z` };
  });
  const sailProps = useAnimatedProps(() => {
    const wind = Math.sin(clock.get() / 3200 * Math.PI * 2) * 1.8;
    return { d: `M68 66Q99 ${69 + wind} 128 63Q${124 + wind} 80 133 94Q101 ${88 + wind} 65 96Q${75 + wind} 80 68 66Z` };
  });
  const foreProps = useAnimatedProps(() => {
    const wind = Math.sin(clock.get() / 3200 * Math.PI * 2 - 0.3) * 1.5;
    return { d: `M127 79Q149 ${81 + wind} 171 75Q${169 + wind} 89 178 100Q153 ${95 + wind} 125 102Q${131 + wind} 91 127 79Z` };
  });
  const frontWater = useAnimatedProps(() => ({ d: waterPath(clock.get(), 2400, 130, 7) }));
  const backWater = useAnimatedProps(() => ({ d: waterPath(clock.get(), 3800, 125, 6) }));
  const secondWater = useAnimatedProps(() => ({ d: waterPath(clock.get(), 2400, 140, 4) }));
  const wake = useAnimatedProps(() => {
    const progress = (clock.get() % 1600) / 1600;
    return { d: `M${160 - progress * 23} 127Q${175 - progress * 23} 122 ${189 - progress * 23} 125`, opacity: reducedMotion ? 0.5 : Math.sin(progress * Math.PI) * 0.8 };
  });
  const height = width * 168 / 240;
  return <View style={{ width, height }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="sailing-ship">
    <Svg width={width} height={height} viewBox="0 0 240 168" style={StyleSheet.absoluteFill}>
      <AnimatedPath animatedProps={backWater} fill="none" stroke="#C4D5E3" strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
    <Animated.View style={[StyleSheet.absoluteFill, hullStyle]} testID="sailing-ship-hull">
      <Svg width={width} height={height} viewBox="0 0 240 168">
        <Defs><LinearGradient id={`${id}-sail`} x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0" stopColor="#FFFFFF"/><Stop offset="1" stopColor="#DCE8F1"/></LinearGradient></Defs>
<G stroke="#182B43" strokeLinecap="round" strokeLinejoin="round">
 
 <G fill="none" strokeWidth="1.15"><Path d="M99 24L56 112M99 26L143 111M148 43L180 111M148 45L111 111M99 26L204 103" opacity=".65" /><Path d="M99 23V113M148 43V112" strokeWidth="2.3" /><Path d="M173 111L213 97" strokeWidth="2" /><Path d="M49 99H76V108H49ZM54 100V107M63 100V107" /></G>
 <AnimatedPath animatedProps={flagProps} d="M100 24Q110 19 123 23L116 27Q108 25 100 28Z" fill="#45698C" stroke="none" />
 
 <G fill={`url(#${id}-sail)`} strokeWidth="1.4">
  <Path d="M76 36Q99 40 122 35Q119 48 126 59Q101 55 74 61Q82 49 76 36Z" />
  <AnimatedPath animatedProps={sailProps} d="M68 66Q99 69 128 63Q124 80 133 94Q101 88 65 96Q75 80 68 66Z" />
  <Path d="M99 39Q104 48 101 56M98 69Q107 81 102 90" fill="none" stroke="#A2B8CA" strokeWidth="1" />
  <Path d="M72 65L129 62M78 35L122 34" fill="none" strokeWidth="2" />
 </G>
 <G fill={`url(#${id}-sail)`} strokeWidth="1.4">
  <Path d="M132 52Q148 55 165 50Q163 61 169 71Q150 67 130 73Q135 62 132 52Z" />
  <AnimatedPath animatedProps={foreProps} d="M127 79Q149 81 171 75Q169 89 178 100Q153 95 125 102Q131 91 127 79Z" />
  <Path d="M148 55Q152 62 149 69M149 81Q154 90 151 97" fill="none" stroke="#A2B8CA" strokeWidth="1" />
  <Path d="M132 51L165 49M127 78L171 74" fill="none" strokeWidth="2" />
 </G>
 <Path d="M157 54L201 101Q183 94 174 99Z" fill="#D6E4EE" strokeWidth="1.2" />
 
 <Path d="M44 108Q98 113 154 110L191 104Q183 119 167 125L72 125Q54 121 44 108Z" fill="#182B43" strokeWidth="1.5" />
 <Path d="M56 112Q111 119 177 110" fill="none" stroke="#94AFBF" strokeWidth="1.3" />
 <G fill="#DAE6EE" stroke="none"><Rect x="77" y="117" width="5" height="2.5" rx="1" /><Rect x="95" y="118" width="5" height="2.5" rx="1" /><Rect x="113" y="118" width="5" height="2.5" rx="1" /><Rect x="131" y="117" width="5" height="2.5" rx="1" /></G>
</G>


      </Svg>
    </Animated.View>
    <Svg width={width} height={height} viewBox="0 0 240 168" style={StyleSheet.absoluteFill}>
      <Defs><ClipPath id={`${id}-sea`}><Path d="M17 126Q120 115 224 126V151H17Z" /></ClipPath></Defs>
      <G clipPath={`url(#${id}-sea)`} fill="none" strokeLinecap="round">
        <AnimatedPath animatedProps={frontWater} stroke="#647F98" strokeWidth={1.8} />
        <AnimatedPath animatedProps={secondWater} stroke="#647F98" strokeWidth={1.8} opacity={0.35}/>
        <AnimatedPath animatedProps={wake} stroke="#8CAEC5" strokeWidth={2}/>
      </G>
    </Svg>
  </View>;
}
