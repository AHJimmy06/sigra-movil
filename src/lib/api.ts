import type {
  PaginatedTicketsResponse,
  Pass,
  PassQrResponse,
  Provisioning,
  ResidentAnnouncementFeedResponse,
  ResidentUser,
  ServerTicket,
} from '@/types/models';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

type ErrorEnvelope = {
  code?: string;
  message?: string | string[];
  requestId?: string;
  details?: Record<string, string[]>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: Record<string, string[]>,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function formatErrorMessage(body: ErrorEnvelope, fallback: string): string {
  const baseMessage = Array.isArray(body.message)
    ? body.message.join(', ')
    : (body.message ?? fallback);

  if (body.details && typeof body.details === 'object') {
    const fieldMessages = Object.entries(body.details).flatMap(([field, issues]) =>
      Array.isArray(issues) ? issues.map((issue) => `${field}: ${issue}`) : [],
    );
    if (fieldMessages.length > 0) {
      return `${baseMessage} (${fieldMessages.join('; ')})`;
    }
  }
  return baseMessage;
}

async function request<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL no está configurada');
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let message = `Error de solicitud (${response.status})`;
    let code: string | undefined;
    let details: Record<string, string[]> | undefined;
    let requestId: string | undefined;
    try {
      const body = (await response.json()) as ErrorEnvelope;
      code = body.code;
      details = body.details;
      requestId = body.requestId;
      message = formatErrorMessage(body, message);
    } catch {}
    throw new ApiError(message, response.status, code, details, requestId);
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: ResidentUser }>('/auth/login', undefined, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  residentAnnouncements: async (
    token: string,
    cursor?: string | null,
    limit = 100,
  ): Promise<ResidentAnnouncementFeedResponse> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return request<ResidentAnnouncementFeedResponse>(
      `/resident/announcements?${params.toString()}`,
      token,
    );
  },
  passes: (token: string) => request<Pass[]>('/access/passes', token),
  createPass: (token: string, validDays: number) =>
    request<Pass>('/access/passes', token, {
      method: 'POST',
      body: JSON.stringify({ validDays }),
    }),
  revokePass: (token: string, id: string) =>
    request<void>(`/access/passes/${id}/revoke`, token, { method: 'POST' }),
  passQr: (token: string, id: string) =>
    request<PassQrResponse>(`/access/passes/${id}/qr`, token),
  provisionPass: (token: string, id: string) =>
    request<Provisioning>(`/access/passes/${id}/provision`, token),
  tickets: async (token: string): Promise<ServerTicket[]> => {
    const res = await request<PaginatedTicketsResponse | ServerTicket[]>(
      '/tickets?page=1&pageSize=100',
      token,
    );
    return Array.isArray(res) ? res : (res.items ?? []);
  },
  ticketDetail: (token: string, id: string) => request<ServerTicket>(`/tickets/${id}`, token),
  createTicket: (token: string, form: FormData) =>
    request<{ id: string }>('/tickets', token, { method: 'POST', body: form }),
};
