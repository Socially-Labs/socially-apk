import Constants from 'expo-constants';
import { developmentOrigin } from './development-origin';

/** Account, REST and websocket clients must all use the same backend host. */
export function getApiOrigin(): string | undefined {
  const hostUri = typeof window !== 'undefined' && window.location?.host
    ? window.location.host : Constants.expoConfig?.hostUri;
  return developmentOrigin(process.env.EXPO_PUBLIC_API_URL, hostUri,
    __DEV__ && process.env.EXPO_PUBLIC_API_FOLLOW_METRO === 'true');
}
