import NetInfo from '@react-native-community/netinfo';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { preferences } from '@/lib/preferences';
import { syncAll } from '@/lib/sync';
import { useSession } from '@/store/session';
import { useSyncState } from '@/store/sync';

export function SyncRuntime() {
  const db = useSQLiteContext();
  const token = useSession((state) => state.token);
  const status = useSession((state) => state.status);

  useEffect(() => {
    useSession.getState().restore();
    const lastSync = preferences.getLastSync();
    if (lastSync) useSyncState.setState({ lastSync });
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((net) => {
      const connected = Boolean(net.isConnected && net.isInternetReachable !== false);
      useSyncState.getState().setConnected(connected);
      if (connected && token) void syncAll(db, token);
    });
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active' && token && useSyncState.getState().connected) void syncAll(db, token);
    });
    return () => {
      unsubscribe();
      appState.remove();
    };
  }, [db, token]);

  useEffect(() => {
    if (status === 'authenticated' && token && useSyncState.getState().connected) void syncAll(db, token);
  }, [db, status, token]);
  return null;
}
