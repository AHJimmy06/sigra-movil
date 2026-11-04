/* eslint-disable @typescript-eslint/no-require-imports */
import { AppState } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { ResidentArrivals } from './ResidentArrivals';
import { api } from '@/lib/api';
import { useSession } from '@/store/session';
jest.mock('react-native-css-interop', () => ({
  createInteropElement: (...args: unknown[]) =>
    require('react').createElement(...args),
  cssInterop: jest.fn(),
  rem: { get: () => 14 },
}));
jest.mock('@/lib/api', () => ({ api: { arrivals: jest.fn() } }));
jest.mock('@/store/session', () => ({ useSession: jest.fn() }));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    const React = require('react');
    React.useEffect(callback, [callback]);
  },
}));
jest.mock('@/components/ui', () => {
  const { Text, View, Pressable } = require('react-native');
  return {
    Card: View,
    Message: Text,
    Button: ({ title, onPress }: { title: string; onPress: () => void }) => (
      <Pressable onPress={onPress}>
        <Text>{title}</Text>
      </Pressable>
    ),
  };
});
let session = { token: 'token', user: { role: 'RESIDENT', sub: 'r' } };
const item = {
  id: '1',
  visitorName: 'Ana',
  occurredAt: '2026-11-04T12:00:00Z',
  unitCode: 'A1',
};
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  AppState.currentState = 'active';
  session = { token: 'token', user: { role: 'RESIDENT', sub: 'r' } };
  (useSession as unknown as jest.Mock).mockImplementation((selector) =>
    selector(session),
  );
});
afterEach(() => jest.useRealTimers());
test('history is inbox only; new arrivals announce once across repeated polls', async () => {
  (api.arrivals as jest.Mock)
    .mockResolvedValueOnce({ items: [item] })
    .mockResolvedValue({
      items: [{ ...item, id: '2', visitorName: 'Luis' }, item],
    });
  await render(<ResidentArrivals />);
  await waitFor(() => expect(screen.getByText(/Ana/)).toBeTruthy());
  expect(screen.queryByText(/Nuevo ingreso/)).toBeNull();
  await act(async () => {
    jest.advanceTimersByTime(15000);
  });
  expect(screen.getByText(/Nuevo ingreso: Luis/)).toBeTruthy();
  await act(async () => {
    jest.advanceTimersByTime(15000);
  });
  expect(screen.getAllByText(/Nuevo ingreso/)).toHaveLength(1);
});
test('guards never call resident feed and stale session replies are discarded', async () => {
  let resolve!: (value: unknown) => void;
  (api.arrivals as jest.Mock).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const view = await render(<ResidentArrivals />);
  session = { token: 'guard', user: { role: 'GUARD', sub: 'g' } };
  await view.rerender(<ResidentArrivals />);
  await act(async () => {
    resolve({ items: [item] });
  });
  expect(screen.queryByText(/Ana/)).toBeNull();
  await act(async () => {
    jest.advanceTimersByTime(30000);
  });
  expect(api.arrivals).toHaveBeenCalledTimes(1);
});
