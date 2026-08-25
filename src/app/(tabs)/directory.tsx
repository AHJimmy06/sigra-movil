import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Linking, Text } from 'react-native';
import { Button, Card, Message, Screen, Title } from '@/components/ui';

type Entry = { id: string; kind: 'contact' | 'rule'; title: string; detail: string; phone: string | null };
export default function DirectoryScreen() {
  const db = useSQLiteContext(); const [entries, setEntries] = useState<Entry[]>([]);
  useFocusEffect(useCallback(() => { void db.getAllAsync<Entry>('SELECT * FROM directory ORDER BY kind, title').then(setEntries); }, [db]));
  return <Screen><Title subtitle="Emergency contacts and basic building guidance">Directory</Title><Message>This MVP uses explicit local defaults. Building administration cannot manage this directory through the server yet; confirm local rules and numbers with administration.</Message>{entries.map((entry) => <Card key={entry.id}><Text className="text-lg font-semibold text-ink">{entry.title}</Text><Text className="text-slate-700">{entry.detail}</Text>{entry.phone ? <Button title={`Call ${entry.phone}`} onPress={() => void Linking.openURL(`tel:${entry.phone}`)} /> : null}</Card>)}</Screen>;
}
