import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { getSupabase } from '@/lib/supabase/client';

export type AuthErrorCode = 'not_configured' | 'play_services' | 'no_token' | 'supabase' | 'unknown';

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

let configured = false;

function ensureConfigured() {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    throw new AuthError(
      'not_configured',
      'Login Google belum dikonfigurasi. Isi EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID di .env lalu restart app.',
    );
  }
  if (!configured) {
    // webClientId (bukan Client ID Android) dipakai agar token Google ditujukan ke Supabase.
    GoogleSignin.configure({ webClientId });
    configured = true;
  }
}

export type GoogleSignInResult = { status: 'success' } | { status: 'cancelled' };

/**
 * Native Google sign-in -> ID token -> Supabase signInWithIdToken.
 * Varian gratis library ini tidak mendukung nonce kustom, jadi token dikirim tanpa nonce
 * (pola resmi Supabase untuk Google native).
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  ensureConfigured();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  } catch {
    throw new AuthError('play_services', 'Google Play Services tidak tersedia atau perlu diperbarui di perangkat ini.');
  }

  let response;
  try {
    response = await GoogleSignin.signIn();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal membuka login Google.';
    throw new AuthError('unknown', message);
  }
  if (response.type === 'cancelled') return { status: 'cancelled' };

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new AuthError('no_token', 'Google tidak mengembalikan token. Periksa Client ID web di konfigurasi.');
  }

  const { error } = await getSupabase().auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) throw new AuthError('supabase', `Supabase menolak login: ${error.message}`);

  return { status: 'success' };
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
  try {
    await GoogleSignin.signOut();
  } catch {
    // sudah keluar dari Google atau belum pernah masuk: tidak perlu ditangani
  }
}
