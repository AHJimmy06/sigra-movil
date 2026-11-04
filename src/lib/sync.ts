import type { SQLiteDatabase } from 'expo-sqlite';
import { ApiError, api } from './api';
import { applyAnnouncementFeed, getTickets, replacePasses, replaceServerTickets } from './db';
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

async function syncAnnouncementsIncremental(db: SQLiteDatabase, token: string) {
  let cursor = preferences.getAnnouncementCursor();
  let pages = 0;

  while (pages < 5) {
    pages += 1;
    const feed = await api.residentAnnouncements(token, cursor, 100);
    if (feed.items && feed.items.length > 0) {
      await applyAnnouncementFeed(db, feed.items);
    }
    const nextCheckpoint = feed.checkpoint ?? feed.nextCursor;
    if (nextCheckpoint) {
      preferences.setAnnouncementCursor(nextCheckpoint);
      cursor = nextCheckpoint;
    }
    if (!feed.hasMore || !feed.nextCursor) {
      break;
    }
  }
}

async function uploadQueuedTickets(db: SQLiteDatabase, token: string) {
  const tickets = await getTickets(db);
  for (const ticket of tickets.filter((item) => shouldSyncTicket(item.state))) {
    await db.runAsync(
      "UPDATE tickets SET state='syncing', error=NULL WHERE client_request_id=?",
      ticket.clientRequestId,
    );
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
      await db.runAsync(
        "UPDATE tickets SET state='synced', server_id=?, error=NULL WHERE client_request_id=?",
        response.id,
        ticket.clientRequestId,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : 'Error al sincronizar la incidencia';
      await db.runAsync(
        "UPDATE tickets SET state='failed', error=? WHERE client_request_id=?",
        message,
        ticket.clientRequestId,
      );
    }
  }
}

async function runSync(db: SQLiteDatabase, token: string) {
  const state = useSyncState.getState();
  if (!state.connected) return;
  state.setSyncing(true);

  const errors: string[] = [];

  try {
    try {
      await syncAnnouncementsIncremental(db, token);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) throw error;
      errors.push(error instanceof Error ? error.message : 'Error al sincronizar comunicados');
    }

    try {
      const passes = await api.passes(token);
      await replacePasses(db, passes);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) throw error;
      errors.push(error instanceof Error ? error.message : 'Error al sincronizar pases QR');
    }

    try {
      await uploadQueuedTickets(db, token);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) throw error;
      errors.push(error instanceof Error ? error.message : 'Error al enviar cola de incidencias');
    }

    try {
      const serverTickets = await api.tickets(token);
      await replaceServerTickets(db, serverTickets);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) throw error;
      errors.push(error instanceof Error ? error.message : 'Error al actualizar incidencias');
    }

    const now = new Date().toISOString();
    preferences.setLastSync(now);

    if (errors.length > 0) {
      useSyncState.getState().fail(errors[0]);
    } else {
      useSyncState.getState().complete(now);
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await logout(db);
      return;
    }
    useSyncState
      .getState()
      .fail(error instanceof Error ? error.message : 'Error de sincronización');
  }
}
