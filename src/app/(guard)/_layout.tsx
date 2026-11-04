import { Redirect, Stack } from 'expo-router';
import { Loading, Screen } from '@/components/ui';
import { useSession } from '@/store/session';
export default function GuardLayout() {
  const { status, user } = useSession();
  if (status === 'booting')
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (status !== 'authenticated' || !user) return <Redirect href="/login" />;
  if (user.role !== 'GUARD') return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
