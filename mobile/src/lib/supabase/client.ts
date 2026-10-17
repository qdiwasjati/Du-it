import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase belum dikonfigurasi. Isi EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY di .env lalu restart app.');
    this.name = 'SupabaseNotConfiguredError';
  }
}

let client: SupabaseClient | null = null;

/** Dibuat lazily supaya app tidak crash saat import bila .env belum diisi. */
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new SupabaseNotConfiguredError();

  client = createClient(url, key, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  // Refresh token hanya jalan saat app aktif (rekomendasi Supabase untuk React Native).
  AppState.addEventListener('change', (state) => {
    if (!client) return;
    if (state === 'active') client.auth.startAutoRefresh();
    else client.auth.stopAutoRefresh();
  });

  return client;
}

/**
 * Pastikan ada sesi. MVP belum punya layar login, jadi memakai anonymous sign-in
 * (harus diaktifkan di Supabase: Authentication -> Providers -> Anonymous).
 * Setiap perangkat mendapat user_id sendiri sehingga RLS `driver_id = auth.uid()` tetap berlaku.
 */
export async function ensureUserId(): Promise<string> {
  const supabase = getSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) return sessionData.session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(
      `Gagal masuk ke Supabase (${error?.message ?? 'tanpa user'}). Aktifkan Anonymous sign-ins di dashboard Supabase.`,
    );
  }
  return data.user.id;
}
