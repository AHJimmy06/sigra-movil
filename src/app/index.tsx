import { Redirect } from 'expo-router';
import { Loading } from '@/components/ui';
import { useSession } from '@/store/session';

export default function Index() {
  const status = useSession((state) => state.status);
  if (status === 'booting') return <Loading label="Restoring secure session" />;
  return <Redirect href={status === 'authenticated' ? '/(tabs)' : '/login'} />;
}
