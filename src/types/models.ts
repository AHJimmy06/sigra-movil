export type ResidentUser = {
  sub: string;
  email: string;
  role: 'RESIDENT';
  residentId: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  authorName?: string | null;
};

export type ResidentAnnouncementFeedItem =
  | {
      kind: 'UPSERT';
      announcementId: string;
      title: string;
      body: string;
      publishedAt: string;
      author?: { name: string } | null;
      occurredAt: string;
    }
  | {
      kind: 'TOMBSTONE';
      announcementId: string;
      occurredAt: string;
    };

export type ResidentAnnouncementFeedResponse = {
  items: ResidentAnnouncementFeedItem[];
  checkpoint: string | null;
  hasMore: boolean;
  nextCursor: string | null;
  syncedAt: string;
};

export type Pass = {
  id: string;
  residentId: string;
  validUntil: string;
  revokedAt: string | null;
  createdAt: string;
  syncedAt: string;
};

export type PassQrResponse = {
  payload: string;
  expiresInSeconds: number;
  contract: 'sigra.access.v1';
};

export type TicketState = 'pending' | 'syncing' | 'failed' | 'synced';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TicketAuditEntry = {
  id?: string;
  from?: TicketStatus | null;
  to?: TicketStatus;
  actorName?: string | null;
  previousStatus?: TicketStatus | null;
  nextStatus?: TicketStatus;
  status?: TicketStatus;
  changedByEmail?: string | null;
  createdAt: string;
  note?: string | null;
};

export type ServerTicket = {
  id: string;
  clientRequestId: string;
  residentId: string;
  description: string;
  imageName: string;
  status: TicketStatus;
  priority?: TicketPriority | null;
  createdAt: string;
  updatedAt: string;
  history?: TicketAuditEntry[];
  auditTrail?: TicketAuditEntry[];
};

export type PaginatedTicketsResponse = {
  items: ServerTicket[];
  total: number;
  page: number;
  pageSize: number;
};

export type Ticket = {
  clientRequestId: string;
  description: string;
  imageUri: string;
  imageType: string;
  state: TicketState;
  serverId: string | null;
  serverStatus: TicketStatus | null;
  priority?: TicketPriority | null;
  error: string | null;
  createdAt: string;
};

export type Provisioning = {
  contract: 'sigra.access.v1';
  passId: string;
  secret: string;
  algorithm: 'SHA1';
  digits: 6;
  period: 30;
  validUntil: string;
};
