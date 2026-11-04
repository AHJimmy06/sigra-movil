import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  Empty,
  LargeTitle,
  Message,
  Screen,
  SectionHeader,
  SyncIcon,
  SyncIsland,
  TicketIcon,
  WalletIcon,
} from '@/components/ui';
import { getAnnouncements, getPasses, getTickets } from '@/lib/db';
import { syncAll } from '@/lib/sync';
import { useSession } from '@/store/session';
import { useSyncState } from '@/store/sync';
import type { Announcement } from '@/types/models';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const token = useSession((state) => state.token)!;
  const user = useSession((state) => state.user);
  const sync = useSyncState();

  const [items, setItems] = useState<Announcement[]>([]);
  const [activePassesCount, setActivePassesCount] = useState(0);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [queuedTicketsCount, setQueuedTicketsCount] = useState(0);

  const load = useCallback(async () => {
    const [announcements, passes, tickets] = await Promise.all([
      getAnnouncements(db),
      getPasses(db),
      getTickets(db),
    ]);
    setItems(announcements);
    const now = Date.now();
    setActivePassesCount(
      passes.filter(
        (pass) => !pass.revokedAt && new Date(pass.validUntil).getTime() > now,
      ).length,
    );
    setOpenTicketsCount(
      tickets.filter((ticket) => ticket.serverStatus !== 'RESOLVED').length,
    );
    setQueuedTicketsCount(
      tickets.filter(
        (ticket) => ticket.state === 'pending' || ticket.state === 'failed',
      ).length,
    );
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = async () => {
    await syncAll(db, token);
    await load();
  };

  return (
    <Screen refreshing={sync.syncing} onRefresh={refresh}>
      <SyncIsland
        connected={sync.connected}
        syncing={sync.syncing}
        lastSync={sync.lastSync}
        onPress={refresh}
      />

      <LargeTitle
        eyebrow={user?.email ?? 'Portal Residente'}
        subtitle="Resumen operativo de su unidad y comunicados oficiales sincronizados en su dispositivo."
      >
        Cartelera Digital
      </LargeTitle>

      {sync.error ? <Message tone="error">{sync.error}</Message> : null}

      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ir a Billetera de Pases QR"
          onPress={() => router.push('/(tabs)/passes')}
          className="flex-1 justify-between rounded-3xl border border-slate-800 bg-obsidian p-4"
          style={({ pressed }) => ({
            minHeight: 118,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View className="flex-row items-center justify-between">
            <View className="rounded-xl bg-slate-800 p-2">
              <WalletIcon size={18} color="#2DD4BF" />
            </View>
            <Badge label="Apple Wallet QR" tone="dark" />
          </View>
          <View className="pt-3">
            <Text
              className="text-2xl font-extrabold text-white"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {activePassesCount}
            </Text>
            <Text className="text-xs font-medium text-slate-400">
              {activePassesCount === 1 ? 'Pase QR activo' : 'Pases QR activos'}
            </Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ir a Incidencias y Mantenimiento"
          onPress={() => router.push('/(tabs)/tickets')}
          className="flex-1 justify-between rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm"
          style={({ pressed }) => ({
            minHeight: 118,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View className="flex-row items-center justify-between">
            <View className="rounded-xl bg-teal-50 p-2">
              <TicketIcon size={18} color="#0F766E" />
            </View>
            {queuedTicketsCount > 0 ? (
              <Badge label={`${queuedTicketsCount} en cola`} tone="warning" />
            ) : (
              <Badge label="Al día" tone="success" />
            )}
          </View>
          <View className="pt-3">
            <Text
              className="text-2xl font-extrabold text-ink"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {openTicketsCount}
            </Text>
            <Text className="text-xs font-medium text-slate-500">
              {openTicketsCount === 1
                ? 'Incidencia en curso'
                : 'Incidencias en curso'}
            </Text>
          </View>
        </Pressable>
      </View>

      <SectionHeader
        title="Comunicados Oficiales"
        subtitle={
          items.length > 0
            ? `${items.length} ${
                items.length === 1
                  ? 'aviso disponible offline'
                  : 'avisos disponibles offline'
              }`
            : 'Sincronización incremental con garita y administración'
        }
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sincronizar comunicados ahora"
            disabled={!sync.connected || sync.syncing}
            onPress={refresh}
            className="flex-row items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5"
            style={({ pressed }) => ({
              opacity:
                !sync.connected || sync.syncing ? 0.4 : pressed ? 0.75 : 1,
            })}
          >
            <SyncIcon size={14} color="#0F766E" />
            <Text className="text-xs font-semibold text-brand">Actualizar</Text>
          </Pressable>
        }
      />

      <View className="gap-3">
        {items.length > 0 ? (
          items.map((item) => (
            <Card key={item.id}>
              <View className="flex-row items-center justify-between gap-2">
                <Badge
                  label={item.authorName ?? 'Administración'}
                  tone="brand"
                />
                <Text
                  className="text-xs font-medium text-slate-500"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {new Date(item.publishedAt).toLocaleDateString('es-EC', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <Text className="text-lg font-bold tracking-tight text-ink">
                {item.title}
              </Text>
              <Text className="text-sm leading-6 text-slate-700">
                {item.body}
              </Text>
            </Card>
          ))
        ) : (
          <Empty
            title="Sin comunicados en caché"
            action={
              sync.connected ? (
                <Button
                  title="Sincronizar cartelera"
                  onPress={refresh}
                  disabled={sync.syncing}
                />
              ) : undefined
            }
          >
            Todavía no hay comunicados descargados en este dispositivo. Conéctese
            a internet y deslice hacia abajo para actualizar la cartelera.
          </Empty>
        )}
      </View>
    </Screen>
  );
}
