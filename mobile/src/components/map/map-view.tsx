import { Camera, Map, UserLocation, type CameraRef } from '@maplibre/maplibre-react-native';
import { useEffect, useState, type ReactNode, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { checkMapStyle, MapServiceError, type LngLat } from '@/lib/maps';

import { ServiceNotice } from './service-notice';

/** Monas, Jakarta - dipakai bila lokasi user belum tersedia. */
export const DEFAULT_CENTER: LngLat = [106.8272, -6.1754];

type Props = {
  cameraRef: Ref<CameraRef>;
  showUserLocation: boolean;
  /** Pusat awal kamera; bila ada (lokasi user sudah diketahui) langsung zoom dekat. */
  initialCenter?: LngLat | null;
  children?: ReactNode;
};

type State =
  | { status: 'checking' }
  | { status: 'ready'; styleUrl: string }
  | { status: 'error'; error: unknown };

/**
 * MapLibre + pengecekan server tile. Bila PC server mati / beda Wi-Fi, yang tampil adalah
 * kartu error dengan tombol coba lagi - bukan layar kosong atau crash.
 */
export function DuitMap({ cameraRef, showUserLocation, initialCenter, children }: Props) {
  const theme = useTheme();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ status: 'checking' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'checking' });
    checkMapStyle(controller.signal)
      .then((styleUrl) => setState({ status: 'ready', styleUrl }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', error });
      });
    return () => controller.abort();
  }, [attempt]);

  if (state.status !== 'ready') {
    return (
      <View style={[styles.fill, styles.center, { backgroundColor: theme.background }]}>
        {state.status === 'checking' ? (
          <ThemedText type="small" themeColor="textSecondary">
            Menghubungi server peta...
          </ThemedText>
        ) : (
          <View style={styles.noticeWrap}>
            <ServiceNotice error={state.error} onRetry={() => setAttempt((n) => n + 1)} />
          </View>
        )}
      </View>
    );
  }

  return (
    <Map
      style={styles.fill}
      mapStyle={state.styleUrl}
      onDidFailLoadingMap={() =>
        setState({
          status: 'error',
          error: new MapServiceError('tiles', 'bad_response', 'style peta gagal dimuat'),
        })
      }>
      <Camera
        ref={cameraRef}
        initialViewState={{ center: initialCenter ?? DEFAULT_CENTER, zoom: initialCenter ? 15 : 11 }}
      />
      {showUserLocation ? <UserLocation accuracy heading /> : null}
      {children}
    </Map>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  noticeWrap: { width: '100%', paddingHorizontal: 24 },
});
