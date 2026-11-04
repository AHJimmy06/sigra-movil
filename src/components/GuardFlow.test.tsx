/* eslint-disable @typescript-eslint/no-require-imports */
import { Alert, AppState } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import GuardScreen from '@/app/(guard)/scanner';
import { api } from '@/lib/api';
jest.mock('react-native-css-interop', () => ({
  createInteropElement: (...args: unknown[]) =>
    require('react').createElement(...args),
  cssInterop: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    require('react').useEffect(callback, [callback]);
  },
}));
jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => 'db' }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'event-1' }));
jest.mock('@/lib/logout', () => ({ logout: jest.fn() }));
jest.mock('@/store/session', () => ({
  useSession: (selector: (s: unknown) => unknown) =>
    selector({ token: 'guard-token', user: { sub: 'g', role: 'GUARD' } }),
}));
jest.mock('@/lib/api', () => ({
  api: { accessPreview: jest.fn(), accessValidate: jest.fn() },
  ApiError: class extends Error {
    status = 500;
  },
}));
jest.mock('expo-camera', () => ({
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
  CameraView: ({
    onBarcodeScanned,
  }: {
    onBarcodeScanned: (v: { data: string }) => void;
  }) => {
    const mockReact = require('react');
    const { Pressable, Text } = require('react-native');
    return mockReact.createElement(
      Pressable,
      {
        onPress: () =>
          onBarcodeScanned({
            data: JSON.stringify({ v: 1, passId: 'pass', token: '123456' }),
          }),
      },
      mockReact.createElement(Text, null, 'Mock scan'),
    );
  },
}));
jest.mock('@/components/ui', () => {
  const mockReact = require('react');
  const { View, Text, Pressable, TextInput } = require('react-native');
  return {
    Screen: View,
    Card: View,
    LargeTitle: Text,
    Message: Text,
    Button: ({
      title,
      onPress,
      disabled,
    }: {
      title: string;
      onPress: () => void;
      disabled: boolean;
    }) =>
      mockReact.createElement(
        Pressable,
        { onPress, disabled },
        mockReact.createElement(Text, null, title),
      ),
    Field: ({ label, ...props }: { label: string }) =>
      mockReact.createElement(TextInput, {
        ...props,
        accessibilityLabel: label,
      }),
  };
});
beforeEach(() => { jest.clearAllMocks(); });

test('a lost confirmation response freezes the pending request and warns before discarding', async () => {
  AppState.currentState = 'active';
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  (api.accessPreview as jest.Mock).mockResolvedValue({ residentId: 'r', residentName: 'Elena', unitCode: 'A1', validUntil: '2026-12-01' });
  (api.accessValidate as jest.Mock)
    .mockRejectedValueOnce(new TypeError('response lost'))
    .mockResolvedValueOnce({ decision: 'ALLOWED', direction: 'ENTRY', requestId: 'saved-event' });
  await render(<GuardScreen />);
  await fireEvent.press(screen.getByText('Escanear pase QR'));
  await fireEvent.press(screen.getByText('Mock scan'));
  await fireEvent.changeText(screen.getByLabelText('Nombre del visitante'), 'Ana');
  await act(async () => { await fireEvent.press(screen.getByText('Confirmar registro')); });
  const original = (api.accessValidate as jest.Mock).mock.calls[0][1];
  expect(screen.getByLabelText('Nombre del visitante').props.editable).toBe(false);
  await fireEvent.changeText(screen.getByLabelText('Nombre del visitante'), 'Ana corregida');
  await fireEvent.press(screen.getByText('Salida'));
  await fireEvent.press(screen.getByText('Cancelar y escanear otro'));
  expect(alert).toHaveBeenCalled();
  expect(screen.getByLabelText('Residente')).toBeTruthy();
  await act(async () => { await fireEvent.press(screen.getByText('Reintentar registro pendiente')); });
  expect((api.accessValidate as jest.Mock).mock.calls[1][1]).toEqual(original);
  expect((api.accessValidate as jest.Mock).mock.calls[1][1]).toMatchObject({ visitorName: 'Ana', direction: 'ENTRY' });
  expect(screen.getByText(/Ingreso registrado/)).toBeTruthy();
  alert.mockRestore();
});
test('scan previews only; explicit confirmation records ALLOWED contract result', async () => {
  AppState.currentState = 'active';
  (api.accessPreview as jest.Mock).mockResolvedValue({
    residentId: 'r',
    residentName: 'Elena',
    unitCode: 'A1',
    validUntil: '2026-12-01',
  });
  (api.accessValidate as jest.Mock).mockResolvedValue({
    decision: 'ALLOWED',
    direction: 'ENTRY',
    requestId: 'request-1',
    residentName: 'Elena',
    unitCode: 'A1',
  });
  await render(<GuardScreen />);
  await fireEvent.press(screen.getByText('Escanear pase QR'));
  await fireEvent.press(screen.getByText('Mock scan'));
  expect(api.accessPreview).toHaveBeenCalledTimes(1);
  expect(api.accessValidate).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Residente').props.editable).toBe(false);
  await fireEvent.changeText(
    screen.getByLabelText('Nombre del visitante'),
    ' Ana ',
  );
  await act(async () => {
    await fireEvent.press(screen.getByText('Confirmar registro'));
  });
  expect(api.accessValidate).toHaveBeenCalledWith(
    'guard-token',
    expect.objectContaining({
      clientEventId: 'event-1',
      visitorName: 'Ana',
      direction: 'ENTRY',
    }),
  );
  expect(screen.getByText(/Ingreso registrado/)).toBeTruthy();
  expect(screen.queryByText(/Acceso denegado/)).toBeNull();
});
