import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';

type AuthState =
  | { status: 'loading' }
  | { status: 'unconfigured' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; session: Session };

const AuthContext = createContext<AuthState | null>(null);

function fromSession(session: Session | null): AuthState {
  return session ? { status: 'signed-in', session } : { status: 'signed-out' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() =>
    isSupabaseConfigured() ? { status: 'loading' } : { status: 'unconfigured' },
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (active) setState(fromSession(data.session));
    });
    // Callback ini hanya mengubah state: jangan memanggil API Supabase lain di dalamnya.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState(fromSession(session));
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext value={state}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return value;
}
