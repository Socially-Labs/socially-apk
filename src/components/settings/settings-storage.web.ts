export const settingsStorage = {
  read: async (key: string) => window.localStorage.getItem(key),
  write: async (key: string, value: string) => { window.localStorage.setItem(key, value); },
};
