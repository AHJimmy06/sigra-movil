import { mapAnnouncement, mergeTicketCaches } from './db';

describe('SQLite mapping', () => {
  it('normalizes server dates without changing public content', () => {
    expect(mapAnnouncement({ id: 'a-1', title: 'Water service', body: 'Planned interruption', publishedAt: '2026-08-25T10:00:00-05:00' })).toEqual({
      id: 'a-1',
      title: 'Water service',
      body: 'Planned interruption',
      publishedAt: '2026-08-25T15:00:00.000Z',
    });
  });

  it('keeps local submission state while merging authoritative ticket status', () => {
    const local = {
      clientRequestId: 'request-1', description: 'Water leak', imageUri: 'file:///ticket.jpg', imageType: 'image/jpeg',
      state: 'failed' as const, serverId: null, serverStatus: null, error: 'Timed out', createdAt: '2026-08-25T00:00:00.000Z',
    };
    const server = {
      id: 'ticket-1', clientRequestId: 'request-1', residentId: 'resident-1', description: 'Water leak', imageName: 'ticket.jpg',
      status: 'IN_PROGRESS' as const, createdAt: '2026-08-25T00:00:00.000Z', updatedAt: '2026-08-25T01:00:00.000Z',
    };

    expect(mergeTicketCaches([local], [server])).toEqual([
      { ...local, serverId: 'ticket-1', serverStatus: 'IN_PROGRESS' },
    ]);
  });

  it('includes authoritative tickets absent from the local submission queue', () => {
    const server = {
      id: 'ticket-2', clientRequestId: 'request-2', residentId: 'resident-1', description: 'Broken light', imageName: 'light.jpg',
      status: 'OPEN' as const, createdAt: '2026-08-26T00:00:00.000Z', updatedAt: '2026-08-26T00:00:00.000Z',
    };

    expect(mergeTicketCaches([], [server])).toEqual([{
      clientRequestId: 'request-2', description: 'Broken light', imageUri: '', imageType: '', state: 'synced',
      serverId: 'ticket-2', serverStatus: 'OPEN', error: null, createdAt: '2026-08-26T00:00:00.000Z',
    }]);
  });
});
