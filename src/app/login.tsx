import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Field, Message, Screen, Title } from '@/components/ui';
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
    setBusy(true); setError(null);
    try { await login(email, password); router.replace('/(tabs)'); }
    catch (value) { setError(value instanceof Error ? value.message : 'Login failed'); }
    finally { setBusy(false); }
  };
  return <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Screen><Title subtitle="Secure resident access and services">SIGRA Resident</Title>{error ? <Message tone="error">{error}</Message> : null}<Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" /><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" /><Button title={busy ? 'Signing in…' : 'Sign in'} disabled={busy || !email || !password} onPress={submit} /><Message>Resident accounts only. Your token is stored in the device secure store.</Message></Screen></KeyboardAvoidingView>;
}
