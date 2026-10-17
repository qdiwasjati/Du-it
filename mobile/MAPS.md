# DUIT! Mobile - fitur peta

Peta, pencarian alamat, rute + ETA, dan lokasi driver real-time.
Butuh **development build** (MapLibre adalah native module, tidak jalan di Expo Go).

## Arsitektur

| Bagian | Lokasi |
| --- | --- |
| Service peta (ganti engine cukup di sini) | `src/lib/maps/` - `geocode` (Photon), `route` + `mapMatch` (Valhalla), kontrak `MapsService` di `types.ts`, objek `maps` di `index.ts` |
| Izin & GPS | `src/lib/location/` |
| Supabase + lokasi driver + H3 | `src/lib/supabase/`, `src/hooks/use-nearby-drivers.ts` |
| UI peta | `src/components/map/` |
| Layar | `src/app/map/` (`index`, `search`, `route`, `driver-mode`) |
| Skema DB | `supabase/migrations/20261017000000_driver_locations.sql` |

## Setup

1. `cd mobile && npm install`
2. `cp .env.example .env` lalu isi:
   - `EXPO_PUBLIC_MAP_STYLE_URL`, `EXPO_PUBLIC_GEOCODER_URL`, `EXPO_PUBLIC_ROUTING_URL` -> **IP LAN PC** (bukan `localhost`; Windows: `ipconfig`), port sesuai doit-maps-server. Style harus berupa MapLibre style JSON yang menunjuk ke tile PMTiles lokal.
   - `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (hanya anon/publishable key, jangan service_role).
3. Supabase:
   - Jalankan isi file migrasi di SQL Editor (atau `supabase db push`).
   - **Authentication -> Providers -> Anonymous sign-ins: aktifkan.** MVP belum punya layar login; tiap perangkat masuk sebagai user anonim sehingga RLS `driver_id = auth.uid()` tetap berlaku.
4. Firewall PC: port 8002/8003/8004 harus terbuka untuk jaringan lokal (lihat README doit-maps-server).

## Build development client

```bash
# Lokal (butuh Android Studio / Xcode di mesin build)
npx expo run:android          # atau: npx expo run:ios (macOS)

# Atau lewat EAS (cloud)
npm i -g eas-cli && eas login
eas build --profile development --platform android      # APK, install di HP
eas build --profile development-simulator --platform ios # simulator iOS
```

Setelah dev build terpasang: `npx expo start --dev-client`, scan QR / buka dari app DUIT!.
Ubah `.env` -> restart Metro dengan `npx expo start --dev-client -c`.

> `bundleIdentifier` / `package` diset `com.duitapp.mobile` di `app.json`. Ganti sebelum build pertama bila perlu - mengubahnya setelah rilis berarti app baru.

## Cara test di device

Siapkan 2 perangkat (atau 1 HP + 1 emulator) agar bisa menguji driver <-> user.

1. **Peta + lokasi**: buka tab Peta, izinkan lokasi. Titik biru muncul dan kamera zoom ke posisimu.
2. **Cari alamat**: ketuk "Mau ke mana?", ketik `Monas Jakarta`, pilih hasil.
3. **Rute**: sheet menampilkan jarak + ETA, garis lime tergambar di peta. "Hapus rute" mengosongkan.
4. **Driver real-time**: di perangkat A buka tombol 🛵 -> nyalakan switch. Di perangkat B (tab Peta, dalam radius 2 km) marker 🛵 muncul dan bergerak tiap ~3 detik. Matikan switch -> marker hilang.
5. **Server mati**: matikan doit-maps-server (atau pindah Wi-Fi). Buka ulang tab Peta -> kartu "Server peta tidak aktif" + tombol Coba lagi; pencarian/rute menampilkan pesan serupa. App tidak crash.
6. **Izin lokasi**: Pengaturan -> tolak izin -> app menampilkan kartu "Izinkan lokasi"/"Buka Pengaturan"; peta tetap tampil di Jakarta. Matikan GPS -> pesan "Layanan lokasi mati".

## Batasan MVP (sengaja)

- **Foreground only**: lokasi driver hanya terkirim saat app terbuka. Background tracking butuh izin "always" + foreground service/background task (belum dibuat).
- **Tanpa login/role**: siapa pun yang membuka Mode Driver bisa mengirim lokasi. Pembedaan driver/user menunggu sistem auth + profil.
- **Realtime `postgres_changes`** mengevaluasi RLS per subscriber; cukup untuk puluhan driver. Untuk skala besar pindah ke Realtime Broadcast per sel H3.
- **Native only**: `expo start --web` tidak didukung untuk layar peta (MapLibre RN).
- ETA dari Valhalla tanpa data kemacetan langsung.
- `h3_index` dihitung di client; server tidak memvalidasi kecocokannya dengan lat/lng.
