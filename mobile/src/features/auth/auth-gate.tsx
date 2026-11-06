import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

import { useAuth } from './auth-provider';
import { LoginScreen } from './login-screen';

/** Hanya user yang sudah login yang melihat isi app. */
export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const theme = useTheme();

  if (auth.status === 'signed-in') return <>{children}</>;

  if (auth.status === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (auth.status === 'unconfigured') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <View style={[styles.box, { backgroundColor: theme.backgroundElement }]} accessibilityRole="alert">
          <ThemedText type="smallBold">Supabase belum dikonfigurasi</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Isi EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY di file .env, lalu restart Metro dengan
            npx expo start --dev-client -c.
          </ThemedText>
        </View>
      </View>
    );
  }

  return <LoginScreen />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  box: { borderRadius: 16, padding: 16, gap: 6, width: '100%' },
});
