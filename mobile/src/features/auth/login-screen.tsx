import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { signInWithGoogle } from '@/lib/auth/google';

export function LoginScreen() {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPress = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login gagal. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.hero}>
        <ThemedText type="title" style={styles.brand}>
          DUIT!
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.tagline}>
          Tugas kecil di sekitarmu. Posting, kerjakan, dibayar.
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          disabled={busy}
          onPress={onPress}
        />
        {error ? (
          <View style={[styles.error, { backgroundColor: theme.backgroundElement }]} accessibilityRole="alert">
            <ThemedText type="small">{error}</ThemedText>
          </View>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary" style={styles.legal}>
          Dengan masuk, kamu setuju lokasi dan foto bukti tugas dipakai untuk menjalankan layanan.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  hero: { flex: 1, justifyContent: 'center', gap: 12 },
  brand: { fontSize: 56, lineHeight: 60 },
  tagline: { fontSize: 18 },
  actions: { alignItems: 'center', gap: 16, paddingBottom: 24 },
  error: { borderRadius: 14, padding: 12, alignSelf: 'stretch' },
  legal: { textAlign: 'center' },
});
