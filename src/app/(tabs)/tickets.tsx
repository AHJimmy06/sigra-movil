import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import {
  Badge,
  type BadgeTone,
  Button,
  CameraIcon,
  Card,
  Empty,
  Field,
  ImageIcon,
  LargeTitle,
  Message,
  Screen,
  SectionHeader,
  SegmentedControl,
  SyncIsland,
  TrashIcon,
} from '@/components/ui';
import { api } from '@/lib/api';
import { getTickets, insertTicket } from '@/lib/db';
import { copyTicketPhoto } from '@/lib/photos';
import { buildQueuedTicket } from '@/lib/queue';
import { syncAll } from '@/lib/sync';
import { useSession } from '@/store/session';
import { useSyncState } from '@/store/sync';
import type {
  ServerTicket,
  Ticket,
  TicketPriority,
  TicketState,
  TicketStatus,
} from '@/types/models';

type TicketFilter = 'ALL' | 'QUEUED' | 'OPEN' | 'RESOLVED';

const STATE_META: Record<TicketState, { label: string; tone: BadgeTone }> = {
  pending: { label: 'En cola offline', tone: 'warning' },
  syncing: { label: 'Sincronizando…', tone: 'brand' },
  failed: { label: 'Error de envío', tone: 'danger' },
  synced: { label: 'Sincronizado', tone: 'success' },
};

const STATUS_META: Record<TicketStatus, { label: string; tone: BadgeTone }> = {
  OPEN: { label: 'Abierto', tone: 'brand' },
  IN_PROGRESS: { label: 'En proceso', tone: 'warning' },
  RESOLVED: { label: 'Resuelto', tone: 'success' },
};

const PRIORITY_META: Record<TicketPriority, { label: string; tone: BadgeTone }> = {
  LOW: { label: 'Prioridad Baja', tone: 'neutral' },
  MEDIUM: { label: 'Prioridad Media', tone: 'brand' },
  HIGH: { label: 'Prioridad Alta', tone: 'warning' },
  URGENT: { label: 'Urgente', tone: 'danger' },
};

const ACTOR_LABELS: Record<string, string> = {
  ADMIN: 'Administración',
  RESIDENT: 'Residente',
  GUARD: 'Guardia',
};

