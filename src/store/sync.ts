import { create } from 'zustand';

type SyncState = {
  connected: boolean;
  syncing: boolean;
  lastSync: string | null;
  error: string | null;
  setConnected(value: boolean): void;
  setSyncing(value: boolean): void;
  complete(value: string): void;
  fail(message: string): void;
};

export const useSyncState = create<SyncState>((set) => ({
  connected: false, syncing: false, lastSync: null, error: null,
  setConnected: (connected) => set({ connected }),
  setSyncing: (syncing) => set({ syncing }),
  complete: (lastSync) => set({ syncing: false, lastSync, error: null }),
  fail: (error) => set({ syncing: false, error }),
}));
