import type { Ticket, TicketState } from '@/types/models';

export function buildQueuedTicket(clientRequestId: string, description: string, imageUri: string, imageType: string, now = new Date()): Ticket {
  return { clientRequestId, description, imageUri, imageType, state: 'pending', serverId: null, error: null, createdAt: now.toISOString() };
}

export function shouldSyncTicket(state: TicketState) {
  return state === 'pending' || state === 'failed';
}
