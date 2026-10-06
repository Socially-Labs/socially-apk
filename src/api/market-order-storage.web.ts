// Only recovery intent/order IDs are stored; access tokens are never persisted here.
export const orderStorage = {
  read: async (key: string) => localStorage.getItem(key),
  write: async (key: string, value: string) => { localStorage.setItem(key, value); },
  remove: async (key: string) => { localStorage.removeItem(key); },
};
