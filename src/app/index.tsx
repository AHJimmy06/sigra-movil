import { Redirect } from 'expo-router';
import { Loading, Screen } from '@/components/ui';
import { useSession } from '@/store/session';

export default function IndexScreen() {
  const status = useSession((state) => state.status);
  if (status === 'booting') return <Screen scroll={false}><Loading label="Restaurando sesión segura…" /></Screen>;
  return <Redirect href={status === 'authenticated' ? '/(tabs)' : '/login'} />;
}
