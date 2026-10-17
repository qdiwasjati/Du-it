import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { LocationNotice } from '@/components/map/location-notice';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { watchFix, useLocationAccess, type Fix } from '@/lib/location';
import type { LngLat } from '@/lib/maps';
import {
  DRIVER_PUBLISH_INTERVAL_MS,
  h3IndexOf,
  publishDriverLocation,
  removeDriverLocation,
} from '@/lib/supabase/driver-locations';

type Sent = { at: number; coordinate: LngLat; h3Index: string };

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'Terjadi kesalahan tak dikenal.';
}

export default function DriverModeSheet() {
  const theme = useTheme();
  const location = useLocationAccess();
  const [active, setActive] = useState(false);
  const [lastSent, setLastSent] = useState<Sent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latestFix = useRef<Fix | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let stopWatching: (() => void) | null = null;
    let pending: Promise<void> | null = null;

    const publish = () => {
      const fix = latestFix.current;
      if (!fix || pending) return;
      pending = publishDriverLocation(fix.coordinate, fix.heading)
        .then(() => {
          if (cancelled) return;
          setError(null);
          setLastSent({ at: Date.now(), coordinate: fix.coordinate, h3Index: h3IndexOf(fix.coordinate) });
        })
        .catch((e: unknown) => {
          if (!cancelled) setError(message(e));
        })
        .finally(() => {
          pending = null;
        });
    };

    setError(null);
    watchFix((fix) => {
      const first = latestFix.current === null;
      latestFix.current = fix;
      if (first) publish();
    })
      .then((stop) => {
        if (cancelled) stop();
        else stopWatching = stop;
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(message(e));
      });

    const timer = setInterval(publish, DRIVER_PUBLISH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
      stopWatching?.();
      latestFix.current = null;
      // Tunggu upsert yang sedang jalan agar baris tidak "hidup lagi" setelah dihapus.
      void Promise.resolve(pending)
        .then(() => removeDriverLocation())
        .catch(() => undefined);
    };
  }, [active]);

  const canStart = location.access === 'granted';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText type="smallBold">Bagikan lokasi sebagai driver</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Posisimu dikirim tiap {DRIVER_PUBLISH_INTERVAL_MS / 1000} detik dan terlihat oleh user di sekitar.
          </ThemedText>
        </View>
        <Switch value={active} onValueChange={setActive} disabled={!canStart && !active} />
      </View>

      <LocationNotice location={location} />

      {active ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="small">
            Lokasi hanya terkirim selama app terbuka di layar. Jika app pindah ke background, pengiriman berhenti.
          </ThemedText>
          {lastSent ? (
            <ThemedText type="small" themeColor="textSecondary">
              Terkirim {new Date(lastSent.at).toLocaleTimeString('id-ID')} · {lastSent.coordinate[1].toFixed(5)},{' '}
              {lastSent.coordinate[0].toFixed(5)} · H3 {lastSent.h3Index}
            </ThemedText>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              Menunggu sinyal GPS...
            </ThemedText>
          )}
        </View>
      ) : null}

      {error ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]} accessibilityRole="alert">
          <ThemedText type="smallBold">Gagal mengirim lokasi</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {error}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerText: { flex: 1, gap: 2 },
  card: { borderRadius: 16, padding: 14, gap: 6 },
});
