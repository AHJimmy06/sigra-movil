import '@/global.css';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { Suspense } from 'react';
import { Text } from 'react-native';
import { SyncRuntime } from '@/components/sync-runtime';
import { migrateDatabase } from '@/lib/db';

export default function RootLayout() {
  return (
    <Suspense fallback={<Text accessibilityRole="progressbar">Preparing offline data…</Text>}>
      <SQLiteProvider databaseName="sigra-resident.db" onInit={migrateDatabase} useSuspense>
        <SyncRuntime />
        <Stack screenOptions={{ headerShown: false }} />
      </SQLiteProvider>
    </Suspense>
  );
}
