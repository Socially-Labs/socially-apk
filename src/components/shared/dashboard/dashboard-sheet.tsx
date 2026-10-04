import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { AuthButton } from '@/components/shared/motion';
import { selectionFeedback } from '@/components/shared/feedback';
import { InterFont } from '@/constants/fonts';
import { Motion } from '@/constants/motion';
import { Dashboard, DashboardSheetTheme as S } from '@/constants/theme';

type SheetProps = { visible: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode };
const SETTLE = { duration: S.openDuration, dampingRatio: 0.94 };
const EXIT = Easing.bezier(0.4, 0, 1, 1);

export function DashboardSheet(props: SheetProps) {
  const [presented, setPresented] = useState(props.visible);
  const visible = useRef(props.visible);
  useLayoutEffect(() => { visible.current = props.visible; }, [props.visible]);

  // Keep the native modal mounted until its slide-out has actually finished.
  if (props.visible && !presented) setPresented(true);
  const finishDismiss = useCallback(() => {
    if (!visible.current) setPresented(false);
  }, []);

  return (
    <Modal visible={presented} transparent animationType="none" statusBarTranslucent navigationBarTranslucent
      onRequestClose={props.onClose}>
      {presented ? <SheetPanel {...props} onExited={finishDismiss} /> : null}
    </Modal>
  );
}

function SheetPanel({ visible, title, children, footer, onClose, onExited }: SheetProps & { onExited: () => void }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const bottom = Math.max(insets.bottom, S.inset);
  const maxHeight = Math.min(height * 0.8, height - insets.top - bottom - 24);
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  const drag = useSharedValue(0);
  const dragStart = useSharedValue(0);
  const crossedThreshold = useSharedValue(false);
  const sheetHeight = useSharedValue(maxHeight);
  const [content, setContent] = useState({ title, children, footer });

  // Callers clear their selected item on close. Retain the last visible content
  // so its title and body travel out together rather than emptying mid-animation.
  if (visible && (content.title !== title || content.children !== children || content.footer !== footer)) setContent({ title, children, footer });

  useEffect(() => {
    if (visible) {
      drag.set(reduceMotion ? 0 : withSpring(0, Motion.settleSpring));
      progress.set(reduceMotion ? 1 : withSpring(1, SETTLE));
    } else if (reduceMotion) {
      progress.set(0);
      onExited();
    } else {
      progress.set(withTiming(0, { duration: S.closeDuration, easing: EXIT }, finished => {
        if (finished) scheduleOnRN(onExited);
      }));
    }
  }, [visible, reduceMotion, progress, drag, onExited]);

  useEffect(() => () => {
    cancelAnimation(progress);
    cancelAnimation(drag);
  }, [progress, drag]);

  const panelStyle = useAnimatedStyle(() => ({
    // Full-height travel, like the reference; its interior stays one coherent surface.
    transform: [{ translateY: (1 - progress.get()) * (sheetHeight.get() + bottom + 24) + drag.get() }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, progress.get() * (1 - Math.max(0, drag.get()) / sheetHeight.get()))),
  }));

  const pan = Gesture.Pan().enabled(visible).activeOffsetY([-6, 6])
    .onStart(() => { cancelAnimation(drag); dragStart.set(drag.get()); crossedThreshold.set(false); })
    .onUpdate(event => {
      const distance = dragStart.get() + event.translationY;
      drag.set(distance < 0 ? distance * 0.12 : distance);
      if (!crossedThreshold.get() && distance > Math.min(96, sheetHeight.get() * 0.25)) {
        crossedThreshold.set(true);
        scheduleOnRN(selectionFeedback);
      }
    })
    .onEnd(event => {
      if (drag.get() > Math.min(96, sheetHeight.get() * 0.25) || (event.velocityY > 900 && drag.get() > 12)) {
        // Fold the drag into progress before the controlled close starts, preserving position.
        progress.set(Math.max(0, progress.get() - drag.get() / (sheetHeight.get() + bottom + 24)));
        drag.set(0);
        scheduleOnRN(onClose);
      } else {
        drag.set(reduceMotion ? 0 : withSpring(0, Motion.settleSpring));
      }
    })
    .onFinalize((_event, success) => {
      if (!success) drag.set(reduceMotion ? 0 : withSpring(0, Motion.settleSpring));
    });

  return (
    <GestureHandlerRootView style={styles.root} testID="dashboard-sheet-overlay">
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} pointerEvents="none"
        testID="dashboard-sheet-backdrop" />
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} disabled={!visible}
        accessibilityLabel="Dismiss details" accessibilityRole="button" testID="dashboard-sheet-dismiss" />
      <Animated.View style={[styles.sheet, { maxHeight, marginBottom: bottom }, panelStyle]}
        onLayout={event => sheetHeight.set(event.nativeEvent.layout.height)}
        accessibilityViewIsModal testID="dashboard-sheet" pointerEvents={visible ? 'auto' : 'none'}>
        <LinearGradient colors={S.gradient} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <GestureDetector gesture={pan}>
          <View>
          <View style={styles.handleArea} testID="dashboard-sheet-handle" accessible accessibilityRole="button"
            accessibilityLabel="Dismiss details with the grab handle"
            accessibilityActions={[{ name: 'activate', label: 'Close details' }, { name: 'escape', label: 'Close details' }]}
            onAccessibilityAction={event => {
              if (event.nativeEvent.actionName === 'activate' || event.nativeEvent.actionName === 'escape') onClose();
            }}>
            <View style={styles.handle} />
          </View>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>{content.title}</Text>
          <AuthButton accessibilityRole="button" accessibilityLabel="Close details" onPress={onClose} disabled={!visible}
            style={styles.close}>
            <X size={19} color={Dashboard.icon} strokeWidth={1.9} />
          </AuthButton>
        </View>
          </View>
        </GestureDetector>
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} bounces={false}
          keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false} testID="dashboard-sheet-content">
          {content.children}
        </ScrollView>
        {content.footer ? <View style={styles.footer}>{content.footer}</View> : null}
      </Animated.View>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: S.inset },
  backdrop: { backgroundColor: S.backdrop },
  sheet: { width: '100%', maxWidth: Dashboard.maxWidth, alignSelf: 'center', flexShrink: 1,
    backgroundColor: S.surface, borderRadius: S.radius, borderWidth: 1, borderColor: S.border,
    paddingHorizontal: 16, paddingBottom: 16, overflow: 'hidden', boxShadow: S.shadow },
  handleArea: { height: 36, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 34, height: 4, borderRadius: 2, backgroundColor: S.handle },
  heading: { minHeight: 44, justifyContent: 'center', marginBottom: 16 },
  title: { fontFamily: InterFont.semiBold, fontSize: S.titleSize, lineHeight: 27, color: Dashboard.ink,
    textAlign: 'center', paddingHorizontal: 48, paddingVertical: 5 },
  close: { position: 'absolute', right: 0, width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', backgroundColor: S.close },
  body: { flexShrink: 1, borderRadius: S.bodyRadius, backgroundColor: S.body,
    borderWidth: 1, borderColor: S.bodyBorder },
  bodyContent: { padding: 16 },
  footer: { paddingTop: 12 },
});
