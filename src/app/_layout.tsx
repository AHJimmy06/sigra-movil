import '@/global.css';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { Suspense } from 'react';
import { View } from 'react-native';
import { SyncRuntime } from '@/components/sync-runtime';
import { Loading } from '@/components/ui';
import { migrateDatabase } from '@/lib/db';

export default function RootLayout() {
  return (
    <Suspense
      fallback={
        <View className="flex-1 items-center justify-center bg-canvas">
          <Loading label="Preparando almacenamiento local seguro…" />
        </View>
      }
    >
      <SQLiteProvider
        databaseName="sigra-resident.db"
        onInit={migrateDatabase}
        useSuspense
      >
        <SyncRuntime />
        <Stack screenOptions={{ headerShown: false }} />
      </SQLiteProvider>
    </Suspense>
  );
}
