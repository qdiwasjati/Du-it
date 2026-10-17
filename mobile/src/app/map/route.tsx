import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { LocationNotice } from '@/components/map/location-notice';
import { useMapSession } from '@/components/map/map-session';
import { ServiceNotice } from '@/components/map/service-notice';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useLocationAccess } from '@/lib/location';
import { formatDistance, formatDuration, isAbortError, maps } from '@/lib/maps';

type Status = 'loading' | 'ready' | { error: unknown };

function arrivalTime(durationSeconds: number): string {
  return new Date(Date.now() + durationSeconds * 1000).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RouteSheet() {
  const router = useRouter();
  const theme = useTheme();
  const location = useLocationAccess();
  const { origin, destination, route, setRoute, clearTrip } = useMapSession();
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!origin || !destination) return;
    const controller = new AbortController();
    setStatus('loading');
    maps
      .route(origin, destination.coordinate, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setRoute(result);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        setRoute(null);
        setStatus({ error });
      });
    return () => controller.abort();
  }, [origin, destination, attempt, setRoute]);

  if (!destination) {
    return (
      <View style={styles.container}>
        <ThemedText type="small" themeColor="textSecondary">
          Belum ada tujuan. Pilih tujuan dari pencarian.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View>
        <ThemedText type="smallBold" numberOfLines={1}>
          {destination.name}
        </ThemedText>
        {destination.address ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {destination.address}
          </ThemedText>
        ) : null}
      </View>

      {!origin ? (
        location.access === 'granted' || location.access === 'checking' ? (
          <ActivityIndicator />
        ) : (
          <LocationNotice location={location} />
        )
      ) : status === 'loading' && !route ? (
        <ActivityIndicator />
      ) : typeof status === 'object' ? (
        <ServiceNotice error={status.error} onRetry={() => setAttempt((n) => n + 1)} />
      ) : route ? (
        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" themeColor="textSecondary">
              Jarak
            </ThemedText>
            <ThemedText type="subtitle" style={styles.statValue}>
              {formatDistance(route.distanceMeters)}
            </ThemedText>
          </View>
          <View style={[styles.stat, { backgroundColor: '#D4FF3F' }]}>
            <ThemedText type="small" style={styles.limeText}>
              ETA · tiba ±{arrivalTime(route.durationSeconds)}
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.statValue, styles.limeText]}>
              {formatDuration(route.durationSeconds)}
            </ThemedText>
          </View>
        </View>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary">
        Estimasi naik motor, tanpa data kemacetan langsung.
      </ThemedText>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.replace('/map/search')}
          style={[styles.button, { backgroundColor: theme.backgroundElement }]}
          accessibilityRole="button">
          <ThemedText type="smallBold">Ganti tujuan</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => {
            clearTrip();
            router.back();
          }}
          style={[styles.button, { backgroundColor: theme.backgroundElement }]}
          accessibilityRole="button">
          <ThemedText type="smallBold">Hapus rute</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderRadius: 16, padding: 14, gap: 2 },
  statValue: { fontSize: 26, lineHeight: 32 },
  limeText: { color: '#0E0E10' },
  actions: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
});
