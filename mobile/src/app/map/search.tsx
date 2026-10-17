import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useMapSession } from '@/components/map/map-session';
import { ServiceNotice } from '@/components/map/service-notice';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { isAbortError, maps, type GeocodeResult } from '@/lib/maps';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; results: GeocodeResult[] }
  | { status: 'error'; error: unknown };

const DEBOUNCE_MS = 300;

export default function SearchSheet() {
  const router = useRouter();
  const theme = useTheme();
  const { origin, setDestination, setRoute } = useMapSession();
  const [query, setQuery] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ status: 'idle' });

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setState({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState({ status: 'loading' });
      try {
        const results = await maps.geocode(text, { near: origin ?? undefined, signal: controller.signal });
        if (!controller.signal.aborted) setState({ status: 'done', results });
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) return;
        setState({ status: 'error', error });
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, origin, attempt]);

  const choose = (result: GeocodeResult) => {
    setDestination(result);
    setRoute(null);
    router.replace('/map/route');
  };

  return (
    <View style={styles.container}>
      <TextInput
        autoFocus
        value={query}
        onChangeText={setQuery}
        placeholder="Cari alamat atau tempat"
        placeholderTextColor={theme.textSecondary}
        returnKeyType="search"
        autoCorrect={false}
        style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
      />

      {state.status === 'error' ? (
        <ServiceNotice error={state.error} onRetry={() => setAttempt((n) => n + 1)} />
      ) : null}

      {state.status === 'loading' ? <ActivityIndicator style={styles.loading} /> : null}

      {state.status === 'idle' ? (
        <ThemedText type="small" themeColor="textSecondary">
          Ketik minimal 2 huruf, mis. "Monas Jakarta".
        </ThemedText>
      ) : null}

      {state.status === 'done' && state.results.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Tidak ada hasil untuk "{query.trim()}". Data peta hanya mencakup wilayah yang dimuat server.
        </ThemedText>
      ) : null}

      <FlatList
        data={state.status === 'done' ? state.results : []}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.backgroundSelected }]} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => choose(item)} style={styles.row} accessibilityRole="button">
            <ThemedText type="smallBold" numberOfLines={1}>
              {item.name}
            </ThemedText>
            {item.address ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {item.address}
              </ThemedText>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  input: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  loading: { alignSelf: 'center' },
  row: { paddingVertical: 12, gap: 2 },
  separator: { height: StyleSheet.hairlineWidth },
});
