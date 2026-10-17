import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { isMapServiceError } from '@/lib/maps';

type Props = {
  error: unknown;
  onRetry?: () => void;
};

/** Pesan error ramah untuk server peta mati / belum dikonfigurasi. Tidak pernah melempar. */
export function ServiceNotice({ error, onRetry }: Props) {
  const theme = useTheme();
  const serverDown = isMapServiceError(error) && error.isServerDown;
  const title = serverDown ? 'Server peta tidak aktif' : 'Peta belum bisa dipakai';
  const message = error instanceof Error ? error.message : 'Terjadi kesalahan tak dikenal.';

  return (
    <View style={[styles.box, { backgroundColor: theme.backgroundElement }]} accessibilityRole="alert">
      <ThemedText type="smallBold">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {message}
      </ThemedText>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retry} accessibilityRole="button">
          <ThemedText type="smallBold" style={styles.retryText}>
            Coba lagi
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 16, padding: 16, gap: 6 },
  retry: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: '#D4FF3F',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: '#0E0E10' },
});
