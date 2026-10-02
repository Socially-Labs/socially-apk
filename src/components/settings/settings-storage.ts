import * as SecureStore from 'expo-secure-store';

export const settingsStorage = {
  read: (key: string) => SecureStore.getItemAsync(key),
  write: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};
