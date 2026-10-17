import { MapServiceError } from './types';
import { getServiceUrl } from './config';
import { fetchJson } from './http';

/**
 * Cek server peta hidup SEBELUM merender MapLibre, supaya PC mati menghasilkan
 * pesan error yang jelas (MapLibre sendiri hanya memberi event kosong).
 */
export async function checkMapStyle(signal?: AbortSignal): Promise<string> {
  const url = getServiceUrl('tiles');
  const { ok, status } = await fetchJson<unknown>('tiles', url, { signal });
  if (!ok) throw new MapServiceError('tiles', 'bad_response', `HTTP ${status}`);
  return url;
}
