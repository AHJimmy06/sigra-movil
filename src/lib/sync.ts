import type { SQLiteDatabase } from 'expo-sqlite';
import { ApiError, api } from './api';
import { getTickets, replaceAnnouncements, replacePasses } from './db';
import { preferences } from './preferences';
import { shouldSyncTicket } from './queue';
import { logout } from './logout';
import { useSyncState } from '@/store/sync';

let activeSync: Promise<void> | null = null;

export function syncAll(db: SQLiteDatabase, token: string) {
  if (activeSync) return activeSync;
  activeSync = runSync(db, token).finally(() => {
    activeSync = null;
  });
  return activeSync;
}

async function runSync(db: SQLiteDatabase, token: string) {
  const state = useSyncState.getState();
  if (!state.connected) return;
  state.setSyncing(true);
  try {
    const [announcements, passes] = await Promise.all([api.announcements(token), api.passes(token)]);
    await replaceAnnouncements(db, announcements);
    await replacePasses(db, passes);
    const tickets = await getTickets(db);
    for (const ticket of tickets.filter((item) => shouldSyncTicket(item.state))) {
      await db.runAsync("UPDATE tickets SET state='syncing', error=NULL WHERE client_request_id=?", ticket.clientRequestId);
      try {
        const form = new FormData();
        form.append('clientRequestId', ticket.clientRequestId);
        form.append('description', ticket.description);
        form.append('image', {
          uri: ticket.imageUri,
          name: ticket.imageUri.split('/').pop() ?? `${ticket.clientRequestId}.jpg`,
          type: ticket.imageType,
        } as unknown as Blob);
        const response = await api.createTicket(token, form);
        await db.runAsync("UPDATE tickets SET state='synced', server_id=?, error=NULL WHERE client_request_id=?", response.id, ticket.clientRequestId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Ticket synchronization failed';
        await db.runAsync("UPDATE tickets SET state='failed', error=? WHERE client_request_id=?", message, ticket.clientRequestId);
      }
    }
    const now = new Date().toISOString();
    preferences.setLastSync(now);
    useSyncState.getState().complete(now);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await logout(db);
      return;
    }
    useSyncState.getState().fail(error instanceof Error ? error.message : 'Synchronization failed');
  }
}
