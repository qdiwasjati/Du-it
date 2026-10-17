import * as Location from 'expo-location';
import { Linking } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import type { LngLat } from '@/lib/maps';

export type LocationAccess =
  | 'checking'
  | 'granted'
  | 'denied' // ditolak, masih bisa diminta lagi
  | 'blocked' // ditolak permanen, harus lewat Pengaturan
  | 'services-off'; // izin ada tapi GPS/Location Services mati

export type LocationAccessState = {
  access: LocationAccess;
  /** Izin hanya saat app dibuka (iOS "While Using"). Lokasi berhenti saat app di background. */
  foregroundOnly: boolean;
  request: () => Promise<void>;
  openSettings: () => void;
};

export function useLocationAccess(): LocationAccessState {
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const [servicesEnabled, setServicesEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!permission?.granted) return;
    let cancelled = false;
    Location.hasServicesEnabledAsync()
      .then((enabled) => !cancelled && setServicesEnabled(enabled))
      .catch(() => !cancelled && setServicesEnabled(true));
    return () => {
      cancelled = true;
    };
  }, [permission?.granted]);

  const request = useCallback(async () => {
    const result = await requestPermission();
    if (result?.granted) {
      setServicesEnabled(await Location.hasServicesEnabledAsync().catch(() => true));
    }
  }, [requestPermission]);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  let access: LocationAccess;
  if (!permission) access = 'checking';
  else if (permission.granted) access = servicesEnabled === false ? 'services-off' : 'granted';
  else access = permission.canAskAgain ? 'denied' : 'blocked';

  return {
    access,
    // Aplikasi memang hanya meminta izin foreground; pada iOS scope-nya 'whenInUse'.
    foregroundOnly: permission?.granted === true,
    request,
    openSettings,
  };
}

export async function getCurrentLngLat(): Promise<LngLat> {
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return [position.coords.longitude, position.coords.latitude];
}

export type Fix = { coordinate: LngLat; heading: number | null; accuracy: number | null };

/** Pantau posisi (foreground). Kembalikan fungsi untuk berhenti. */
export async function watchFix(onFix: (fix: Fix) => void): Promise<() => void> {
  const subscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 3 },
    (position) => {
      const { longitude, latitude, heading, accuracy } = position.coords;
      onFix({
        coordinate: [longitude, latitude],
        // heading bernilai -1 / null bila perangkat tidak diam-diam tahu arah.
        heading: heading !== null && heading >= 0 ? heading : null,
        accuracy,
      });
    },
  );
  return () => subscription.remove();
}
