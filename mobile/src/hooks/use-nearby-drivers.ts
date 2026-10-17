import { useEffect, useMemo, useState } from 'react';

import { distanceMeters, type LngLat } from '@/lib/maps';
import { ensureUserId } from '@/lib/supabase/client';
import {
  DEFAULT_MATCH_RADIUS_METERS,
  DRIVER_STALE_AFTER_MS,
  fetchNearbyDrivers,
  h3IndexOf,
  matchCells,
  subscribeDriverLocations,
  type DriverLocation,
  type DriverRealtimeStatus,
} from '@/lib/supabase/driver-locations';

export type NearbyDriversState = {
  drivers: DriverLocation[];
  status: DriverRealtimeStatus | 'idle';
  error: string | null;
};

/**
 * Driver di sekitar `center` (radius H3), diperbarui real-time.
 * Fetch awal + langganan Realtime diulang hanya saat `center` pindah sel H3,
 * bukan di setiap update GPS.
 */
export function useNearbyDrivers(
  center: LngLat | null,
  radiusMeters = DEFAULT_MATCH_RADIUS_METERS,
): NearbyDriversState {
  const [byId, setById] = useState<Map<string, DriverLocation>>(new Map());
  const [status, setStatus] = useState<NearbyDriversState['status']>('idle');
  const [error, setError] = useState<string | null>(null);

  const centerCell = center ? h3IndexOf(center) : null;
  // `center` sengaja tidak jadi dependency: efek dijalankan ulang per sel H3.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableCenter = useMemo(() => center, [centerCell]);

  useEffect(() => {
    if (!stableCenter) return;
    let cancelled = false;
    let selfId: string | null = null;
    const cells = new Set(matchCells(stableCenter, radiusMeters));
    const isRelevant = (d: DriverLocation) =>
      d.driverId !== selfId &&
      cells.has(d.h3Index) &&
      distanceMeters(stableCenter, d.coordinate) <= radiusMeters;

    setStatus('connecting');
    setError(null);

    let unsubscribe: (() => void) | null = null;

    (async () => {
      try {
        selfId = await ensureUserId();
        const initial = await fetchNearbyDrivers(stableCenter, radiusMeters);
        if (cancelled) return;
        setById(new Map(initial.filter(isRelevant).map((d) => [d.driverId, d])));

        unsubscribe = subscribeDriverLocations({
          onUpsert: (driver) =>
            setById((prev) => {
              const next = new Map(prev);
              if (isRelevant(driver)) next.set(driver.driverId, driver);
              else next.delete(driver.driverId);
              return next;
            }),
          onRemove: (driverId) =>
            setById((prev) => {
              if (!prev.has(driverId)) return prev;
              const next = new Map(prev);
              next.delete(driverId);
              return next;
            }),
          onStatus: (s) => !cancelled && setStatus(s),
        });
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Gagal memuat driver');
      }
    })();

    // Buang driver yang berhenti mengirim lokasi tanpa event DELETE (app ditutup paksa).
    const prune = setInterval(() => {
      const cutoff = Date.now() - DRIVER_STALE_AFTER_MS;
      setById((prev) => {
        let changed = false;
        const next = new Map(prev);
        for (const [id, d] of prev) {
          if (d.updatedAt < cutoff) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(prune);
      unsubscribe?.();
    };
  }, [stableCenter, radiusMeters]);

  const drivers = useMemo(() => Array.from(byId.values()), [byId]);
  return { drivers, status, error };
}
