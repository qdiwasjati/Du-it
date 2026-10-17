import { Stack } from 'expo-router';

import { MapSessionProvider } from '@/components/map/map-session';

export default function MapLayout() {
  return (
    <MapSessionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="search"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.6, 1],
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="route"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.36],
            sheetGrabberVisible: true,
            // Peta di belakang sheet tetap bisa digeser/zoom.
            sheetLargestUndimmedDetentIndex: 'last',
          }}
        />
        <Stack.Screen
          name="driver-mode"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.55],
            sheetGrabberVisible: true,
          }}
        />
      </Stack>
    </MapSessionProvider>
  );
}
