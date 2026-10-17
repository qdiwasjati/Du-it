import { Marker } from '@maplibre/maplibre-react-native';
import { StyleSheet, Text, View } from 'react-native';

import type { LngLat } from '@/lib/maps';
import type { DriverLocation } from '@/lib/supabase/driver-locations';

export function DriverMarker({ driver }: { driver: DriverLocation }) {
  return (
    <Marker id={`driver-${driver.driverId}`} lngLat={driver.coordinate}>
      <View style={styles.driver} accessibilityLabel="Driver">
        <Text style={[styles.emoji, driver.heading !== null && { transform: [{ rotate: `${driver.heading}deg` }] }]}>
          🛵
        </Text>
      </View>
    </Marker>
  );
}

export function DestinationMarker({ coordinate }: { coordinate: LngLat }) {
  return (
    <Marker id="destination" lngLat={coordinate} anchor="bottom">
      <View style={styles.pin} accessibilityLabel="Tujuan">
        <View style={styles.pinDot} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  driver: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D4FF3F',
    borderWidth: 2,
    borderColor: '#0E0E10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 20 },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderBottomLeftRadius: 2,
    backgroundColor: '#0E0E10',
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D4FF3F' },
});
