import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { GeocodeResult, LngLat, RouteResult } from '@/lib/maps';

type MapSession = {
  /** Posisi user saat ini (diisi layar peta setelah izin lokasi diberikan). */
  origin: LngLat | null;
  setOrigin: (origin: LngLat | null) => void;
  destination: GeocodeResult | null;
  setDestination: (destination: GeocodeResult | null) => void;
  route: RouteResult | null;
  setRoute: (route: RouteResult | null) => void;
  clearTrip: () => void;
};

const MapSessionContext = createContext<MapSession | null>(null);

/** Menyimpan state yang dibagi antara layar peta dan sheet pencarian/rute. */
export function MapSessionProvider({ children }: { children: ReactNode }) {
  const [origin, setOrigin] = useState<LngLat | null>(null);
  const [destination, setDestination] = useState<GeocodeResult | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);

  const value = useMemo<MapSession>(
    () => ({
      origin,
      setOrigin,
      destination,
      setDestination,
      route,
      setRoute,
      clearTrip: () => {
        setDestination(null);
        setRoute(null);
      },
    }),
    [origin, destination, route],
  );

  return <MapSessionContext value={value}>{children}</MapSessionContext>;
}

export function useMapSession(): MapSession {
  const value = useContext(MapSessionContext);
  if (!value) throw new Error('useMapSession harus dipakai di dalam MapSessionProvider');
  return value;
}
