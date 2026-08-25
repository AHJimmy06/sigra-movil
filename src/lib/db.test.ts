import { mapAnnouncement } from './db';

describe('SQLite mapping', () => {
  it('normalizes server dates without changing public content', () => {
    expect(mapAnnouncement({ id: 'a-1', title: 'Water service', body: 'Planned interruption', publishedAt: '2026-08-25T10:00:00-05:00' })).toEqual({
      id: 'a-1',
      title: 'Water service',
      body: 'Planned interruption',
      publishedAt: '2026-08-25T15:00:00.000Z',
    });
  });
});
