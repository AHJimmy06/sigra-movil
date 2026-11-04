import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  LargeTitle,
  Message,
  PhoneIcon,
  Screen,
  SectionHeader,
  ShieldIcon,
} from '@/components/ui';

type Entry = {
  id: string;
  kind: 'contact' | 'rule';
  title: string;
  detail: string;
  phone: string | null;
};

export default function DirectoryScreen() {
  const db = useSQLiteContext();
  const [entries, setEntries] = useState<Entry[]>([]);

  useFocusEffect(
    useCallback(() => {
      void db
        .getAllAsync<Entry>('SELECT * FROM directory ORDER BY kind, title')
        .then(setEntries);
    }, [db]),
  );

  const contacts = useMemo(
    () => entries.filter((item) => item.kind === 'contact'),
    [entries],
  );
  const rules = useMemo(
    () => entries.filter((item) => item.kind === 'rule'),
    [entries],
  );

  return (
    <Screen>
      <LargeTitle
        eyebrow="Asistencia y Normativa"
        subtitle="Números de respuesta inmediata y lineamientos esenciales de convivencia disponibles sin conexión."
      >
        Directorio
      </LargeTitle>

      <Message>
        Este directorio reside en la base de datos local del dispositivo para
        garantizar disponibilidad total durante cortes de energía o internet.
      </Message>

      <SectionHeader
        title="Contactos de Emergencia y Garita"
        subtitle="Marcación directa con un toque"
      />

      <View className="gap-3">
        {contacts.map((entry) => (
          <Card key={entry.id}>
            <View className="flex-row items-center justify-between gap-2">
              <Badge
                label={entry.phone === '911' ? 'Emergencia 24/7' : 'Canal Oficial'}
                tone={entry.phone === '911' ? 'danger' : 'brand'}
              />
              {entry.phone ? (
                <Text
                  className="text-xs font-bold text-slate-500"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {entry.phone}
                </Text>
              ) : null}
            </View>
            <Text className="text-base font-bold text-ink">{entry.title}</Text>
            <Text className="text-sm leading-5 text-slate-600">
              {entry.detail}
            </Text>
            {entry.phone ? (
              <Button
                title={`Llamar a ${entry.phone}`}
                tone={entry.phone === '911' ? 'danger' : 'primary'}
                icon={<PhoneIcon size={16} color="#FFFFFF" />}
                onPress={() => void Linking.openURL(`tel:${entry.phone}`)}
              />
            ) : null}
          </Card>
        ))}
      </View>

      <SectionHeader
        title="Reglamento Interno de Convivencia"
        subtitle="Normas obligatorias para residentes y visitantes"
      />

      <View className="gap-3">
        {rules.map((entry) => (
          <Card key={entry.id} variant="subtle">
            <View className="flex-row items-center gap-2">
              <ShieldIcon size={16} color="#0F766E" />
              <Text className="flex-1 text-sm font-bold text-ink">
                {entry.title}
              </Text>
            </View>
            <Text className="text-sm leading-5 text-slate-700">
              {entry.detail}
            </Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
