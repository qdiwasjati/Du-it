import { getServiceUrl } from './config';
import { fetchJson } from './http';
import { decodePolyline6 } from './polyline';
import { MapServiceError, type MapsService, type RouteResult } from './types';

type ValhallaTrip = {
  summary?: { length?: number; time?: number };
  legs?: { shape?: string }[];
};

type ValhallaResponse = { trip?: ValhallaTrip; error?: string; error_code?: number };

/** Valhalla: POST /route  (https://valhalla.github.io/valhalla/api/turn-by-turn/api-reference/) */
export const route: MapsService['route'] = async (from, to, options = {}) => {
  const { ok, status, body } = await fetchJson<ValhallaResponse>(
    'routing',
    `${getServiceUrl('routing')}/route`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locations: [
          { lon: from[0], lat: from[1] },
          { lon: to[0], lat: to[1] },
        ],
        costing: options.mode ?? 'motor_scooter',
        directions_type: 'none',
        units: 'kilometers',
      }),
      signal: options.signal,
    },
  );

  // 442/443/171: tidak ada jalur / lokasi di luar data OSM yang dimuat server.
  if (!ok && status === 400) throw new MapServiceError('routing', 'no_route');
  const trip = body?.trip;
  if (!ok || !trip?.summary || !trip.legs?.length) {
    throw new MapServiceError('routing', 'bad_response', `HTTP ${status}`);
  }

  const geometry = trip.legs.flatMap((leg) => (leg.shape ? decodePolyline6(leg.shape) : []));
  return {
    distanceMeters: Math.round((trip.summary.length ?? 0) * 1000),
    durationSeconds: Math.round(trip.summary.time ?? 0),
    geometry,
  } satisfies RouteResult;
};
