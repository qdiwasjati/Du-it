import { geocode } from './geocode';
import { mapMatch } from './map-match';
import { route } from './route';
import type { MapsService } from './types';

/**
 * Satu-satunya pintu masuk yang dipakai UI. Untuk ganti engine (mis. Mapbox/Google),
 * cukup sediakan implementasi MapsService baru dan ganti objek ini.
 */
export const maps: MapsService = { geocode, route, mapMatch };

export { checkMapStyle } from './style';
export { formatDistance, formatDuration } from './format';
export { isAbortError } from './http';
export { boundsOf, distanceMeters } from './geo';
export * from './types';
