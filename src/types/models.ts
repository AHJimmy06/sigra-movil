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
};

export type Pass = {
  id: string;
  residentId: string;
  validUntil: string;
  revokedAt: string | null;
  createdAt: string;
  syncedAt: string;
};

export type TicketState = 'pending' | 'syncing' | 'failed' | 'synced';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type ServerTicket = {
  id: string;
  clientRequestId: string;
  residentId: string;
  description: string;
  imageName: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
};
export type Ticket = {
  clientRequestId: string;
  description: string;
  imageUri: string;
  imageType: string;
  state: TicketState;
  serverId: string | null;
  serverStatus: TicketStatus | null;
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
