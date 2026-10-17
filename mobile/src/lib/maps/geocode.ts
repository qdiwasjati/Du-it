import { getServiceUrl } from './config';
import { fetchJson } from './http';
import { MapServiceError, type GeocodeResult, type MapsService } from './types';

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    locality?: string;
    city?: string;
    state?: string;
  };
};

type PhotonResponse = { features?: PhotonFeature[] };

function toResult(feature: PhotonFeature, index: number): GeocodeResult | null {
  const coords = feature.geometry?.coordinates;
  const props = feature.properties;
  if (!coords || coords.length < 2 || !props) return null;

  const street = [props.street, props.housenumber].filter(Boolean).join(' ');
  const name = props.name ?? (street || props.district || props.city || 'Lokasi');
  const address = [street && street !== name ? street : null, props.district ?? props.locality, props.city, props.state]
    .filter((part, i, all) => part && part !== name && all.indexOf(part) === i)
    .join(', ');

  return {
    id: `${props.osm_type ?? 'x'}${props.osm_id ?? index}`,
    name,
    address,
    coordinate: [coords[0], coords[1]],
  };
}

/** Photon: GET /api?q=...  (https://github.com/komoot/photon) */
export const geocode: MapsService['geocode'] = async (query, options = {}) => {
  const q = query.trim();
  if (q.length === 0) return [];

  const params = new URLSearchParams({ q, limit: String(options.limit ?? 6) });
  if (options.near) {
    const [lon, lat] = options.near;
    params.set('lon', String(lon));
    params.set('lat', String(lat));
  }

  const { ok, body } = await fetchJson<PhotonResponse>(
    'geocoder',
    `${getServiceUrl('geocoder')}/api?${params.toString()}`,
    { signal: options.signal },
  );
  if (!ok || !body || !Array.isArray(body.features)) {
    throw new MapServiceError('geocoder', 'bad_response');
  }

  return body.features
    .map(toResult)
    .filter((r): r is GeocodeResult => r !== null);
};
