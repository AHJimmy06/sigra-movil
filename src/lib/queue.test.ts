import { buildQueuedTicket, shouldSyncTicket } from './queue';

describe('maintenance queue', () => {
  it('preserves the caller-generated idempotency key across retries', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const ticket = buildQueuedTicket(id, 'Water leak near the window', 'file:///ticket.jpg', 'image/jpeg', new Date('2026-08-25T00:00:00Z'));
    expect(ticket.clientRequestId).toBe(id);
    expect({ ...ticket, state: 'failed' as const }.clientRequestId).toBe(id);
    expect(shouldSyncTicket('pending')).toBe(true);
    expect(shouldSyncTicket('failed')).toBe(true);
    expect(shouldSyncTicket('syncing')).toBe(false);
    expect(shouldSyncTicket('synced')).toBe(false);
  });
});
