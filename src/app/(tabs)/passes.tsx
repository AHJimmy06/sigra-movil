import QRCode from 'react-native-qrcode-svg';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  Empty,
  LargeTitle,
  Message,
  PlusIcon,
  Screen,
  SectionHeader,
  SegmentedControl,
  ShieldIcon,
  SyncIsland,
} from '@/components/ui';
import { api } from '@/lib/api';
import { getPasses, replacePasses } from '@/lib/db';
import { secure } from '@/lib/secure';
import { createAccessPayload } from '@/lib/totp';
import { useSession } from '@/store/session';
import { useSyncState } from '@/store/sync';
import type { Pass, Provisioning } from '@/types/models';

export default function PassesScreen() {
  const db = useSQLiteContext();
  const token = useSession((state) => state.token)!;
  const sync = useSyncState();
  const connected = sync.connected;

  const [passes, setPasses] = useState<Pass[]>([]);
  const [provisions, setProvisions] = useState<Record<string, Provisioning>>({});
  const [livePayloads, setLivePayloads] = useState<Record<string, string>>({});
  const [validDays, setValidDays] = useState<1 | 7 | 30>(7);
  const [now, setNow] = useState<number>(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const values = await getPasses(db);
    setPasses(values);

    const provisionPairs = await Promise.all(
      values.map(async (pass) => [pass.id, await secure.loadPass(pass.id)] as const),
    );
    setProvisions(
      Object.fromEntries(
        provisionPairs.filter(
          (pair): pair is [string, Provisioning] => Boolean(pair[1]),
        ),
      ),
    );

    const cachedQrPairs = await Promise.all(
      values.map(
        async (pass) =>
          [pass.id, await secure.getCachedQrPayload(pass.id)] as const,
      ),
    );
    const cachedMap = Object.fromEntries(
      cachedQrPairs.filter((pair): pair is [string, string] => Boolean(pair[1])),
    );
    setLivePayloads((prev) => ({ ...cachedMap, ...prev }));
  }, [db]);

  const refreshLiveQrs = useCallback(
    async (currentPasses: Pass[]) => {
      if (!connected || !token) return;
      const nowMs = Date.now();
      const activeList = currentPasses.filter(
        (pass) => !pass.revokedAt && new Date(pass.validUntil).getTime() > nowMs,
      );
      await Promise.all(
        activeList.map(async (pass) => {
          try {
            const qr = await api.passQr(token, pass.id);
            if (qr?.payload) {
              await secure.saveCachedQrPayload(pass.id, qr.payload);
              setLivePayloads((prev) => ({ ...prev, [pass.id]: qr.payload }));
            }
          } catch {}
        }),
      );
    },
    [connected, token],
  );

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const values = await getPasses(db);
        await load();
        await refreshLiveQrs(values);
      })();
    }, [db, load, refreshLiveQrs]),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (connected && Math.floor(current / 1000) % 15 === 0 && passes.length > 0) {
        void refreshLiveQrs(passes);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [connected, passes, refreshLiveQrs]);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
      const updated = await getPasses(db);
      await load();
      await refreshLiveQrs(updated);
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : 'No se pudo completar la operación del pase QR.',
      );
    } finally {
      setBusy(false);
    }
  };

  const refresh = () =>
    run(async () => {
      const values = await api.passes(token);
      await replacePasses(db, values);
    });

  const create = () =>
    run(async () => {
      const pass = await api.createPass(token, validDays);
      await replacePasses(db, [pass]);
      try {
        const qr = await api.passQr(token, pass.id);
        if (qr?.payload) {
          await secure.saveCachedQrPayload(pass.id, qr.payload);
          setLivePayloads((prev) => ({ ...prev, [pass.id]: qr.payload }));
        }
      } catch {}
      try {
        const provision = await api.provisionPass(token, pass.id);
        await secure.savePass(provision);
      } catch {}
    });

  const provisionPassOffline = (id: string) =>
    run(async () => {
      try {
        const qr = await api.passQr(token, id);
        if (qr?.payload) {
          await secure.saveCachedQrPayload(id, qr.payload);
          setLivePayloads((prev) => ({ ...prev, [id]: qr.payload }));
        }
      } catch {}
      try {
        const provision = await api.provisionPass(token, id);
        await secure.savePass(provision);
      } catch {}
    });

  const confirmRevoke = (id: string) => {
    Alert.alert(
      'Revocar pase de acceso',
      '¿Está seguro de revocar este pase QR? El código quedará invalidado de inmediato en garita y se eliminará su semilla del dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar pase',
          style: 'destructive',
          onPress: () =>
            void run(async () => {
              await api.revokePass(token, id);
              await secure.deletePass(id);
              setLivePayloads((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
              });
              const values = await api.passes(token);
              await replacePasses(db, values);
            }),
        },
      ],
    );
  };

  return (
    <Screen refreshing={busy} onRefresh={connected ? refresh : undefined}>
      <SyncIsland
        connected={connected}
        syncing={sync.syncing || busy}
        lastSync={sync.lastSync}
        onPress={refresh}
      />

      <LargeTitle
        eyebrow="Control de Acceso Criptográfico"
        subtitle="Sus credenciales dinámicas siguen operando sin conexión después de ser provisionadas en el dispositivo."
      >
        Billetera de Pases QR
      </LargeTitle>

      {error ? <Message tone="error">{error}</Message> : null}

      <Card>
        <View className="flex-row items-center justify-between">
          <View className="gap-0.5">
            <Text className="text-base font-bold text-ink">
              Emitir nuevo pase residencial
            </Text>
            <Text className="text-xs text-slate-500">
              Seleccione la vigencia autorizada para validación en garita
            </Text>
          </View>
          <ShieldIcon size={20} color="#0F766E" />
        </View>

        <SegmentedControl
          value={validDays}
          onChange={setValidDays}
          options={[
            { label: '24 Horas', value: 1 },
            { label: '7 Días', value: 7 },
            { label: '30 Días', value: 30 },
          ]}
        />

        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <Button
              title={busy ? 'Procesando…' : 'Generar pase QR'}
              icon={<PlusIcon size={16} color="#FFFFFF" />}
              onPress={create}
              disabled={!connected || busy}
            />
          </View>
          <Button
            title="Sincronizar"
            tone="secondary"
            onPress={refresh}
            disabled={!connected || busy}
          />
        </View>
      </Card>

      <SectionHeader
        title="Tarjetas en Billetera"
        subtitle={
          connected
            ? 'Estado verificado en tiempo real con el servidor'
            : 'Modo Offline · Garita tiene la última palabra sobre revocaciones'
        }
      />

      {passes.length > 0 ? (
        passes.map((pass) => {
          const item = provisions[pass.id];
          const expired = new Date(pass.validUntil).getTime() <= now;
          const revoked = Boolean(pass.revokedAt);

          const period = item?.period ?? 30;
          const remainingSeconds =
            period - (Math.floor(now / 1000) % period);
          const progressPercent = Math.max(
            6,
            Math.min(100, Math.round((remainingSeconds / period) * 100)),
          );

          const qrValue =
            !revoked && !expired
              ? item
                ? createAccessPayload(
                    pass.id,
                    item.secret,
                    now,
                    item.period,
                    item.digits,
                  )
                : (livePayloads[pass.id] ?? null)
              : null;

          return (
            <View
              key={pass.id}
              className="overflow-hidden rounded-3xl border border-slate-800 bg-obsidian shadow-md"
            >
              {/* Top Wallet Pass Header */}
              <View className="p-5 pb-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <ShieldIcon size={18} color="#2DD4BF" />
                    <Text className="text-xs font-bold tracking-widest text-teal-400 uppercase">
                      SIGRA ACCESS · V1
                    </Text>
                  </View>
                  <Badge
                    label={
                      revoked ? 'REVOCADO' : expired ? 'EXPIRADO' : 'ACTIVO'
                    }
                    tone={revoked || expired ? 'danger' : 'success'}
                  />
                </View>

                <View className="mt-3 flex-row items-baseline justify-between">
                  <View>
                    <Text className="text-xs text-slate-400">
                      Identificador de credencial
                    </Text>
                    <Text
                      className="text-lg font-extrabold tracking-tight text-white"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      #{pass.id.slice(0, 8).toUpperCase()}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-slate-400">Válido hasta</Text>
                    <Text
                      className="text-xs font-semibold text-slate-200"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {new Date(pass.validUntil).toLocaleDateString('es-EC', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Perforated Ticket Divider with Side Notches */}
              <View className="relative flex-row items-center justify-between py-1">
                <View className="-ml-3 h-6 w-6 rounded-full bg-canvas" />
                <View className="mx-2 flex-1 border-b border-dashed border-slate-700" />
                <View className="-mr-3 h-6 w-6 rounded-full bg-canvas" />
              </View>

              {/* Bottom QR & Controls Area */}
              <View className="gap-4 p-5 pt-3">
                {qrValue ? (
                  <View className="items-center gap-3">
                    <View className="items-center justify-center rounded-3xl bg-white p-4 shadow-sm">
                      <QRCode size={208} value={qrValue} />
                    </View>

                    <View className="w-full gap-1.5">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-medium text-slate-400">
                          Token dinámico de seguridad
                        </Text>
                        <Text
                          className="text-xs font-bold text-teal-400"
                          style={{ fontVariant: ['tabular-nums'] }}
                        >
                          Renueva en {remainingSeconds}s
                        </Text>
                      </View>
                      <View className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <View
                          className="h-full rounded-full bg-teal-400"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
                    <Text className="text-center text-xs leading-5 text-slate-300">
                      {revoked
                        ? `Este pase fue revocado (confirmado el ${new Date(
                            pass.syncedAt,
                          ).toLocaleString('es-EC')}).`
                        : expired
                          ? 'El periodo de validez de este pase ha finalizado.'
                          : 'Pase pendiente de aprovisionamiento criptográfico para uso offline.'}
                    </Text>
                  </View>
                )}

                <Text className="text-center text-[11px] text-slate-400">
                  {connected
                    ? 'Sincronizado en línea con control de garita'
                    : `Caché local · Última verificación ${new Date(
                        pass.syncedAt,
                      ).toLocaleTimeString('es-EC', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`}
                </Text>

                {!revoked && !expired ? (
                  <View className="flex-row gap-2.5 pt-1">
                    {!qrValue ? (
                      <View className="flex-1">
                        <Button
                          title="Activar QR en dispositivo"
                          onPress={() => provisionPassOffline(pass.id)}
                          disabled={!connected || busy}
                        />
                      </View>
                    ) : null}
                    <View className="flex-1">
                      <Button
                        title="Revocar pase"
                        tone="danger"
                        onPress={() => confirmRevoke(pass.id)}
                        disabled={!connected || busy}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })
      ) : (
        <Empty title="Billetera sin pases activos">
          Aún no tiene pases QR almacenados en este dispositivo. Conéctese a la
          red y genere un pase para presentar en garita.
        </Empty>
      )}
    </Screen>
  );
}
