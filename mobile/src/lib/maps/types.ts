/** [longitude, latitude] - urutan sama dengan GeoJSON dan MapLibre. */
export type LngLat = [longitude: number, latitude: number];

export type TravelMode = 'motor_scooter' | 'auto' | 'bicycle' | 'pedestrian';

export type GeocodeResult = {
  id: string;
  name: string;
  address: string;
  coordinate: LngLat;
};

export type RouteResult = {
  distanceMeters: number;
  durationSeconds: number;
  /** Titik-titik polyline rute, urutan [lng, lat]. */
  geometry: LngLat[];
};

export type MapMatchResult = {
  /** Jejak yang sudah di-snap ke jalan. */
  geometry: LngLat[];
  distanceMeters: number;
};

export type GpsPoint = {
  coordinate: LngLat;
  /** Epoch detik (opsional, membantu akurasi map matching). */
  timestamp?: number;
};

export type MapServiceName = 'tiles' | 'geocoder' | 'routing';

export type MapServiceErrorCode =
  | 'not_configured'
  | 'offline'
  | 'timeout'
  | 'no_route'
  | 'bad_response';

export class MapServiceError extends Error {
  readonly service: MapServiceName;
  readonly code: MapServiceErrorCode;

  constructor(service: MapServiceName, code: MapServiceErrorCode, detail?: string) {
    super(describeMapServiceError(service, code, detail));
    this.name = 'MapServiceError';
    this.service = service;
    this.code = code;
  }

  /** True bila penyebabnya server peta tidak terjangkau (PC mati / beda Wi-Fi). */
  get isServerDown(): boolean {
    return this.code === 'offline' || this.code === 'timeout';
  }
}

const SERVICE_LABEL: Record<MapServiceName, string> = {
  tiles: 'Server peta',
  geocoder: 'Server pencarian alamat',
  routing: 'Server rute',
};

function describeMapServiceError(
  service: MapServiceName,
  code: MapServiceErrorCode,
  detail?: string,
): string {
  const label = SERVICE_LABEL[service];
  switch (code) {
    case 'not_configured':
      return `${label} belum dikonfigurasi${detail ? ` (${detail})` : ''}. Isi file .env lalu restart app.`;
    case 'offline':
    case 'timeout':
      return `${label} tidak bisa dihubungi. Pastikan PC server peta menyala dan HP satu Wi-Fi dengan PC.`;
    case 'no_route':
      return 'Rute tidak ditemukan antara dua titik ini.';
    case 'bad_response':
      return `${label} memberi respons yang tidak valid${detail ? ` (${detail})` : ''}.`;
  }
}

export function isMapServiceError(error: unknown): error is MapServiceError {
  return error instanceof MapServiceError;
}

/** Kontrak yang harus dipenuhi engine peta apa pun (Photon+Valhalla sekarang, bisa diganti). */
export interface MapsService {
  geocode(query: string, options?: { limit?: number; near?: LngLat; signal?: AbortSignal }): Promise<GeocodeResult[]>;
  route(from: LngLat, to: LngLat, options?: { mode?: TravelMode; signal?: AbortSignal }): Promise<RouteResult>;
  mapMatch(points: GpsPoint[], options?: { mode?: TravelMode; signal?: AbortSignal }): Promise<MapMatchResult>;
}
