import { getHexagonEdgeLengthAvg, gridDisk, latLngToCell } from 'h3-js';

import { distanceMeters, type LngLat } from '@/lib/maps';

import { ensureUserId, getSupabase } from './client';

/** H3 resolusi 9: sisi hexagon ~200 m. Harus sama dengan nilai yang tersimpan di kolom h3_index. */
export const H3_RESOLUTION = 9;
export const DRIVER_STALE_AFTER_MS = 2 * 60 * 1000;
export const DEFAULT_MATCH_RADIUS_METERS = 2000;
/** Interval kirim lokasi driver. */
export const DRIVER_PUBLISH_INTERVAL_MS = 3000;

const TABLE = 'driver_locations';

export type DriverLocation = {
  driverId: string;
  coordinate: LngLat;
  heading: number | null;
  h3Index: string;
  updatedAt: number;
};

type Row = {
  driver_id: string;
  lat: number;
  lng: number;
  heading: number | null;
  h3_index: string;
  updated_at: string;
};

const COLUMNS = 'driver_id,lat,lng,heading,h3_index,updated_at';

function fromRow(row: Row): DriverLocation {
  return {
    driverId: row.driver_id,
    coordinate: [row.lng, row.lat],
    heading: row.heading,
    h3Index: row.h3_index,
    updatedAt: Date.parse(row.updated_at),
  };
}

export function h3IndexOf([lng, lat]: LngLat): string {
  return latLngToCell(lat, lng, H3_RESOLUTION);
}

/** Sel H3 yang menutupi lingkaran `radiusMeters` di sekitar `center` (jarak antar pusat sel = sisi x sqrt(3)). */
export function matchCells(center: LngLat, radiusMeters = DEFAULT_MATCH_RADIUS_METERS): string[] {
  const cellSpacing = getHexagonEdgeLengthAvg(H3_RESOLUTION, 'm') * Math.sqrt(3);
  const rings = Math.max(1, Math.ceil(radiusMeters / cellSpacing));
  return gridDisk(h3IndexOf(center), rings);
}

export async function publishDriverLocation(coordinate: LngLat, heading: number | null): Promise<void> {
  const driverId = await ensureUserId();
  const { error } = await getSupabase()
    .from(TABLE)
    .upsert(
      {
        driver_id: driverId,
        lat: coordinate[1],
        lng: coordinate[0],
        heading,
        h3_index: h3IndexOf(coordinate),
      },
      { onConflict: 'driver_id' },
    );
  if (error) throw new Error(error.message);
}

/** Hapus baris sendiri supaya driver langsung hilang dari peta user saat berhenti. */
export async function removeDriverLocation(): Promise<void> {
  const driverId = await ensureUserId();
  const { error } = await getSupabase().from(TABLE).delete().eq('driver_id', driverId);
  if (error) throw new Error(error.message);
}

export async function fetchNearbyDrivers(
  center: LngLat,
  radiusMeters = DEFAULT_MATCH_RADIUS_METERS,
): Promise<DriverLocation[]> {
  await ensureUserId();
  const cutoff = new Date(Date.now() - DRIVER_STALE_AFTER_MS).toISOString();
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select(COLUMNS)
    .in('h3_index', matchCells(center, radiusMeters))
    .gt('updated_at', cutoff);
  if (error) throw new Error(error.message);

  return (data as Row[])
    .map(fromRow)
    .filter((driver) => distanceMeters(center, driver.coordinate) <= radiusMeters);
}

export type DriverRealtimeStatus = 'connecting' | 'live' | 'error';

/**
 * Langganan perubahan driver_locations (Supabase Realtime, postgres_changes).
 * RLS tetap berlaku: hanya baris yang boleh dibaca user yang dikirim.
 * Mengembalikan fungsi unsubscribe.
 */
export function subscribeDriverLocations(handlers: {
  onUpsert: (driver: DriverLocation) => void;
  onRemove: (driverId: string) => void;
  onStatus: (status: DriverRealtimeStatus) => void;
}): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel('driver-locations')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (payload) => {
      if (payload.eventType === 'DELETE') {
        const id = (payload.old as Partial<Row>).driver_id;
        if (id) handlers.onRemove(id);
        return;
      }
      handlers.onUpsert(fromRow(payload.new as Row));
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') handlers.onStatus('live');
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') handlers.onStatus('error');
      else handlers.onStatus('connecting');
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}
