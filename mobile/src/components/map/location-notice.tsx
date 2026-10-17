import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { LocationAccessState } from '@/lib/location';

const COPY = {
  denied: {
    message: 'Izin lokasi dibutuhkan untuk menampilkan posisimu dan menghitung rute.',
    action: 'Izinkan lokasi',
  },
  blocked: {
    message: 'Izin lokasi ditolak permanen. Aktifkan lewat Pengaturan aplikasi.',
    action: 'Buka Pengaturan',
  },
  'services-off': {
    message: 'Layanan lokasi (GPS) di perangkat sedang mati. Aktifkan di pengaturan perangkat.',
    action: 'Buka Pengaturan',
  },
} as const;

/** Tampil hanya saat lokasi belum bisa dipakai; menangani denied / blocked / GPS mati. */
export function LocationNotice({ location }: { location: LocationAccessState }) {
  const theme = useTheme();
  if (location.access === 'granted' || location.access === 'checking') return null;
  const copy = COPY[location.access];
  const onPress = location.access === 'denied' ? () => void location.request() : location.openSettings;

  return (
    <View style={[styles.box, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="small">{copy.message}</ThemedText>
      <Pressable onPress={onPress} style={styles.button} accessibilityRole="button">
        <ThemedText type="smallBold" style={styles.buttonText}>
          {copy.action}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 16, padding: 14, gap: 10 },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#D4FF3F',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonText: { color: '#0E0E10' },
});
