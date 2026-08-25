import { Redirect, Tabs } from 'expo-router';
import { useSession } from '@/store/session';

export default function TabsLayout() {
  const status = useSession((state) => state.status);
  if (status === 'anonymous') return <Redirect href="/login" />;
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#155E75' }}>
    <Tabs.Screen name="index" options={{ title: 'Home' }} />
    <Tabs.Screen name="passes" options={{ title: 'Passes' }} />
    <Tabs.Screen name="tickets" options={{ title: 'Tickets' }} />
    <Tabs.Screen name="directory" options={{ title: 'Directory' }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
  </Tabs>;
}
