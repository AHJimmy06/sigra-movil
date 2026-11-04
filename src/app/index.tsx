import { Redirect } from 'expo-router';
import { Loading, Screen } from '@/components/ui';
import { useSession } from '@/store/session';
import { homeForUser } from '@/lib/session-role';

export default function IndexScreen() {
  const status = useSession((state) => state.status);
  const user = useSession((state) => state.user);
  if (status === 'booting') return <Screen scroll={false}><Loading label="Restaurando sesión segura…" /></Screen>;
  return <Redirect href={status === 'authenticated' ? homeForUser(user) : '/login'} />;
}
