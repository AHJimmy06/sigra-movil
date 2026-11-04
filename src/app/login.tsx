import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  Field,
  LargeTitle,
  Message,
  Screen,
  ShieldIcon,
} from '@/components/ui';
import { useSession } from '@/store/session';

export default function LoginScreen() {
  const status = useSession((state) => state.status);
  const login = useSession((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'authenticated') return <Redirect href="/(tabs)" />;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : 'No fue posible iniciar sesión. Verifique sus credenciales.',
      );
    } finally {
      setBusy(false);
    }
  };

  const fillDemoResident = () => {
    setEmail('residente@sigra.local');
    setPassword('SigraDemo#2026!');
    setError(null);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <View className="pt-4 pb-2">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-obsidian shadow-sm">
            <ShieldIcon size={28} color="#2DD4BF" />
          </View>
          <LargeTitle
            eyebrow="SIGRA · Ecosistema Residencial"
            subtitle="Billetera de pases QR offline, cartelera oficial y reporte de incidencias con respaldo local."
          >
            Acceso Residente
          </LargeTitle>
        </View>

        {error ? <Message tone="error">{error}</Message> : null}

        <Card>
          <View className="flex-row items-center justify-between">
            <Badge label="Credencial Verificada" tone="brand" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Autocompletar cuenta demo de residente"
              onPress={fillDemoResident}
              className="rounded-full bg-slate-100 px-3 py-1.5"
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
              <Text className="text-xs font-semibold text-brand">
                Usar cuenta demo
              </Text>
            </Pressable>
          </View>

          <Field
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="residente@sigra.local"
          />

          <Field
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            placeholder="••••••••"
          />

          <Button
            title={busy ? 'Verificando credenciales…' : 'Iniciar sesión'}
            disabled={busy || !email.trim() || !password}
            onPress={submit}
          />
        </Card>

        <Card variant="subtle">
          <View className="flex-row items-start gap-3">
            <View className="mt-0.5 rounded-xl bg-teal-100/80 p-2">
              <ShieldIcon size={18} color="#0F766E" />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-xs font-bold text-ink">
                Seguridad de grado residencial
              </Text>
              <Text className="text-xs leading-5 text-slate-600">
                Exclusivo para cuentas de residente. Su sesión JWT y las semillas
                criptográficas de sus pases QR se almacenan cifradas en el llavero
                seguro del dispositivo.
              </Text>
            </View>
          </View>
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}
