import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Empty, Message, Screen, Title } from '@/components/ui';
import { getAnnouncements } from '@/lib/db';
import { syncAll } from '@/lib/sync';
import { useSession } from '@/store/session';
import { useSyncState } from '@/store/sync';
import type { Announcement } from '@/types/models';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const token = useSession((state) => state.token)!;
  const sync = useSyncState();
  const [items, setItems] = useState<Announcement[]>([]);
  const load = useCallback(() => { void getAnnouncements(db).then(setItems); }, [db]);
  useFocusEffect(load);
  const refresh = async () => { await syncAll(db, token); load(); };
  return <Screen><Title subtitle="Published notices available even when offline">Home</Title><Message tone={sync.connected ? 'success' : 'info'}>{sync.connected ? (sync.syncing ? 'Online · Synchronizing' : 'Online') : 'Offline · Showing cached data'}{sync.lastSync ? ` · Last sync ${new Date(sync.lastSync).toLocaleString()}` : ''}</Message>{sync.error ? <Message tone="error">{sync.error}</Message> : null}<Button title="Refresh now" onPress={refresh} disabled={!sync.connected || sync.syncing} />
    <View className="gap-3"><Text accessibilityRole="header" className="text-xl font-bold text-ink">Announcements</Text>{items.length ? items.map((item) => <Card key={item.id}><Text className="text-lg font-semibold text-ink">{item.title}</Text><Text className="text-slate-700">{item.body}</Text><Text className="text-sm text-slate-500">Published {new Date(item.publishedAt).toLocaleString()}</Text></Card>) : <Empty>No cached announcements yet. Connect and refresh.</Empty>}</View>
  </Screen>;
}
