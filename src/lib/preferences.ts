import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'sigra.preferences' });

export const preferences = {
  getLastSync: () => storage.getString('lastSync') ?? null,
  setLastSync: (value: string) => storage.set('lastSync', value),
  clearResidentMetadata: () => storage.remove('lastSync'),
};
