import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  Announcement,
  Pass,
  ResidentAnnouncementFeedItem,
  ServerTicket,
  Ticket,
  TicketPriority,
  TicketStatus,
} from '@/types/models';

type ServerTicketRow = {
  id: string;
  client_request_id: string;
  resident_id: string;
  description: string;
  image_name: string;
  status: TicketStatus;
  priority?: TicketPriority | null;
  created_at: string;
  updated_at: string;
};

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, published_at TEXT NOT NULL, author_name TEXT);
    CREATE TABLE IF NOT EXISTS passes (id TEXT PRIMARY KEY, resident_id TEXT NOT NULL, valid_until TEXT NOT NULL, revoked_at TEXT, created_at TEXT NOT NULL, synced_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS tickets (client_request_id TEXT PRIMARY KEY, description TEXT NOT NULL, image_uri TEXT NOT NULL, image_type TEXT NOT NULL, state TEXT NOT NULL, server_id TEXT, error TEXT, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS server_tickets (id TEXT PRIMARY KEY, client_request_id TEXT NOT NULL UNIQUE, resident_id TEXT NOT NULL, description TEXT NOT NULL, image_name TEXT NOT NULL, status TEXT NOT NULL, priority TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS directory (id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL, detail TEXT NOT NULL, phone TEXT);
  `);

  try {
    await db.execAsync('ALTER TABLE announcements ADD COLUMN author_name TEXT');
  } catch {}

  try {
    await db.execAsync('ALTER TABLE server_tickets ADD COLUMN priority TEXT');
  } catch {}

  await db.execAsync(`
    INSERT OR REPLACE INTO directory VALUES
      ('emergency', 'contact', 'Emergencias Nacionales (ECU 911)', 'Policía Nacional, Bomberos y asistencia médica inmediata las 24 horas.', '911'),
      ('guardhouse', 'contact', 'Garita de Seguridad Principal', 'Control de accesos peatonales, bitácora vehicular y validación de pases QR.', '+593990001122'),
      ('administration', 'contact', 'Administración del Condominio', 'Atención de lunes a viernes (08:30 a 17:30) para alícuotas, reservas y soporte.', '+593990003344'),
      ('maintenance-desk', 'contact', 'Guardia Técnica de Mantenimiento', 'Atención de emergencias hidráulicas, eléctricas o de ascensores en áreas comunes.', '+593990005566'),
      ('rule-noise', 'rule', 'Horarios de Silencio y Convivencia', 'Se requiere moderar el volumen de música, televisores y reuniones entre las 22:00 y las 07:00 de domingo a jueves, y desde las 24:00 los viernes y sábados.', NULL),
      ('rule-access', 'rule', 'Uso de Pases QR y Visitas', 'Todo visitante o proveedor debe registrarse en garita presentando un pase QR activo. Las credenciales de residente son personales e intransferibles.', NULL),
      ('rule-common', 'rule', 'Áreas Comunes y Parqueaderos', 'Respete los estacionamientos asignados y mantenga despejadas las rutas de evacuación. Los daños en áreas comunales serán reportados mediante incidencias.', NULL),
      ('rule-pets', 'rule', 'Tenencia Responsable de Mascotas', 'Las mascotas deben circular con correa en todas las áreas comunes y sus propietarios son responsables de la limpieza inmediata.', NULL);
  `);
}

export function mapAnnouncement(value: Announcement): Announcement {
  const mapped: Announcement = {
    id: value.id,
    title: value.title,
    body: value.body,
    publishedAt: new Date(value.publishedAt).toISOString(),
  };
  if (value.authorName !== undefined) {
    mapped.authorName = value.authorName;
  }
  return mapped;
}

export async function replaceAnnouncements(db: SQLiteDatabase, values: Announcement[]) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM announcements');
    for (const raw of values) {
      const value = mapAnnouncement(raw);
      await db.runAsync(
        'INSERT INTO announcements (id, title, body, published_at, author_name) VALUES (?, ?, ?, ?, ?)',
        value.id,
        value.title,
        value.body,
        value.publishedAt,
        value.authorName ?? null,
      );
    }
  });
}

export async function applyAnnouncementFeed(
  db: SQLiteDatabase,
  items: ResidentAnnouncementFeedItem[],
) {
  if (items.length === 0) return;
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      if (item.kind === 'TOMBSTONE') {
        await db.runAsync('DELETE FROM announcements WHERE id = ?', item.announcementId);
      } else {
        const publishedAt = new Date(item.publishedAt).toISOString();
        const authorName = item.author?.name ?? null;
        await db.runAsync(
          `INSERT INTO announcements (id, title, body, published_at, author_name)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             title = excluded.title,
             body = excluded.body,
             published_at = excluded.published_at,
             author_name = excluded.author_name`,
          item.announcementId,
          item.title,
          item.body,
          publishedAt,
          authorName,
        );
      }
    }
  });
}

export async function getAnnouncements(db: SQLiteDatabase): Promise<Announcement[]> {
  const rows = await db.getAllAsync<{
    id: string;
    title: string;
    body: string;
    published_at: string;
    author_name?: string | null;
  }>('SELECT * FROM announcements ORDER BY published_at DESC');
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    publishedAt: row.published_at,
    ...(row.author_name ? { authorName: row.author_name } : {}),
  }));
}

export async function replacePasses(
  db: SQLiteDatabase,
  values: Pass[],
  syncedAt = new Date().toISOString(),
) {
  for (const value of values) {
    await db.runAsync(
      `INSERT INTO passes VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET resident_id=excluded.resident_id, valid_until=excluded.valid_until, revoked_at=excluded.revoked_at, created_at=excluded.created_at, synced_at=excluded.synced_at`,
      value.id,
      value.residentId,
      new Date(value.validUntil).toISOString(),
      value.revokedAt ? new Date(value.revokedAt).toISOString() : null,
      new Date(value.createdAt).toISOString(),
      syncedAt,
    );
  }
}

export async function getPasses(db: SQLiteDatabase): Promise<Pass[]> {
  const rows = await db.getAllAsync<{
    id: string;
    resident_id: string;
    valid_until: string;
    revoked_at: string | null;
    created_at: string;
    synced_at: string;
  }>('SELECT * FROM passes ORDER BY created_at DESC');
  return rows.map((row) => ({
    id: row.id,
    residentId: row.resident_id,
    validUntil: row.valid_until,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    syncedAt: row.synced_at,
  }));
}

export async function insertTicket(db: SQLiteDatabase, ticket: Ticket) {
  await db.runAsync(
    'INSERT INTO tickets VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ticket.clientRequestId,
    ticket.description,
    ticket.imageUri,
    ticket.imageType,
    ticket.state,
    ticket.serverId,
    ticket.error,
    ticket.createdAt,
  );
}

async function getLocalTickets(db: SQLiteDatabase): Promise<Ticket[]> {
  const rows = await db.getAllAsync<{
    client_request_id: string;
    description: string;
    image_uri: string;
    image_type: string;
    state: Ticket['state'];
    server_id: string | null;
    error: string | null;
    created_at: string;
  }>('SELECT * FROM tickets ORDER BY created_at DESC');
  return rows.map((row) => ({
    clientRequestId: row.client_request_id,
    description: row.description,
    imageUri: row.image_uri,
    imageType: row.image_type,
    state: row.state,
    serverId: row.server_id,
    serverStatus: null,
    error: row.error,
    createdAt: row.created_at,
  }));
}

export async function getTickets(db: SQLiteDatabase): Promise<Ticket[]> {
  const local = await getLocalTickets(db);
  const server = await db.getAllAsync<ServerTicketRow>(
    'SELECT * FROM server_tickets ORDER BY created_at DESC',
  );
  return mergeTicketCaches(
    local,
    server.map((row) => ({
      id: row.id,
      clientRequestId: row.client_request_id,
      residentId: row.resident_id,
      description: row.description,
      imageName: row.image_name,
      status: row.status,
      ...(row.priority ? { priority: row.priority } : {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  );
}

export function mergeTicketCaches(local: Ticket[], server: ServerTicket[]): Ticket[] {
  const remoteByRequest = new Map(server.map((ticket) => [ticket.clientRequestId, ticket]));
  const merged = local.map((ticket) => {
    const remote = remoteByRequest.get(ticket.clientRequestId);
    if (!remote) return ticket;
    remoteByRequest.delete(ticket.clientRequestId);
    return {
      ...ticket,
      serverId: remote.id,
      serverStatus: remote.status,
      ...(remote.priority ? { priority: remote.priority } : {}),
    };
  });
  for (const remote of remoteByRequest.values()) {
    merged.push({
      clientRequestId: remote.clientRequestId,
      description: remote.description,
      imageUri: '',
      imageType: '',
      state: 'synced',
      serverId: remote.id,
      serverStatus: remote.status,
      ...(remote.priority ? { priority: remote.priority } : {}),
      error: null,
      createdAt: remote.createdAt,
    });
  }
  return merged.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function replaceServerTickets(db: SQLiteDatabase, values: ServerTicket[]) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM server_tickets');
    for (const value of values) {
      await db.runAsync(
        'INSERT INTO server_tickets (id, client_request_id, resident_id, description, image_name, status, priority, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        value.id,
        value.clientRequestId,
        value.residentId ?? '',
        value.description,
        value.imageName ?? '',
        value.status,
        value.priority ?? null,
        value.createdAt,
        value.updatedAt ?? value.createdAt,
      );
    }
  });
}

export async function clearResidentData(db: SQLiteDatabase) {
  const passes = await getPasses(db);
  const tickets = await getLocalTickets(db);
  await db.execAsync('DELETE FROM passes; DELETE FROM tickets; DELETE FROM server_tickets;');
  return { passes, tickets };
}
