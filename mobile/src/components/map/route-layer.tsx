import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { useMemo } from 'react';

import type { LngLat } from '@/lib/maps';

/** Garis rute di atas peta: casing gelap + garis lime supaya terbaca di style terang/gelap. */
export function RouteLine({ geometry }: { geometry: LngLat[] }) {
  const data = useMemo<GeoJSON.Feature<GeoJSON.LineString>>(
    () => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: geometry } }),
    [geometry],
  );

  return (
    <GeoJSONSource id="route" data={data}>
      <Layer
        id="route-casing"
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{ 'line-color': '#0E0E10', 'line-width': 9 }}
      />
      <Layer
        id="route-line"
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{ 'line-color': '#D4FF3F', 'line-width': 5 }}
      />
    </GeoJSONSource>
  );
}
