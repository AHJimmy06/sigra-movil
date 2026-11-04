import { Redirect, Tabs } from 'expo-router';
import {
  DirectoryIcon,
  HomeIcon,
  ProfileIcon,
  TicketIcon,
  WalletIcon,
} from '@/components/ui';
import { useSession } from '@/store/session';

export default function TabsLayout() {
  const status = useSession((state) => state.status);
  if (status === 'anonymous') return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0F766E',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: 'rgba(15, 23, 42, 0.08)',
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <HomeIcon color={String(color)} size={22} />,
        }}
      />
      <Tabs.Screen
        name="passes"
        options={{
          title: 'Pases QR',
          tabBarIcon: ({ color }) => <WalletIcon color={String(color)} size={22} />,
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Incidencias',
          tabBarIcon: ({ color }) => <TicketIcon color={String(color)} size={22} />,
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          title: 'Directorio',
          tabBarIcon: ({ color }) => <DirectoryIcon color={String(color)} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <ProfileIcon color={String(color)} size={22} />,
        }}
      />
    </Tabs>
  );
}
