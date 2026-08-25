import QRCode from 'react-native-qrcode-svg';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Empty, Message, Screen, Title } from '@/components/ui';
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
  const connected = useSyncState((state) => state.connected);
  const [passes, setPasses] = useState<Pass[]>([]);
  const [provisions, setProvisions] = useState<Record<string, Provisioning>>({});
  const [now, setNow] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const values = await getPasses(db); setPasses(values);
    const pairs = await Promise.all(values.map(async (pass) => [pass.id, await secure.loadPass(pass.id)] as const));
    setProvisions(Object.fromEntries(pairs.filter((pair): pair is [string, Provisioning] => Boolean(pair[1]))));
  }, [db]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const run = async (work: () => Promise<void>) => { setBusy(true); setError(null); try { await work(); await load(); } catch (value) { setError(value instanceof Error ? value.message : 'Pass operation failed'); } finally { setBusy(false); } };
  const refresh = () => run(async () => { const values = await api.passes(token); await replacePasses(db, values); });
  const create = () => run(async () => { const pass = await api.createPass(token, 7); await replacePasses(db, [pass]); const provision = await api.provisionPass(token, pass.id); await secure.savePass(provision); });
  const provision = (id: string) => run(async () => { await secure.savePass(await api.provisionPass(token, id)); });
  const revoke = (id: string) => run(async () => { await api.revokePass(token, id); await secure.deletePass(id); const values = await api.passes(token); await replacePasses(db, values); });
  return <Screen><Title subtitle="Time-based QR codes continue working offline after secure provisioning">Pass wallet</Title><Message>{connected ? 'Online status can be refreshed now.' : 'Offline: revocation status is only known as of the last successful pass sync. Guard validation remains authoritative.'}</Message>{error ? <Message tone="error">{error}</Message> : null}<View className="flex-row gap-2"><View className="flex-1"><Button title="Create 7-day pass" onPress={create} disabled={!connected || busy} /></View><View className="flex-1"><Button title="Refresh" tone="secondary" onPress={refresh} disabled={!connected || busy} /></View></View>
    {passes.length ? passes.map((pass) => {
      const item = provisions[pass.id]; const expired = now !== null && new Date(pass.validUntil).getTime() <= now; const revoked = Boolean(pass.revokedAt); const usable = item && now !== null && !expired && !revoked;
      return <Card key={pass.id}><Text className="font-semibold text-ink">Pass {pass.id.slice(0, 8)}</Text><Text className="text-slate-600">Expires {new Date(pass.validUntil).toLocaleString()}</Text><Text className={revoked || expired ? 'font-semibold text-red-700' : 'font-semibold text-emerald-700'}>{revoked ? `Revoked (confirmed ${new Date(pass.syncedAt).toLocaleString()})` : expired ? 'Expired' : connected ? 'Active as of last sync' : `Cached active · revocation unknown after ${new Date(pass.syncedAt).toLocaleString()}`}</Text>{usable ? <View className="items-center gap-2 rounded-xl bg-white p-3"><QRCode size={220} value={createAccessPayload(pass.id, item.secret, now, item.period, item.digits)} /><Text className="text-sm text-slate-500">Refreshes in {item.period - (Math.floor(now / 1000) % item.period)} seconds</Text></View> : null}{!item && !revoked && !expired ? <Button title="Provision for offline use" onPress={() => provision(pass.id)} disabled={!connected || busy} /> : null}{!revoked && !expired ? <Button title="Revoke pass" tone="danger" onPress={() => revoke(pass.id)} disabled={!connected || busy} /> : null}</Card>;
    }) : <Empty>No passes cached. Connect to create one.</Empty>}
  </Screen>;
}
