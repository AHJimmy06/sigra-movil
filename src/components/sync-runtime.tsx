import NetInfo from '@react-native-community/netinfo';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { preferences } from '@/lib/preferences';
import { syncAll } from '@/lib/sync';
import { useSession } from '@/store/session';
import { useSyncState } from '@/store/sync';
import { canSyncResident } from '@/lib/session-role';

export function SyncRuntime() {
  const db = useSQLiteContext();
  const token = useSession((state) => state.token);
  const status = useSession((state) => state.status);
  const user = useSession((state) => state.user);

  useEffect(() => {
    useSession.getState().restore();
    const lastSync = preferences.getLastSync();
    if (lastSync) useSyncState.setState({ lastSync });
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((net) => {
      const connected = Boolean(
        net.isConnected && net.isInternetReachable !== false,
      );
      useSyncState.getState().setConnected(connected);
      const current = useSession.getState();
      if (
        connected &&
        token &&
        current.token === token &&
        canSyncResident(current.user, token)
      )
        void syncAll(db, token);
    });
    const appState = AppState.addEventListener('change', (next) => {
      const current = useSession.getState();
      if (
        next === 'active' &&
        token &&
        current.token === token &&
        canSyncResident(current.user, token) &&
        useSyncState.getState().connected
      )
        void syncAll(db, token);
    });
    return () => {
      unsubscribe();
      appState.remove();
    };
  }, [db, token, user]);

  useEffect(() => {
    if (
      status === 'authenticated' &&
      token &&
      canSyncResident(user, token) &&
      useSyncState.getState().connected
    )
      void syncAll(db, token);
  }, [db, status, token, user]);
  return null;
}
