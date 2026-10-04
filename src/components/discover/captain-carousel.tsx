import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, FlatList, Platform, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Motion } from '@/constants/motion';
import { type DiscoverCaptain, type Period } from '@/constants/discover';
import { Spotlight } from './discover-ui';

export function CaptainCarousel({ captains, period, active, onOpen }: {
  captains: readonly DiscoverCaptain[]; period: Period; active: boolean;
  onOpen: (captain: DiscoverCaptain) => void;
}) {
  const list = useRef<FlatList<DiscoverCaptain>>(null);
  const indexRef = useRef(0);
  const restoreOffset = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const [paused, setPaused] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  // Wait for the accessibility preference before starting automatic movement.
  const [screenReader, setScreenReader] = useState(Platform.OS !== 'web');
  const systemReduceMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(systemReduceMotion);
  const pause = useCallback(() => setPaused(true), []);
  const beginDrag = useCallback(() => { restoreOffset.current = null; pause(); }, [pause]);
  const canRotate = captains.length > 1 && !reduceMotion && !screenReader;
  const rotating = canRotate && active && foreground && !paused;

  useEffect(() => {
    let mounted = true;
    // RN Web reports every visitor as a screen reader user. On web, rely on
    // reduced-motion preferences and pause when a card receives focus or touch.
    if (Platform.OS !== 'web') {
      AccessibilityInfo.isScreenReaderEnabled().then(enabled => { if (mounted) setScreenReader(enabled); }).catch(() => {});
    }
    const reader = Platform.OS !== 'web' ? AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader) : undefined;
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const app = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => { mounted = false; reader?.remove(); motion.remove(); app.remove(); };
  }, []);

  const goTo = useCallback((next: number) => {
    if (!width || !captains.length) return;
    restoreOffset.current = null;
    // At the end, reset directly rather than flying backwards over every fund.
    const wrap = next === 0 && indexRef.current === captains.length - 1;
    list.current?.scrollToOffset({ offset: next * width, animated: !reduceMotion && !wrap });
  }, [width, captains.length, reduceMotion]);

  useEffect(() => {
    if (!rotating || !width) return;
    const timer = setTimeout(() => goTo((indexRef.current + 1) % captains.length), Motion.carouselDwell);
    return () => clearTimeout(timer);
  }, [rotating, width, index, captains.length, goTo]);

  useEffect(() => {
    // Detached screens can reset their DOM scroll position; preserve the fund
    // while hidden and restore its offset as soon as the tab becomes active.
    if (width) {
      restoreOffset.current = indexRef.current * width;
      if (active) list.current?.scrollToOffset({ offset: restoreOffset.current, animated: false });
    }
  }, [active, width]);

  function trackPage(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!active || !width || event.nativeEvent.layoutMeasurement.width <= 0) return;
    if (restoreOffset.current !== null) {
      if (Math.abs(event.nativeEvent.contentOffset.x - restoreOffset.current) > 1) return;
      restoreOffset.current = null;
    }
    const next = Math.max(0, Math.min(captains.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)));
    if (next !== indexRef.current) { indexRef.current = next; setIndex(next); }
  }

  if (!captains.length) return null;
  return <View testID="captain-carousel" onLayout={event => {
    const next = event.nativeEvent.layout.width;
    if (next > 0 && next !== width) { restoreOffset.current = indexRef.current * next; setWidth(next); }
  }}>
    {width > 0 ? <FlatList ref={list} horizontal pagingEnabled data={captains}
      keyExtractor={captain => captain.id} testID="captain-carousel-pages" style={styles.pages}
      showsHorizontalScrollIndicator={false} bounces={false} decelerationRate="fast"
      snapToInterval={width} disableIntervalMomentum directionalLockEnabled
      initialNumToRender={Platform.OS === 'web' ? captains.length : 2} maxToRenderPerBatch={2} windowSize={3}
      getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
      onScroll={trackPage} scrollEventThrottle={32} onScrollBeginDrag={beginDrag} onTouchStart={beginDrag}
      extraData={index}
      renderItem={({ item, index: itemIndex }) => <View style={[styles.page, { width }]}
        aria-hidden={itemIndex !== index} accessibilityElementsHidden={itemIndex !== index}
        importantForAccessibility={itemIndex !== index ? 'no-hide-descendants' : 'auto'}>
        {/* Disabling offscreen cards keeps them out of the web tab order too. */}
        <Spotlight captain={item} period={period} eyebrow="TOP CAPTAIN" disabled={itemIndex !== index}
          testID={`captain-open-${item.id}`} onInteract={pause} onOpen={() => { pause(); onOpen(item); }} />
      </View>} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  pages: { minHeight: 246 },
  page: { paddingHorizontal: 3, paddingTop: 4, paddingBottom: 12 },
});
