import { focusedFieldScrollDelta } from './keyboard-geometry';
import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { Keyboard, Platform, ScrollView, TextInput, type ScrollViewProps } from 'react-native';

/** Scroll only enough to reveal an obscured field, after focus, layout or keyboard changes. */
export function KeyboardScrollView({ ref, focusClearance = 16, onFocus, onLayout, onContentSizeChange, onScroll, ...props }:
  ScrollViewProps & { ref?: Ref<ScrollView>; focusClearance?: number }) {
  const scroll = useRef<ScrollView>(null);
  const offset = useRef(0);
  const focused = useRef<ReturnType<typeof TextInput.State.currentlyFocusedInput>>(null);
  const frame = useRef<number | null>(null);
  useImperativeHandle(ref, () => scroll.current!, []);
  const reveal = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const container = scroll.current;
      if (!container) return;
      if (Platform.OS === 'web') {
        const node = container.getScrollableNode() as HTMLElement | null;
        const input = document.activeElement;
        if (!node || !(input instanceof HTMLElement) || !node.contains(input) || !input.matches('input,textarea,[contenteditable="true"]')) return;
        const bounds = node.getBoundingClientRect(), field = input.getBoundingClientRect();
        const bottom = Math.min(bounds.bottom, window.visualViewport ? window.visualViewport.offsetTop + window.visualViewport.height : window.innerHeight);
        const delta = focusedFieldScrollDelta(bounds.top, bottom, field.top, field.height, focusClearance);
        if (delta) node.scrollTop += delta;
        return;
      }
      const input = TextInput.State.currentlyFocusedInput();
      if (!input || input !== focused.current) return;
      // Measure the field whose focus bubbled through this scroll view.
      input.measureLayout(container.getInnerViewNode(), () => {
        container.getNativeScrollRef()?.measureInWindow((_x, top, _width, height) => {
          input.measureInWindow((_ix, fieldTop, _iw, fieldHeight) => {
            if (scroll.current !== container || TextInput.State.currentlyFocusedInput() !== input) return;
            const bottom = Math.min(top + height, Keyboard.metrics()?.screenY ?? Infinity);
            const delta = focusedFieldScrollDelta(top, bottom, fieldTop, fieldHeight, focusClearance);
            if (delta) container.scrollTo({ y: Math.max(0, offset.current + delta), animated: false });
          });
        });
      }, () => {});
    });
  }, [focusClearance]);
  useEffect(() => {
    const keyboard = Keyboard.addListener('keyboardDidShow', reveal);
    const change = Platform.OS === 'web' ? () => reveal() : undefined;
    if (change) { window.addEventListener('resize', change); window.visualViewport?.addEventListener('resize', change); }
    return () => {
      keyboard.remove();
      if (change) { window.removeEventListener('resize', change); window.visualViewport?.removeEventListener('resize', change); }
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [reveal]);
  return <ScrollView {...props} ref={scroll} keyboardShouldPersistTaps={props.keyboardShouldPersistTaps ?? 'handled'}
    // RN Web dismisses on every scroll, including our programmatic field reveal.
    keyboardDismissMode={Platform.OS === 'web' ? 'none' : props.keyboardDismissMode ?? (Platform.OS === 'ios' ? 'interactive' : 'on-drag')}
    scrollEventThrottle={16}
    onFocus={event => { if (Platform.OS !== 'web') focused.current = TextInput.State.currentlyFocusedInput(); onFocus?.(event); reveal(); }}
    onLayout={event => { onLayout?.(event); reveal(); }}
    onContentSizeChange={(width, height) => { onContentSizeChange?.(width, height); reveal(); }}
    onScroll={event => { offset.current = event.nativeEvent.contentOffset.y; onScroll?.(event); }} />;
}