export default function TicketsScreen() {
  const db = useSQLiteContext();
  const token = useSession((state) => state.token)!;
  const sync = useSyncState();
  const connected = sync.connected;

  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<TicketFilter>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailsById, setDetailsById] = useState<Record<string, ServerTicket>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => getTickets(db).then(setTickets), [db]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        if (connected) await syncAll(db, token);
        await load();
      })();
    }, [connected, db, load, token]),
  );

  const pickFromLibrary = async () => {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const captureFromCamera = async () => {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Se requiere permiso de cámara para tomar fotografías de la incidencia.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const queue = async () => {
    if (description.trim().length < 5 || !photo) return;
    setBusy(true);
    setError(null);
    try {
      const id = Crypto.randomUUID();
      const uri = await copyTicketPhoto(photo.uri, id);
      await insertTicket(
        db,
        buildQueuedTicket(
          id,
          description.trim(),
          uri,
          photo.mimeType ?? 'image/jpeg',
        ),
      );
      setDescription('');
      setPhoto(null);
      await load();
      if (connected) {
        await syncAll(db, token);
        await load();
      }
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : 'No fue posible guardar la incidencia en la cola local.',
      );
    } finally {
      setBusy(false);
    }
  };

  const retry = async (id: string) => {
    await db.runAsync(
      "UPDATE tickets SET state='pending', error=NULL WHERE client_request_id=?",
      id,
    );
    await syncAll(db, token);
    await load();
  };

  const toggleDetail = async (ticket: Ticket) => {
    const next =
      expandedId === ticket.clientRequestId ? null : ticket.clientRequestId;
    setExpandedId(next);
    if (
      next &&
      ticket.serverId &&
      connected &&
      !detailsById[ticket.serverId]
    ) {
      try {
        const detail = await api.ticketDetail(token, ticket.serverId);
        setDetailsById((prev) => ({ ...prev, [ticket.serverId!]: detail }));
      } catch {}
    }
  };

  const counts = useMemo(() => {
    const queued = tickets.filter(
      (t) => t.state === 'pending' || t.state === 'failed' || t.state === 'syncing',
    ).length;
    const open = tickets.filter(
      (t) => t.serverStatus === 'OPEN' || t.serverStatus === 'IN_PROGRESS',
    ).length;
    const resolved = tickets.filter((t) => t.serverStatus === 'RESOLVED').length;
    return { all: tickets.length, queued, open, resolved };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (filter === 'QUEUED') return ticket.state !== 'synced';
      if (filter === 'OPEN') {
        return (
          ticket.serverStatus === 'OPEN' || ticket.serverStatus === 'IN_PROGRESS'
        );
      }
      if (filter === 'RESOLVED') return ticket.serverStatus === 'RESOLVED';
      return true;
    });
  }, [filter, tickets]);

  const refresh = async () => {
    await syncAll(db, token);
    await load();
  };

  return (
    <Screen refreshing={sync.syncing} onRefresh={refresh}>
      <SyncIsland
        connected={connected}
        syncing={sync.syncing}
        lastSync={sync.lastSync}
        onPress={refresh}
      />

      <LargeTitle
        eyebrow="Mantenimiento y Áreas Comunes"
        subtitle="Sus reportes se almacenan con clave de idempotencia única y se envían automáticamente al recuperar conexión."
      >
        Incidencias
      </LargeTitle>

      {error ? <Message tone="error">{error}</Message> : null}

      <Card>
        <Text className="text-base font-bold text-ink">
          Nuevo reporte de mantenimiento
        </Text>

        <Field
          label="Descripción del problema"
          helperText="Mínimo 5 caracteres. Indique ubicación exacta (p. ej. Torre B, piso 3, luminaria)."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          placeholder="Describa el daño o requerimiento técnico…"
        />

        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <Button
              title="Tomar foto"
              tone="secondary"
              icon={<CameraIcon size={16} color="#0F172A" />}
              onPress={captureFromCamera}
            />
          </View>
          <View className="flex-1">
            <Button
              title="Galería"
              tone="secondary"
              icon={<ImageIcon size={16} color="#0F172A" />}
              onPress={pickFromLibrary}
            />
          </View>
        </View>

        {photo ? (
          <View className="gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
            <Image
              source={{ uri: photo.uri }}
              className="h-44 w-full rounded-xl"
              resizeMode="cover"
              accessibilityLabel="Evidencia fotográfica seleccionada"
            />
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-xs font-medium text-slate-600">
                Evidencia fotográfica adjunta
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quitar fotografía seleccionada"
                onPress={() => setPhoto(null)}
                className="flex-row items-center gap-1 rounded-lg px-2 py-1 active:opacity-70"
              >
                <TrashIcon size={14} color="#EF4444" />
                <Text className="text-xs font-semibold text-rose-600">
                  Quitar
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Button
          title={
            busy
              ? 'Guardando reporte…'
              : connected
                ? 'Enviar incidencia ahora'
                : 'Guardar en cola offline'
          }
          onPress={queue}
          disabled={busy || !photo || description.trim().length < 5}
        />
      </Card>

      <SectionHeader
        title="Historial y Cola de Envío"
        subtitle="Toque una tarjeta para inspeccionar su trazabilidad"
      />

      <SegmentedControl
        value={filter}
        onChange={setFilter}
        options={[
          { label: 'Todos', value: 'ALL', count: counts.all },
          { label: 'En Cola', value: 'QUEUED', count: counts.queued },
          { label: 'Abiertos', value: 'OPEN', count: counts.open },
          { label: 'Resueltos', value: 'RESOLVED', count: counts.resolved },
        ]}
      />

      <View className="gap-3">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => {
            const stateBadge = STATE_META[ticket.state];
            const statusBadge = ticket.serverStatus
              ? STATUS_META[ticket.serverStatus]
              : null;
            const priorityBadge = ticket.priority
              ? PRIORITY_META[ticket.priority]
              : null;
            const isExpanded = expandedId === ticket.clientRequestId;
            const detail = ticket.serverId
              ? detailsById[ticket.serverId]
              : undefined;

            return (
              <Pressable
                key={ticket.clientRequestId}
                accessibilityRole="button"
                onPress={() => void toggleDetail(ticket)}
              >
                <Card>
                  <View className="flex-row flex-wrap items-center justify-between gap-2">
                    <View className="flex-row flex-wrap items-center gap-1.5">
                      <Badge label={stateBadge.label} tone={stateBadge.tone} />
                      {statusBadge ? (
                        <Badge
                          label={statusBadge.label}
                          tone={statusBadge.tone}
                        />
                      ) : null}
                      {priorityBadge ? (
                        <Badge
                          label={priorityBadge.label}
                          tone={priorityBadge.tone}
                        />
                      ) : null}
                    </View>
                    <Text
                      className="text-xs text-slate-400"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {new Date(ticket.createdAt).toLocaleDateString('es-EC', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </Text>
                  </View>

                  <Text className="text-base font-bold text-ink">
                    {ticket.description}
                  </Text>

                  {ticket.imageUri ? (
                    <Image
                      source={{ uri: ticket.imageUri }}
                      className="h-32 w-full rounded-2xl"
                      resizeMode="cover"
                      accessibilityLabel="Fotografía de incidencia en dispositivo"
                    />
                  ) : null}

                  <View className="flex-row items-center justify-between pt-1">
                    <Text
                      className="text-[11px] font-medium text-slate-500"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      ID Idempotencia: {ticket.clientRequestId.slice(0, 8)}
                    </Text>
                    <Text className="text-xs font-semibold text-brand">
                      {isExpanded ? 'Ocultar detalle' : 'Ver trazabilidad'}
                    </Text>
                  </View>

                  {isExpanded ? (
                    <View className="mt-1 gap-2 rounded-2xl bg-slate-50 p-3">
                      <Text className="text-xs font-bold text-ink">
                        Ficha Técnica de Sincronización
                      </Text>
                      <Text className="text-xs text-slate-600">
                        Clave cliente: {ticket.clientRequestId}
                      </Text>
                      {ticket.serverId ? (
                        <Text className="text-xs text-slate-600">
                          Registro servidor: {ticket.serverId}
                        </Text>
                      ) : null}
                      {(detail?.history ?? detail?.auditTrail ?? []).length > 0 ? (
                        <View className="gap-1 pt-1">
                          <Text className="text-xs font-bold text-ink">
                            Historial de estados
                          </Text>
                          {(detail?.history ?? detail?.auditTrail ?? []).map((entry, idx) => {
                            const rawStatus = entry.to ?? entry.nextStatus ?? entry.status;
                            const statusLabel =
                              rawStatus && rawStatus in STATUS_META
                                ? STATUS_META[rawStatus as TicketStatus].label
                                : rawStatus;
                            const actorLabel = entry.actorName
                              ? (ACTOR_LABELS[entry.actorName] ?? entry.actorName)
                              : null;
                            return (
                              <Text
                                key={entry.id ?? String(idx)}
                                className="text-xs text-slate-600"
                              >
                                • {statusLabel}
                                {actorLabel ? ` (${actorLabel})` : ''} —{' '}
                                {new Date(entry.createdAt).toLocaleString('es-EC')}
                              </Text>
                            );
                          })}
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  {ticket.error ? (
                    <Message tone="error">{ticket.error}</Message>
                  ) : null}

                  {ticket.state === 'failed' ? (
                    <Button
                      title="Reintentar envío ahora"
                      onPress={() => void retry(ticket.clientRequestId)}
                      disabled={!connected}
                    />
                  ) : null}
                </Card>
              </Pressable>
            );
          })
        ) : (
          <Empty title="Sin incidencias en esta vista">
            No se encontraron reportes para el filtro seleccionado. Puede
            registrar una nueva solicitud adjuntando una fotografía.
          </Empty>
        )}
      </View>
    </Screen>
  );
}
