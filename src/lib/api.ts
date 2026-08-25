import type { Announcement, Pass, Provisioning, ResidentUser } from '@/types/models';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL is not configured');
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      message = Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? message);
    } catch {}
    throw new ApiError(message, response.status);
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: ResidentUser }>('/auth/login', undefined, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  announcements: (token: string) => request<Announcement[]>('/announcements/published', token),
  passes: (token: string) => request<Pass[]>('/access/passes', token),
  createPass: (token: string, validDays: number) =>
    request<Pass>('/access/passes', token, {
      method: 'POST',
      body: JSON.stringify({ validDays }),
    }),
  revokePass: (token: string, id: string) =>
    request<void>(`/access/passes/${id}/revoke`, token, { method: 'POST' }),
  provisionPass: (token: string, id: string) =>
    request<Provisioning>(`/access/passes/${id}/provision`, token),
  createTicket: (token: string, form: FormData) =>
    request<{ id: string }>('/tickets', token, { method: 'POST', body: form }),
};
