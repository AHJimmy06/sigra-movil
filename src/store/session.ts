import { create } from 'zustand';
import { api } from '@/lib/api';
import { secure } from '@/lib/secure';
import type { ResidentUser } from '@/types/models';

type SessionState = {
  status: 'booting' | 'anonymous' | 'authenticated';
  token: string | null;
  user: ResidentUser | null;
  error: string | null;
  restore(): Promise<void>;
  login(email: string, password: string): Promise<void>;
  clear(): void;
};

export const useSession = create<SessionState>((set) => ({
  status: 'booting', token: null, user: null, error: null,
  async restore() {
    try {
      const session = await secure.loadSession();
      if (!session || session.user.role !== 'RESIDENT' || !session.user.residentId) {
        if (session) await secure.clearSession();
        set({ status: 'anonymous', token: null, user: null });
        return;
      }
      set({ status: 'authenticated', ...session });
    } catch {
      set({ status: 'anonymous', token: null, user: null, error: 'Could not restore the secure session.' });
    }
  },
  async login(email, password) {
    set({ error: null });
    const result = await api.login(email.trim().toLowerCase(), password);
    if (result.user.role !== 'RESIDENT' || !result.user.residentId) {
      throw new Error('This app is available only to resident accounts.');
    }
    await secure.saveSession(result.accessToken, result.user);
    set({ status: 'authenticated', token: result.accessToken, user: result.user, error: null });
  },
  clear: () => set({ status: 'anonymous', token: null, user: null, error: null }),
}));
