import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform, TextInput } from 'react-native';

function isVisible() {
  if (Platform.OS !== 'web') return Keyboard.isVisible();
  if (typeof document === 'undefined') return false;
  const element = document.activeElement;
  const typing = element instanceof HTMLElement && element.matches('input,textarea,[contenteditable="true"]');
  // Desktop focus alone must not collapse/reposition controls during a click.
  const shortViewport = window.innerHeight < 600 || (window.visualViewport?.height ?? window.innerHeight) < window.innerHeight - 100;
  return typing && shortViewport;
}

/** Observe the native IME, or editable focus within a reduced web viewport. */
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(isVisible);
  useEffect(() => {
    if (Platform.OS === 'web') {
      const update = () => setVisible(isVisible());
      document.addEventListener('focusin', update);
      document.addEventListener('focusout', update);
      window.addEventListener('resize', update);
      window.visualViewport?.addEventListener('resize', update);
      return () => {
        document.removeEventListener('focusin', update);
        document.removeEventListener('focusout', update);
        window.removeEventListener('resize', update);
        window.visualViewport?.removeEventListener('resize', update);
      };
    }
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setVisible(false));
    // Android 10 and earlier may omit IME events under adjustResize.
    let baseline = Dimensions.get('window');
    const resize = Platform.OS === 'android' ? Dimensions.addEventListener('change', ({ window: next }) => {
      if (next.width !== baseline.width || next.height > baseline.height) baseline = next;
      if (baseline.height - next.height > 100 && TextInput.State.currentlyFocusedInput()) setVisible(true);
      else if (next.height >= baseline.height - 100) setVisible(Keyboard.isVisible());
    }) : null;
    return () => { show.remove(); hide.remove(); resize?.remove(); };
  }, []);
  return visible;
}
