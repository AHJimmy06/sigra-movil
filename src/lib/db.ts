import type { SQLiteDatabase } from 'expo-sqlite';
import type { Announcement, Pass, Ticket } from '@/types/models';

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, published_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS passes (id TEXT PRIMARY KEY, resident_id TEXT NOT NULL, valid_until TEXT NOT NULL, revoked_at TEXT, created_at TEXT NOT NULL, synced_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS tickets (client_request_id TEXT PRIMARY KEY, description TEXT NOT NULL, image_uri TEXT NOT NULL, image_type TEXT NOT NULL, state TEXT NOT NULL, server_id TEXT, error TEXT, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS directory (id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL, detail TEXT NOT NULL, phone TEXT);
    INSERT OR IGNORE INTO directory VALUES
      ('emergency', 'contact', 'Emergency services', 'Police, fire, or medical emergency', '911'),
      ('administration', 'contact', 'Building administration', 'Confirm the current number with your building administration.', NULL),
      ('rule-noise', 'rule', 'Quiet hours', 'Keep noise low during building quiet hours. Confirm exact hours with administration.', NULL),
      ('rule-access', 'rule', 'Access passes', 'Do not share resident access credentials or QR codes.', NULL);
  `);
}

export function mapAnnouncement(value: Announcement): Announcement {
  return { id: value.id, title: value.title, body: value.body, publishedAt: new Date(value.publishedAt).toISOString() };
}

export async function replaceAnnouncements(db: SQLiteDatabase, values: Announcement[]) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM announcements');
    for (const raw of values) {
      const value = mapAnnouncement(raw);
      await db.runAsync('INSERT INTO announcements VALUES (?, ?, ?, ?)', value.id, value.title, value.body, value.publishedAt);
    }
  });
}

export async function getAnnouncements(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ id: string; title: string; body: string; published_at: string }>('SELECT * FROM announcements ORDER BY published_at DESC');
  return rows.map((row) => ({ id: row.id, title: row.title, body: row.body, publishedAt: row.published_at }));
}

export async function replacePasses(db: SQLiteDatabase, values: Pass[], syncedAt = new Date().toISOString()) {
  for (const value of values) await db.runAsync(
    `INSERT INTO passes VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET resident_id=excluded.resident_id, valid_until=excluded.valid_until, revoked_at=excluded.revoked_at, created_at=excluded.created_at, synced_at=excluded.synced_at`,
    value.id, value.residentId, new Date(value.validUntil).toISOString(), value.revokedAt ? new Date(value.revokedAt).toISOString() : null, new Date(value.createdAt).toISOString(), syncedAt,
  );
}

export async function getPasses(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ id: string; resident_id: string; valid_until: string; revoked_at: string | null; created_at: string; synced_at: string }>('SELECT * FROM passes ORDER BY created_at DESC');
  return rows.map((row) => ({ id: row.id, residentId: row.resident_id, validUntil: row.valid_until, revokedAt: row.revoked_at, createdAt: row.created_at, syncedAt: row.synced_at }));
}

export async function insertTicket(db: SQLiteDatabase, ticket: Ticket) {
  await db.runAsync('INSERT INTO tickets VALUES (?, ?, ?, ?, ?, ?, ?, ?)', ticket.clientRequestId, ticket.description, ticket.imageUri, ticket.imageType, ticket.state, ticket.serverId, ticket.error, ticket.createdAt);
}

export async function getTickets(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ client_request_id: string; description: string; image_uri: string; image_type: string; state: Ticket['state']; server_id: string | null; error: string | null; created_at: string }>('SELECT * FROM tickets ORDER BY created_at DESC');
  return rows.map((row) => ({ clientRequestId: row.client_request_id, description: row.description, imageUri: row.image_uri, imageType: row.image_type, state: row.state, serverId: row.server_id, error: row.error, createdAt: row.created_at }));
}

export async function clearResidentData(db: SQLiteDatabase) {
  const passes = await getPasses(db);
  const tickets = await getTickets(db);
  await db.execAsync('DELETE FROM passes; DELETE FROM tickets;');
  return { passes, tickets };
}
