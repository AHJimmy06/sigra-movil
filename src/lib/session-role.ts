import type { MobileUser } from '@/types/models';

export function isMobileUser(value: unknown): value is MobileUser {
  if (!value || typeof value !== 'object') return false;
  const user = value as Record<string, unknown>;
  if (typeof user.sub !== 'string' || !user.sub || typeof user.email !== 'string' || !user.email) return false;
  return user.role === 'GUARD'
    ? user.residentId == null
    : user.role === 'RESIDENT' && typeof user.residentId === 'string' && Boolean(user.residentId);
}

export function homeForUser(user: MobileUser | null): '/(guard)/scanner' | '/(tabs)' | '/login' {
  return user?.role === 'GUARD' ? '/(guard)/scanner' : user?.role === 'RESIDENT' ? '/(tabs)' : '/login';
}

export function canSyncResident(user: MobileUser | null, token: string | null): boolean {
  return Boolean(token && user?.role === 'RESIDENT' && user.residentId);
}
