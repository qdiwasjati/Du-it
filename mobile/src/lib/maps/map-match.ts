import { getServiceUrl } from './config';
import { fetchJson } from './http';
import { decodePolyline6 } from './polyline';
import { MapServiceError, type MapMatchResult, type MapsService } from './types';

type ValhallaTraceResponse = {
  trip?: { summary?: { length?: number }; legs?: { shape?: string }[] };
};

/** Valhalla: POST /trace_route dengan shape_match=map_snap - snap jejak GPS ke jaringan jalan. */
export const mapMatch: MapsService['mapMatch'] = async (points, options = {}) => {
  if (points.length < 2) throw new MapServiceError('routing', 'no_route');

  const { ok, status, body } = await fetchJson<ValhallaTraceResponse>(
    'routing',
    `${getServiceUrl('routing')}/trace_route`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shape: points.map((p) => ({
          lon: p.coordinate[0],
          lat: p.coordinate[1],
          ...(p.timestamp !== undefined ? { time: p.timestamp } : {}),
        })),
        costing: options.mode ?? 'motor_scooter',
        shape_match: 'map_snap',
        directions_type: 'none',
        units: 'kilometers',
      }),
      signal: options.signal,
    },
  );

  if (!ok && status === 400) throw new MapServiceError('routing', 'no_route');
  const trip = body?.trip;
  if (!ok || !trip?.legs?.length) {
    throw new MapServiceError('routing', 'bad_response', `HTTP ${status}`);
  }

  return {
    geometry: trip.legs.flatMap((leg) => (leg.shape ? decodePolyline6(leg.shape) : [])),
    distanceMeters: Math.round((trip.summary?.length ?? 0) * 1000),
  } satisfies MapMatchResult;
};
