import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  LargeTitle,
  Message,
  Screen,
  SectionHeader,
  ShieldIcon,
  SyncIcon,
  SyncIsland,
} from '@/components/ui';
import { getAnnouncements, getPasses, getTickets } from '@/lib/db';
import { logout } from '@/lib/logout';
import { preferences } from '@/lib/preferences';
import { syncAll } from '@/lib/sync';
import { useSession } from '@/store/session';
import { useSyncState } from '@/store/sync';

export default function ProfileScreen() {
  const db = useSQLiteContext();
  const user = useSession((state) => state.user);
  const token = useSession((state) => state.token);
  const sync = useSyncState();

  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState({
    announcements: 0,
    passes: 0,
    tickets: 0,
  });

  const loadDiagnostics = useCallback(async () => {
    const [announcements, passes, tickets] = await Promise.all([
      getAnnouncements(db),
      getPasses(db),
      getTickets(db),
    ]);
    setCounts({
      announcements: announcements.length,
      passes: passes.length,
      tickets: tickets.length,
    });
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void loadDiagnostics();
    }, [loadDiagnostics]),
  );

  const triggerManualSync = async () => {
    if (!token) return;
    await syncAll(db, token);
    await loadDiagnostics();
  };

  const confirmSignOut = () => {
    Alert.alert(
      'Cerrar sesión en este dispositivo',
      'Se eliminarán su token JWT, las semillas TOTP de sus pases QR, sus incidencias en cola y las fotografías locales. ¿Desea continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy(true);
              await logout(db);
              router.replace('/login');
            })();
          },
        },
      ],
    );
  };

  const initials = (user?.email ?? 'RS').slice(0, 2).toUpperCase();
  const cursor = preferences.getAnnouncementCursor();

  return (
    <Screen refreshing={sync.syncing} onRefresh={triggerManualSync}>
      <SyncIsland
        connected={sync.connected}
        syncing={sync.syncing}
        lastSync={sync.lastSync}
        onPress={triggerManualSync}
      />

      <LargeTitle
        eyebrow="Identidad y Almacenamiento"
        subtitle="Gestión de su credencial residencial y diagnóstico de sincronización offline."
      >
        Perfil del Residente
      </LargeTitle>

      {/* Apple ID style Resident Header Card */}
      <Card>
        <View className="flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-obsidian">
            <Text className="text-xl font-extrabold text-teal-400">
              {initials}
            </Text>
          </View>
          <View className="flex-1 gap-1">
            <Badge label="RESIDENTE VERIFICADO" tone="brand" />
            <Text
              numberOfLines={1}
              className="text-lg font-extrabold tracking-tight text-ink"
            >
              {user?.email ?? 'residente@sigra.local'}
            </Text>
            <Text
              className="text-xs text-slate-500"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              ID Residente: {user?.residentId ?? '—'}
            </Text>
          </View>
        </View>
      </Card>

      <SectionHeader
        title="Diagnóstico Offline y Seguridad"
        subtitle="Estado de SQLite WAL, MMKV y SecureStore"
      />

      <Card>
        <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
          <Text className="text-sm font-medium text-slate-600">
            Comunicados en caché local
          </Text>
          <Text
            className="text-sm font-bold text-ink"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {counts.announcements}
          </Text>
        </View>

        <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
          <Text className="text-sm font-medium text-slate-600">
            Pases QR almacenados
          </Text>
          <Text
            className="text-sm font-bold text-ink"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {counts.passes}
          </Text>
        </View>

        <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
          <Text className="text-sm font-medium text-slate-600">
            Incidencias registradas
          </Text>
          <Text
            className="text-sm font-bold text-ink"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {counts.tickets}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-slate-600">
            Checkpoint de cartelera
          </Text>
          <Text
            className="text-xs font-semibold text-slate-500"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {cursor ? `${cursor.slice(0, 12)}…` : 'Inicial'}
          </Text>
        </View>

        <Button
          title={sync.syncing ? 'Sincronizando…' : 'Sincronizar datos ahora'}
          tone="secondary"
          icon={<SyncIcon size={16} color="#0F172A" />}
          disabled={!sync.connected || sync.syncing}
          onPress={triggerManualSync}
        />
      </Card>

      <Card variant="subtle">
        <View className="flex-row items-start gap-3">
          <ShieldIcon size={20} color="#0F766E" />
          <Text className="flex-1 text-xs leading-5 text-slate-600">
            Al cerrar sesión se purgan de forma segura el token JWT, todas las
            semillas TOTP de pases QR, el historial privado de pases e
            incidencias y las fotografías en cola. Los comunicados públicos y el
            directorio de emergencia permanecen disponibles.
          </Text>
        </View>
      </Card>

      {sync.error ? <Message tone="error">{sync.error}</Message> : null}

      <Button
        title={busy ? 'Cerrando sesión…' : 'Cerrar sesión'}
        tone="danger"
        disabled={busy}
        onPress={confirmSignOut}
      />
    </Screen>
  );
}
