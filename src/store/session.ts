import { create } from 'zustand';
import { api } from '@/lib/api';
import { secure } from '@/lib/secure';
import type { MobileUser } from '@/types/models';
import { isMobileUser } from '@/lib/session-role';

type SessionState = {
  status: 'booting' | 'anonymous' | 'authenticated';
  token: string | null;
  user: MobileUser | null;
  error: string | null;
  restore(): Promise<void>;
  login(email: string, password: string): Promise<void>;
  clear(): void;
};

export const useSession = create<SessionState>((set) => ({
  status: 'booting',
  token: null,
  user: null,
  error: null,
  async restore() {
    try {
      const session = await secure.loadSession();
      if (!session || !session.token || !isMobileUser(session.user)) {
        if (session) await secure.clearSession();
        set({ status: 'anonymous', token: null, user: null });
        return;
      }
      set({ status: 'authenticated', ...session });
    } catch {
      set({
        status: 'anonymous',
        token: null,
        user: null,
        error: 'No se pudo restaurar la sesión segura del dispositivo.',
      });
    }
  },
  async login(email, password) {
    set({ error: null });
    const result = await api.login(email.trim().toLowerCase(), password);
    if (!result.accessToken || !isMobileUser(result.user)) {
      throw new Error('Use una cuenta de residente o guardia para ingresar.');
    }
    await secure.saveSession(result.accessToken, result.user);
    set({ status: 'authenticated', token: result.accessToken, user: result.user, error: null });
  },
  clear: () => set({ status: 'anonymous', token: null, user: null, error: null }),
}));
