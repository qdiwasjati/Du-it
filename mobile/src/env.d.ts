declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_MAP_STYLE_URL?: string;
    readonly EXPO_PUBLIC_GEOCODER_URL?: string;
    readonly EXPO_PUBLIC_ROUTING_URL?: string;
    readonly EXPO_PUBLIC_SUPABASE_URL?: string;
    readonly EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  }
}
