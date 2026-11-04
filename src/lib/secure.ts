import * as SecureStore from 'expo-secure-store';
import type { Provisioning, ResidentUser } from '@/types/models';

const TOKEN_KEY = 'sigra.session.token';
const USER_KEY = 'sigra.session.user';
const passKey = (id: string) => `sigra.pass.${id}`;
const passQrCacheKey = (id: string) => `sigra.pass.qr.${id}`;

export const secure = {
  async saveSession(token: string, user: ResidentUser) {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);
  },
  async loadSession() {
    const [token, rawUser] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);
    if (!token || !rawUser) return null;
    return { token, user: JSON.parse(rawUser) as ResidentUser };
  },
  clearSession: () =>
    Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(USER_KEY)]),
  savePass: (value: Provisioning) => SecureStore.setItemAsync(passKey(value.passId), JSON.stringify(value)),
  async loadPass(id: string) {
    const value = await SecureStore.getItemAsync(passKey(id));
    return value ? (JSON.parse(value) as Provisioning) : null;
  },
  saveCachedQrPayload: (passId: string, payload: string) =>
    SecureStore.setItemAsync(passQrCacheKey(passId), payload),
  getCachedQrPayload: (passId: string) => SecureStore.getItemAsync(passQrCacheKey(passId)),
  deletePass: async (id: string) => {
    await Promise.all([
      SecureStore.deleteItemAsync(passKey(id)),
      SecureStore.deleteItemAsync(passQrCacheKey(id)),
    ]);
  },
};
