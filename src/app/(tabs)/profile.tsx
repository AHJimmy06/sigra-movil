import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Card, Message, Screen, Title } from '@/components/ui';
import { logout } from '@/lib/logout';
import { useSession } from '@/store/session';

export default function ProfileScreen() {
  const db = useSQLiteContext(); const user = useSession((state) => state.user); const [busy, setBusy] = useState(false);
  const signOut = async () => { setBusy(true); await logout(db); router.replace('/login'); };
  return <Screen><Title>Profile</Title><Card><Text className="text-lg font-semibold text-ink">{user?.email}</Text><Text className="text-slate-600">Resident account</Text></Card><Message>Logout removes the JWT, all provisioned TOTP seeds, resident pass and ticket data, queued photos, and sync metadata. Non-sensitive announcements and the local public directory remain cached for the next resident.</Message><Button title={busy ? 'Signing out…' : 'Sign out'} tone="danger" disabled={busy} onPress={signOut} /></Screen>;
}
