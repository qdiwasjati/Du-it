import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/features/auth/auth-provider';
import { useTheme } from '@/hooks/use-theme';
import { signOut } from '@/lib/auth/google';
import { getDb } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

type Profile = Pick<Database['public']['Tables']['profiles']['Row'], 'display_name' | 'rating_avg' | 'completed_count'>;

export default function AccountScreen() {
  const auth = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userId = auth.status === 'signed-in' ? auth.session.user.id : null;
  const email = auth.status === 'signed-in' ? auth.session.user.email : null;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void getDb()
      .from('profiles')
      .select('display_name, rating_avg, completed_count')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError(queryError.message);
        else setProfile(data);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 16 }]}>
      <ThemedText type="subtitle">Akun</ThemedText>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold">{profile?.display_name ?? '...'}</ThemedText>
        {email ? (
          <ThemedText type="small" themeColor="textSecondary">
            {email}
          </ThemedText>
        ) : null}
        {profile ? (
          <ThemedText type="small" themeColor="textSecondary">
            Rating {profile.rating_avg.toFixed(1)} · {profile.completed_count} tugas selesai
          </ThemedText>
        ) : null}
        {error ? (
          <ThemedText type="small" accessibilityRole="alert">
            Gagal memuat profil: {error}
          </ThemedText>
        ) : null}
      </View>

      <Pressable
        onPress={() => void signOut()}
        style={[styles.button, { backgroundColor: theme.backgroundElement }]}
        accessibilityRole="button">
        <ThemedText type="smallBold">Keluar</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, gap: 16 },
  card: { borderRadius: 16, padding: 16, gap: 4 },
  button: { borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
});
