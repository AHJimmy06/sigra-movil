import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { Button, Card, Message } from '@/components/ui';
import { api } from '@/lib/api';
import { useSession } from '@/store/session';
import type { Arrival } from '@/types/models';

// A keyed child keeps inboxes and in-flight replies isolated across identities.
export function ResidentArrivals() {
  const token = useSession((s) => s.token);
  const user = useSession((s) => s.user);
  if (!token || user?.role !== 'RESIDENT') return null;
  return <ArrivalInbox key={`${user.sub}:${token}`} token={token} />;
}
function ArrivalInbox({ token }: { token: string }) {
  const [items, setItems] = useState<Arrival[]>([]);
  const [banner, setBanner] = useState<Arrival | null>(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  // The set survives refresh/focus changes, but not a session change.
  const seen = useRef(new Set<string>());
  const history = useRef(false);
  useFocusEffect(
    useCallback(() => {
      void refresh;
      let alive = true;
      let busy = false;
      const poll = async () => {
        if (!alive || busy || AppState.currentState !== 'active') return;
        busy = true;
        try {
          const response = await api.arrivals(token);
          if (!alive) return;
          const unique = Array.from(
            new Map(response.items.map((item) => [item.id, item])).values(),
          );
          const latest = history.current
            ? unique.find((item) => !seen.current.has(item.id))
            : undefined;
          unique.forEach((item) => seen.current.add(item.id));
          history.current = true;
          if (latest) setBanner(latest);
          setItems(unique);
          setError('');
        } catch {
          if (alive)
            setError(
              'No se pudieron actualizar las visitas. Reintente con conexión.',
            );
        } finally {
          busy = false;
        }
      };
      void poll();
      const timer = setInterval(() => {
        void poll();
      }, 15000);
      const state = AppState.addEventListener('change', (next) => {
        if (next === 'active') void poll();
      });
      return () => {
        alive = false;
        clearInterval(timer);
        state.remove();
      };
    }, [token, refresh, seen, history]),
  );
  return (
    <Card>
      <Text style={{ color: '#142A43', fontWeight: '700', fontSize: 22 }}>
        Llegadas de visitantes
      </Text>
      <Text style={{ color: '#475569', fontSize: 13 }}>
        Se actualiza cada 15 segundos mientras esta pantalla está abierta. No se
        envían notificaciones con la app cerrada.
      </Text>
      {banner ? (
        <>
          <Message tone="success">
            Nuevo ingreso: {banner.visitorName ?? 'Visitante'} ·{' '}
            {banner.unitCode}
          </Message>
          <Button
            title="Entendido"
            tone="secondary"
            onPress={() => setBanner(null)}
          />
        </>
      ) : null}
      {error ? <Message tone="warning">{error}</Message> : null}
      {items.length ? (
        items.slice(0, 5).map((item) => (
          <View key={item.id} style={{ paddingVertical: 8 }}>
            <Text style={{ color: '#142A43', fontWeight: '600' }}>
              {item.visitorName ?? 'Visitante'} · {item.unitCode}
            </Text>
            <Text style={{ color: '#475569' }}>
              {new Date(item.occurredAt).toLocaleString('es-EC')}
            </Text>
          </View>
        ))
      ) : (
        <Text style={{ color: '#475569' }}>Sin ingresos recientes.</Text>
      )}
      <Button
        title="Actualizar visitas"
        tone="secondary"
        onPress={() => setRefresh((value) => value + 1)}
      />
    </Card>
  );
}
