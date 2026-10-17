import { MapServiceError, type MapServiceName } from './types';

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/** Nilai env dibaca saat dipanggil; Expo meng-inline EXPO_PUBLIC_* saat bundling. */
export function getServiceUrl(service: MapServiceName): string {
  const value = {
    tiles: process.env.EXPO_PUBLIC_MAP_STYLE_URL,
    geocoder: process.env.EXPO_PUBLIC_GEOCODER_URL,
    routing: process.env.EXPO_PUBLIC_ROUTING_URL,
  }[service];
  const envName = {
    tiles: 'EXPO_PUBLIC_MAP_STYLE_URL',
    geocoder: 'EXPO_PUBLIC_GEOCODER_URL',
    routing: 'EXPO_PUBLIC_ROUTING_URL',
  }[service];

  if (!value) throw new MapServiceError(service, 'not_configured', envName);
  return service === 'tiles' ? value : trimSlash(value);
}
