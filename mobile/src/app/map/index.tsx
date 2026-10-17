import type { CameraRef } from '@maplibre/maplibre-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocationNotice } from '@/components/map/location-notice';
import { useMapSession } from '@/components/map/map-session';
import { DuitMap } from '@/components/map/map-view';
import { DestinationMarker, DriverMarker } from '@/components/map/markers';
import { RouteLine } from '@/components/map/route-layer';
import { ThemedText } from '@/components/themed-text';
import { useNearbyDrivers } from '@/hooks/use-nearby-drivers';
import { useTheme } from '@/hooks/use-theme';
import { getCurrentLngLat, useLocationAccess } from '@/lib/location';
import { boundsOf, formatDistance, formatDuration } from '@/lib/maps';

export default function MapScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraRef>(null);
  const { origin, setOrigin, destination, route, clearTrip } = useMapSession();
  const location = useLocationAccess();
  const [locationError, setLocationError] = useState<string | null>(null);
  const nearby = useNearbyDrivers(origin);

  useEffect(() => {
    if (location.access !== 'granted') return;
    let cancelled = false;
    getCurrentLngLat()
      .then((coordinate) => {
        if (cancelled) return;
        setLocationError(null);
        setOrigin(coordinate);
        cameraRef.current?.flyTo({ center: coordinate, zoom: 15, duration: 800 });
      })
      .catch(() => {
        if (!cancelled) setLocationError('Tidak bisa membaca posisi. Coba lagi di tempat terbuka.');
      });
    return () => {
      cancelled = true;
    };
  }, [location.access, setOrigin]);

  useEffect(() => {
    if (!route || route.geometry.length < 2) return;
    cameraRef.current?.fitBounds(boundsOf(route.geometry), {
      padding: { top: insets.top + 90, bottom: 340, left: 40, right: 40 },
      duration: 600,
    });
  }, [route, insets.top]);

  const driverLabel =
    nearby.status === 'error'
      ? `Driver: ${nearby.error ?? 'tidak tersedia'}`
      : nearby.status === 'idle'
        ? null
        : `${nearby.drivers.length} driver di sekitar${nearby.status === 'live' ? ' · live' : ' · menyambung...'}`;

  return (
    <View style={styles.fill}>
      <DuitMap cameraRef={cameraRef} showUserLocation={location.access === 'granted'} initialCenter={origin}>
        {route ? <RouteLine geometry={route.geometry} /> : null}
        {destination ? <DestinationMarker coordinate={destination.coordinate} /> : null}
        {nearby.drivers.map((driver) => (
          <DriverMarker key={driver.driverId} driver={driver} />
        ))}
      </DuitMap>

      <View style={[styles.top, { top: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable
          onPress={() => router.push('/map/search')}
          style={[styles.search, { backgroundColor: theme.background }]}
          accessibilityRole="search"
          accessibilityLabel="Cari tujuan">
          <ThemedText numberOfLines={1} themeColor={destination ? 'text' : 'textSecondary'} style={styles.searchText}>
            {destination ? destination.name : 'Mau ke mana?'}
          </ThemedText>
          {destination ? (
            <Pressable onPress={clearTrip} hitSlop={12} accessibilityLabel="Hapus tujuan">
              <ThemedText type="smallBold">✕</ThemedText>
            </Pressable>
          ) : null}
        </Pressable>
        {driverLabel ? (
          <View style={[styles.chip, { backgroundColor: theme.background }]}>
            <ThemedText type="small" numberOfLines={2}>
              {driverLabel}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={[styles.fabs, { bottom: insets.bottom + 96 }]} pointerEvents="box-none">
        <Pressable
          style={[styles.fab, { backgroundColor: theme.background }]}
          onPress={() => router.push('/map/driver-mode')}
          accessibilityLabel="Mode driver">
          <Text style={styles.fabIcon}>🛵</Text>
        </Pressable>
        <Pressable
          style={[styles.fab, { backgroundColor: theme.background }]}
          disabled={!origin}
          onPress={() => origin && cameraRef.current?.flyTo({ center: origin, zoom: 15, duration: 500 })}
          accessibilityLabel="Ke lokasiku">
          <Text style={[styles.fabIcon, !origin && styles.disabled]}>📍</Text>
        </Pressable>
      </View>

      <View style={[styles.bottom, { bottom: insets.bottom + 96 }]} pointerEvents="box-none">
        {route && destination ? (
          <Pressable
            onPress={() => router.push('/map/route')}
            style={[styles.summary, { backgroundColor: '#D4FF3F' }]}
            accessibilityRole="button">
            <Text style={styles.summaryText}>
              {formatDistance(route.distanceMeters)} · {formatDuration(route.durationSeconds)}
            </Text>
          </Pressable>
        ) : null}
        <LocationNotice location={location} />
        {locationError ? (
          <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small">{locationError}</ThemedText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: { position: 'absolute', left: 16, right: 16, gap: 8 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
  },
  searchText: { flex: 1 },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    boxShadow: '0 1px 6px rgba(0,0,0,0.15)',
  },
  fabs: { position: 'absolute', right: 16, gap: 10 },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  fabIcon: { fontSize: 22 },
  disabled: { opacity: 0.35 },
  bottom: { position: 'absolute', left: 16, right: 80, gap: 8 },
  summary: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  summaryText: { color: '#0E0E10', fontWeight: '700', fontSize: 16 },
});
