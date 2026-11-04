import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Crypto from 'expo-crypto';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Text, View } from 'react-native';
import {
  Button,
  Card,
  Field,
  LargeTitle,
  Message,
  Screen,
} from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import {
  createGuardAttempt,
  parseGuardQr,
  type Direction,
  type GuardValidation,
} from '@/lib/guard-attempt';
import { logout } from '@/lib/logout';
import { useSession } from '@/store/session';
import type { AccessPreview, AccessResult } from '@/types/models';

export default function GuardScreen() {
  const token = useSession((s) => s.token);
  const user = useSession((s) => s.user);
  if (!token || user?.role !== 'GUARD') return null;
  return <GuardDesk key={user.sub + ':' + token} token={token} />;
}
function GuardDesk({ token }: { token: string }) {
  const db = useSQLiteContext();
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  const [permission, requestPermission] = useCameraPermissions();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [preview, setPreview] = useState<AccessPreview | null>(null);
  const [qr, setQr] = useState('');
  const [name, setName] = useState('');
  const [direction, setDirection] = useState<Direction>('ENTRY');
  const [result, setResult] = useState<AccessResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const pending = useRef<GuardValidation | null>(null);
  const locked = useRef(false);
  const generation = useRef(0);
  const attempt = useRef(createGuardAttempt(Crypto.randomUUID));
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) =>
      setActive(state === 'active'),
    );
    return () => sub.remove();
  }, []);
  useEffect(
    () => () => {
      generation.current += 1;
    },
    [],
  );
  const showError = (cause: unknown) =>
    setError(
      cause instanceof ApiError && cause.status === 403
        ? 'Su cuenta no está autorizada para la garita. Contacte al administrador.'
        : cause instanceof ApiError && cause.status === 401
          ? 'La sesión venció. Cierre sesión e ingrese nuevamente.'
          : cause instanceof Error && !(cause instanceof TypeError)
            ? cause.message
            : 'No se pudo conectar. Verifique su conexión y reintente; no se autoriza acceso sin conexión.',
    );
  const scan = async (raw: string) => {
    if (locked.current || pending.current) return;
    locked.current = true;
    setBusy(true);
    setScanning(false);
    setError('');
    const current = generation.current;
    try {
      const payload = parseGuardQr(raw);
      const value = await api.accessPreview(token, payload);
      if (current !== generation.current) return;
      setQr(payload);
      setPreview(value);
      setResult(null);
      setName('');
    } catch (cause) {
      if (current === generation.current) showError(cause);
    } finally {
      if (current === generation.current) {
        locked.current = false;
        setBusy(false);
      }
    }
  };
  const confirm = async () => {
    if (locked.current || !preview) return;
    locked.current = true;
    setBusy(true);
    setError('');
    const current = generation.current;
    try {
      // A lost response is not proof that the server rejected the entry.
      const request = pending.current ?? attempt.current(qr, name, direction);
      pending.current = request;
      setUnconfirmed(true);
      const value = await api.accessValidate(token, request);
      if (current !== generation.current) return;
      setResult(value);
      setPreview(null);
      setQr('');
      setName('');
      pending.current = null;
      setUnconfirmed(false);
      attempt.current = createGuardAttempt(Crypto.randomUUID);
    } catch (cause) {
      if (current === generation.current) showError(cause);
    } finally {
      if (current === generation.current) {
        locked.current = false;
        setBusy(false);
      }
    }
  };
  const resetScan = () => {
    pending.current = null;
    setUnconfirmed(false);
    attempt.current = createGuardAttempt(Crypto.randomUUID);
    setPreview(null);
    setQr('');
    setName('');
    setResult(null);
    setError('');
    setCameraError(false);
    setScanning(true);
  };
  const start = () => {
    if (locked.current) return;
    if (pending.current) {
      Alert.alert(
        'Hay un registro pendiente',
        'La entrada puede haberse guardado aunque no haya recibido respuesta. Reintente el registro pendiente para recuperar su resultado. Descartarlo e iniciar otro puede duplicar el movimiento.',
        [
          { text: 'Conservar registro', style: 'cancel' },
          { text: 'Descartar y escanear', style: 'destructive', onPress: resetScan },
        ],
      );
      return;
    }
    resetScan();
  };
  const signOut = () =>
    Alert.alert(
      'Cerrar sesión',
      pending.current
        ? 'Hay un registro que puede haberse guardado. Reintente para recuperar su resultado antes de cerrar sesión y perder la referencia local.'
        : 'Se eliminarán los datos y credenciales locales de este dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => {
            generation.current += 1;
            setScanning(false);
            void logout(db).catch(() =>
              setError('No se pudo cerrar la sesión. Reintente.'),
            );
          },
        },
      ],
    );
  return (
    <Screen>
      <LargeTitle
        eyebrow="SIGRA · Garita"
        subtitle="Escanee, revise y confirme. Se requiere conexión para autorizar."
      >
        Control de acceso
      </LargeTitle>
      {error ? <Message tone="error">{error}</Message> : null}
      {unconfirmed && !busy ? (
        <Message tone="warning">El registro puede haberse guardado. Conservamos sus datos: reintente para recuperar el resultado sin crear otra entrada.</Message>
      ) : null}
      {result ? (
        <Message tone={result.decision === 'ALLOWED' ? 'success' : 'error'}>
          {result.decision === 'ALLOWED'
            ? result.direction === 'ENTRY'
              ? 'Ingreso registrado'
              : 'Salida registrada'
            : 'Acceso denegado'}{' '}
          · {result.residentName ?? ''} {result.unitCode ?? ''}
          {'\n'}Referencia: {result.requestId}
        </Message>
      ) : null}
      {!preview ? (
        <Card>
          {!permission?.granted ? (
            <>
              <Message>
                Permita el uso de la cámara para leer pases QR. No se graba
                audio.
              </Message>
              <Button
                title="Permitir cámara"
                onPress={() => {
                  void requestPermission().catch(showError);
                }}
              />
              {permission?.canAskAgain === false ? (
                <Button
                  title="Abrir ajustes"
                  tone="secondary"
                  onPress={() => {
                    void Linking.openSettings().catch(showError);
                  }}
                />
              ) : null}
            </>
          ) : null}
          {permission?.granted &&
          scanning &&
          focused &&
          active &&
          !cameraError ? (
            <View style={{ height: 280, borderRadius: 20, overflow: 'hidden' }}>
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={({ data }) => {
                  void scan(data);
                }}
                onMountError={() => {
                  setCameraError(true);
                  setError('No se pudo abrir la cámara. Reintente.');
                }}
              />
            </View>
          ) : null}
          <Button
            title={
              busy
                ? 'Verificando…'
                : cameraError
                  ? 'Reintentar cámara'
                  : 'Escanear pase QR'
            }
            disabled={busy || !permission?.granted}
            onPress={start}
          />
          {scanning ? (
            <Button
              title="Pausar cámara"
              tone="secondary"
              onPress={() => setScanning(false)}
            />
          ) : null}
        </Card>
      ) : (
        <Card>
          <Text style={{ color: '#142A43', fontSize: 22, fontWeight: '700' }}>
            Confirmar visita
          </Text>
          <Field
            label="Residente"
            value={preview.residentName}
            editable={false}
          />
          <Field label="Unidad" value={preview.unitCode} editable={false} />
          <Field
            label="Nombre del visitante"
            value={name}
            onChangeText={(value) => { if (!pending.current) setName(value); }}
            maxLength={120}
            editable={!busy && !unconfirmed}
          />
          <Button
            title={direction === 'ENTRY' ? '✓ Ingreso' : 'Ingreso'}
            tone={direction === 'ENTRY' ? 'primary' : 'secondary'}
            disabled={busy || unconfirmed}
            onPress={() => { if (!pending.current) setDirection('ENTRY'); }}
          />
          <Button
            title={direction === 'EXIT' ? '✓ Salida' : 'Salida'}
            tone={direction === 'EXIT' ? 'primary' : 'secondary'}
            disabled={busy || unconfirmed}
            onPress={() => { if (!pending.current) setDirection('EXIT'); }}
          />
          <Message>
            El residente y la unidad provienen del pase. Al confirmar se
            comprobarán nuevamente su vigencia y autorización.
          </Message>
          <Button
            title={busy ? 'Registrando…' : unconfirmed ? 'Reintentar registro pendiente' : 'Confirmar registro'}
            disabled={busy || !name.trim()}
            onPress={() => {
              void confirm();
            }}
          />
          <Button
            title="Cancelar y escanear otro"
            tone="secondary"
            disabled={busy}
            onPress={start}
          />
        </Card>
      )}
      <Button
        title="Cerrar sesión"
        tone="secondary"
        disabled={busy}
        onPress={signOut}
      />
    </Screen>
  );
}
