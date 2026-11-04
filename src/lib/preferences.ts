import * as SecureStore from 'expo-secure-store';

type KeyValueBackend = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
};

const memoryStore = new Map<string, string>();

const storage: KeyValueBackend = {
  getString(key: string) {
    if (memoryStore.has(key)) {
      return memoryStore.get(key);
    }
    try {
      const value = SecureStore.getItem(`sigra.pref.${key}`);
      if (value !== null) {
        memoryStore.set(key, value);
        return value;
      }
    } catch {}
    return undefined;
  },
  set(key: string, value: string) {
    memoryStore.set(key, value);
    try {
      SecureStore.setItem(`sigra.pref.${key}`, value);
    } catch {}
  },
  remove(key: string) {
    memoryStore.delete(key);
    try {
      void SecureStore.deleteItemAsync(`sigra.pref.${key}`);
    } catch {}
  },
};

export const preferences = {
  getLastSync: () => storage.getString('lastSync') ?? null,
  setLastSync: (value: string) => storage.set('lastSync', value),
  getAnnouncementCursor: () => storage.getString('announcementCursor') ?? null,
  setAnnouncementCursor: (cursor: string) => storage.set('announcementCursor', cursor),
  clearPreferences: () => {
    storage.remove('lastSync');
    storage.remove('announcementCursor');
  },
  clearResidentMetadata: () => {
    storage.remove('lastSync');
    storage.remove('announcementCursor');
  },
};
