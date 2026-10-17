import { MapServiceError, type MapServiceName } from './types';

const DEFAULT_TIMEOUT_MS = 5000;

type RequestOptions = RequestInit & { timeoutMs?: number };

/**
 * fetch JSON dengan timeout. Kegagalan jaringan -> 'offline', timeout -> 'timeout',
 * sehingga UI cukup menangani MapServiceError tanpa crash.
 * `signal` dari pemanggil (mis. batal saat user mengetik lagi) diteruskan apa adanya.
 */
export async function fetchJson<T>(
  service: MapServiceName,
  url: string,
  { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...init }: RequestOptions = {},
): Promise<{ status: number; ok: boolean; body: T | null }> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    let body: T | null = null;
    try {
      body = (await response.json()) as T;
    } catch {
      body = null;
    }
    return { status: response.status, ok: response.ok, body };
  } catch (error) {
    if (signal?.aborted && !timedOut) throw error; // dibatalkan pemanggil, bukan error server
    if (timedOut) throw new MapServiceError(service, 'timeout');
    throw new MapServiceError(service, 'offline');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
