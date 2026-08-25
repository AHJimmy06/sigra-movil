import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Image, Text } from 'react-native';
import { Button, Card, Empty, Field, Message, Screen, Title } from '@/components/ui';
import { getTickets, insertTicket } from '@/lib/db';
import { copyTicketPhoto } from '@/lib/photos';
import { buildQueuedTicket } from '@/lib/queue';
import { syncAll } from '@/lib/sync';
import { useSession } from '@/store/session';
import { useSyncState } from '@/store/sync';
import type { Ticket } from '@/types/models';

export default function TicketsScreen() {
  const db = useSQLiteContext(); const token = useSession((state) => state.token)!; const connected = useSyncState((state) => state.connected);
  const [description, setDescription] = useState(''); const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null); const [tickets, setTickets] = useState<Ticket[]>([]); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const load = useCallback(() => { void getTickets(db).then(setTickets); }, [db]); useFocusEffect(load);
  const pick = async () => { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 }); if (!result.canceled) setPhoto(result.assets[0]); };
  const queue = async () => { if (description.trim().length < 5 || !photo) return; setBusy(true); setError(null); try { const id = Crypto.randomUUID(); const uri = await copyTicketPhoto(photo.uri, id); await insertTicket(db, buildQueuedTicket(id, description.trim(), uri, photo.mimeType ?? 'image/jpeg')); setDescription(''); setPhoto(null); await load(); if (connected) { await syncAll(db, token); await load(); } } catch (value) { setError(value instanceof Error ? value.message : 'Could not queue ticket'); } finally { setBusy(false); } };
  const retry = async (id: string) => { await db.runAsync("UPDATE tickets SET state='pending', error=NULL WHERE client_request_id=?", id); await syncAll(db, token); await load(); };
  return <Screen><Title subtitle="Requests remain queued with the same idempotency key until accepted">Maintenance</Title>{error ? <Message tone="error">{error}</Message> : null}<Card><Field label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholder="Describe the maintenance issue" /><Button title={photo ? 'Change photo' : 'Choose photo'} tone="secondary" onPress={pick} />{photo ? <Image source={{ uri: photo.uri }} className="h-44 rounded-xl" resizeMode="cover" accessibilityLabel="Selected maintenance photo" /> : null}<Button title={busy ? 'Queueing…' : connected ? 'Submit request' : 'Queue offline'} onPress={queue} disabled={busy || !photo || description.trim().length < 5} /></Card><Text accessibilityRole="header" className="text-xl font-bold text-ink">Requests</Text>{tickets.length ? tickets.map((ticket) => <Card key={ticket.clientRequestId}><Text className="font-semibold text-ink">{ticket.description}</Text><Text className="text-sm text-slate-500">Request {ticket.clientRequestId}</Text><Text className="font-semibold capitalize text-brand">{ticket.state}</Text>{ticket.error ? <Message tone="error">{ticket.error}</Message> : null}{ticket.state === 'failed' ? <Button title="Retry" onPress={() => retry(ticket.clientRequestId)} disabled={!connected} /> : null}</Card>) : <Empty>No maintenance requests on this device.</Empty>}</Screen>;
}
