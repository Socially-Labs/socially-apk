import * as Haptics from 'expo-haptics';
import { AppState, Platform } from 'react-native';

let lastFeedback = 0;
function play(effect: () => Promise<void>, throttle = false) {
  if (Platform.OS === 'web' || AppState.currentState !== 'active') return;
  const now = Date.now();
  if (throttle && now - lastFeedback < 100) return;
  lastFeedback = now;
  // Feedback must never prevent an action on devices without a haptic engine.
  void effect().catch(() => {});
}

export const selectionFeedback = () => play(() => Haptics.selectionAsync(), true);
export const successFeedback = () => play(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const errorFeedback = () => play(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
