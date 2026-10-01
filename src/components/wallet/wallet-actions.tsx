import { QrCode } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing, Extrapolation, interpolate, interpolateColor, useAnimatedProps, useAnimatedStyle,
  useReducedMotion, useSharedValue, withTiming, type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { WalletPalette as W } from '@/constants/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const OPEN_MS = 380;
const CLOSE_MS = 320;
const CURVE = Easing.bezier(0.22, 1, 0.36, 1);
type Mode = 'idle' | 'deposit' | 'withdraw';
type Props = { onContact: (mode: 'deposit' | 'withdraw') => void; onScan: () => void; onReceive: () => void };

function ContactIcon() {
  return <Svg width={21} height={21} viewBox="0 0 24 24"
    accessible={Platform.OS === 'web' ? undefined : false} aria-hidden={Platform.OS === 'web' ? true : undefined}>
    <Circle cx={12} cy={12} r={11} fill={W.ink} />
    <Circle cx={12} cy={9} r={3.4} fill={W.white} />
    <Path d="M5.8 18.4a6.2 6.2 0 0 1 12.4 0 8.5 8.5 0 0 1-12.4 0Z" fill={W.white} />
  </Svg>;
}

/** Two equal-topology strokes let the opposite arrow become the close X. */
function MorphArrow({ progress, down, morph = true }: { progress: SharedValue<number>; down?: boolean; morph?: boolean }) {
  const shaft = useAnimatedProps(() => {
    const p = morph ? Math.min(1, Math.max(0, progress.get())) : 0;
    return { d: down ? 'M18 6L6 18' : `M6 ${18 - 12 * p}L18 ${6 + 12 * p}` };
  });
  const head = useAnimatedProps(() => {
    const p = morph ? Math.min(1, Math.max(0, progress.get())) : 0;
    return { d: down
      ? `M6 ${8 - 2 * p}L${6 + 6 * p} ${18 - 6 * p}L${16 + 2 * p} 18`
      : `M${8 - 2 * p} ${6 + 12 * p}L${18 - 6 * p} ${6 + 6 * p}L18 ${16 - 10 * p}` };
  });
  return <Svg width={25} height={25} viewBox="0 0 24 24"
    accessible={Platform.OS === 'web' ? undefined : false} aria-hidden={Platform.OS === 'web' ? true : undefined}>
    <AnimatedPath animatedProps={shaft} stroke={W.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <AnimatedPath animatedProps={head} stroke={W.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>;
}

function Content({ progress, incoming, children, style }: {
  progress: SharedValue<number>; incoming?: boolean; children: ReactNode; style?: ViewStyle;
}) {
  const animated = useAnimatedStyle(() => {
    const p = progress.get();
    const opacity = incoming
      ? interpolate(p, [0.2, 0.78], [0, 1], Extrapolation.CLAMP)
      : interpolate(p, [0, 0.52], [1, 0], Extrapolation.CLAMP);
    // RN's blur filter is available on web and Android 12+, but not iOS.
    const blur = (1 - opacity) * 5;
    return {
      opacity, transform: [{ scale: 0.92 + opacity * 0.08 }],
      ...(Platform.OS === 'web' || (Platform.OS === 'android' && Number(Platform.Version) >= 31)
        ? { filter: [{ blur }] } : {}),
    };
  });
  return <Animated.View pointerEvents="none" style={[styles.content, style, animated]}>{children}</Animated.View>;
}

export function WalletActions({ onContact, onScan, onReceive }: Props) {
  const [mode, setMode] = useState<Mode>('idle');
  const [direction, setDirection] = useState<'deposit' | 'withdraw'>('deposit');
  const [width, setWidth] = useState(320);
  const progress = useSharedValue(0);
  const arrowProgress = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const withdraw = direction === 'withdraw';

  useEffect(() => {
    const target = mode === 'idle' ? 0 : 1;
    progress.set(reduceMotion ? target : withTiming(target, { duration: target ? OPEN_MS : CLOSE_MS, easing: CURVE }));
    arrowProgress.set(reduceMotion ? target : withTiming(target, { duration: target ? OPEN_MS : CLOSE_MS, easing: CURVE }));
  }, [mode, reduceMotion, progress, arrowProgress]);

  const changeMode = (next: 'deposit' | 'withdraw') => { setDirection(next); setMode(next); };
  const close = () => setMode('idle');
  const gap = 8;
  const closeWidth = 48;
  const contactWidth = (width - closeWidth - gap * 2) * 0.49;
  const qrWidth = width - closeWidth - contactWidth - gap * 2;
  const initialDepositWidth = (width - gap) / 2;
  const initialWithdrawWidth = (width - gap) / 2;
  const initialLeft = (width - initialDepositWidth - initialWithdrawWidth - gap) / 2;

  const leftStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.get(), [0, 1], [initialDepositWidth, withdraw ? closeWidth : contactWidth]),
    transform: [{ translateX: interpolate(progress.get(), [0, 1], [initialLeft, 0]) }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.get(), [0, 1], [initialWithdrawWidth, withdraw ? qrWidth : closeWidth]),
    transform: [{ translateX: interpolate(progress.get(), [0, 1], [initialLeft + initialDepositWidth + gap, withdraw ? closeWidth + gap * 2 + contactWidth : width - closeWidth]) }],
  }));
  const middleStyle = useAnimatedStyle(() => ({
    width: withdraw ? contactWidth : qrWidth,
    opacity: interpolate(progress.get(), [0.1, 0.6], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateX: interpolate(progress.get(), [0, 1], [width * 0.42, withdraw ? closeWidth + gap : contactWidth + gap]) },
      { scaleX: interpolate(progress.get(), [0, 1], [0.45, 1]) },
    ],
  }));
  const closeTint = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], [withdraw ? W.deposit[1] : W.withdraw[1], W.surface]),
    left: interpolate(progress.get(), [0, 1], [5, 1]),
  }));

  return <View style={styles.frame} onLayout={event => setWidth(event.nativeEvent.layout.width)} testID="wallet-actions">
    <Animated.View style={[styles.pill, leftStyle]} testID="wallet-action-left">
      <AuthButton style={StyleSheet.absoluteFill} accessibilityRole="button"
        accessibilityLabel={mode === 'idle' ? 'Deposit' : withdraw ? 'Close withdraw options' : 'Deposit from a contact'}
        testID={mode === 'idle' ? 'wallet-deposit' : withdraw ? 'wallet-close' : 'wallet-contact'}
        onPress={mode === 'idle' ? () => changeMode('deposit') : withdraw ? close : () => onContact('deposit')}>
        {withdraw ? <>
          <Animated.View style={[styles.coloredIcon, closeTint]}><MorphArrow progress={arrowProgress} /></Animated.View>
          <Content progress={progress} style={styles.startLabel}><Text style={styles.label}>Deposit</Text></Content>
        </> : <>
          <Content progress={progress}>
            <View style={[styles.coloredIcon, styles.green]}><MorphArrow progress={arrowProgress} morph={false} /></View>
            <Text style={[styles.label, styles.initialText]}>Deposit</Text>
          </Content>
          <Content progress={progress} incoming><ContactIcon /><Text style={styles.label}>Contact</Text></Content>
        </>}
      </AuthButton>
    </Animated.View>
    <Animated.View style={[styles.pill, middleStyle]} pointerEvents={mode === 'idle' ? 'none' : 'auto'}
      accessibilityElementsHidden={mode === 'idle'} importantForAccessibility={mode === 'idle' ? 'no-hide-descendants' : 'auto'}>
      <AuthButton style={StyleSheet.absoluteFill} accessibilityRole="button" disabled={mode === 'idle'}
        accessibilityLabel={withdraw ? 'Withdraw to a contact' : 'My QR'}
        testID={withdraw ? 'wallet-contact' : 'wallet-my-qr'}
        onPress={withdraw ? () => onContact('withdraw') : onReceive}>
        <Content progress={progress} incoming>
          {withdraw ? <ContactIcon /> : <QrCode size={21} strokeWidth={2.2} color={W.ink} />}
          <Text style={styles.label}>{withdraw ? 'Contact' : 'My QR'}</Text>
        </Content>
      </AuthButton>
    </Animated.View>
    <Animated.View style={[styles.pill, rightStyle]} testID="wallet-action-right">
      <AuthButton style={StyleSheet.absoluteFill} accessibilityRole="button"
        accessibilityLabel={mode === 'idle' ? 'Withdraw' : withdraw ? 'Scan QR' : 'Close deposit options'}
        testID={mode === 'idle' ? 'wallet-withdraw' : withdraw ? 'wallet-scan' : 'wallet-close'}
        onPress={mode === 'idle' ? () => changeMode('withdraw') : withdraw ? onScan : close}>
        {withdraw ? <>
          <Content progress={progress}>
            <View style={[styles.coloredIcon, styles.blue]}><MorphArrow progress={arrowProgress} down morph={false} /></View>
            <Text style={[styles.label, styles.initialText]}>Withdraw</Text>
          </Content>
          <Content progress={progress} incoming><QrCode size={21} strokeWidth={2.2} color={W.ink} /><Text style={styles.label}>Scan QR</Text></Content>
        </> : <>
          <Animated.View style={[styles.coloredIcon, closeTint]}><MorphArrow progress={arrowProgress} down /></Animated.View>
          <Content progress={progress} style={styles.startLabel}><Text style={styles.label}>Withdraw</Text></Content>
        </>}
      </AuthButton>
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  frame: { height: 56, marginTop: 16 },
  pill: { position: 'absolute', top: 0, left: 0, height: 56, borderRadius: 28, borderWidth: 1, borderColor: W.border, backgroundColor: W.surface, overflow: 'hidden', boxShadow: W.shadow },
  content: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  coloredIcon: { position: 'absolute', left: 5, top: 5, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  green: { backgroundColor: W.deposit[1] },
  blue: { backgroundColor: W.withdraw[1] },
  label: { fontFamily: InterFont.semiBold, fontSize: W.actionLabelSize, color: W.ink },
  initialText: { position: 'absolute', left: 55 },
  startLabel: { left: 46, justifyContent: 'flex-start', paddingLeft: 8 },
});
