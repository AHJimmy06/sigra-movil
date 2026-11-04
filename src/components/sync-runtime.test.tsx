/* eslint-disable @typescript-eslint/no-require-imports */
import { render, act } from '@testing-library/react-native';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { SyncRuntime } from './sync-runtime';
import { syncAll } from '@/lib/sync';
import { useSession } from '@/store/session';
jest.mock('react-native-css-interop', () => ({
  createInteropElement: (...args: unknown[]) =>
    require('react').createElement(...args),
}));
jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => 'db' }));
jest.mock('@/lib/preferences', () => ({
  preferences: { getLastSync: () => null },
}));
jest.mock('@/lib/sync', () => ({ syncAll: jest.fn() }));
jest.mock('@/store/sync', () => ({
  useSyncState: {
    getState: () => ({ connected: true, setConnected: jest.fn() }),
    setState: jest.fn(),
  },
}));
jest.mock('@/store/session', () => ({
  useSession: Object.assign(jest.fn(), { getState: jest.fn() }),
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn() },
}));
test('resident sync callbacks never run for a guard even if previous resident listeners fire', async () => {
  let current = {
    token: 'r',
    status: 'authenticated',
    user: { role: 'RESIDENT', sub: 'r', residentId: 'unit' },
    restore: jest.fn(),
  };
  (useSession as unknown as jest.Mock).mockImplementation((selector) =>
    selector(current),
  );
  (useSession.getState as jest.Mock).mockImplementation(() => current);
  let network!: (value: unknown) => void;
  (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
    network = callback;
    return jest.fn();
  });
  const stateSpy = jest.spyOn(AppState, 'addEventListener');
  const view = await render(<SyncRuntime />);
  expect(syncAll).toHaveBeenCalledTimes(1);
  const previousNetwork = network;
  const previousForeground = stateSpy.mock.calls[0][1];
  current = {
    ...current,
    token: 'g',
    user: { role: 'GUARD', sub: 'g', residentId: '' },
  };
  await view.rerender(<SyncRuntime />);
  await act(async () => {
    previousNetwork({ isConnected: true });
    network({ isConnected: true });
    previousForeground('active');
  });
  expect(syncAll).toHaveBeenCalledTimes(1);
  stateSpy.mockRestore();
});
