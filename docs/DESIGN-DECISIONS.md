# DUIT! — Dokumen Keputusan Desain

Status: **draf v1 · 2026-10-18** · Belum ada kode untuk bagian marketplace (hanya fitur peta di `mobile/`).
Dokumen ini adalah ringkasan buatan sendiri dari riset (lihat Lampiran) dan keputusan yang sudah diambil bersama pemilik produk. Isinya **bukan nasihat hukum**, dan klaim dari sumber pihak ketiga harus diverifikasi sebelum jadi dasar keputusan bisnis.

Repo ini **publik**: jangan pernah menaruh kunci, token, atau data pengguna di dokumen atau kode.

---

## 1. Produk dalam satu paragraf

DUIT! adalah marketplace micro-task lokal untuk Jakarta. **Poster** memposting tugas kecil berharga rupiah (beli kopi, antar dokumen, bantu setting WiFi). **Doer** dalam radius 5 km menerima, datang ke lokasi, mengerjakan, dan dibayar. Pembeda utama: **keterlacakan**. Setiap tugas punya jejak yang bisa diaudit: kapan berangkat, kapan tiba, foto sebelum dan sesudah, serta posisi selama bekerja.

## 2. Keputusan yang sudah diambil

| # | Keputusan | Catatan |
|---|---|---|
| D1 | Login **Google** | Native sign-in, butuh dev build. Anonymous sign-in hanya untuk prototipe peta dan harus dihapus. |
| D2 | Pembayaran **Midtrans** | Mulai **Sandbox**. |
| D3 | Dana doer disimpan sebagai **saldo di dalam app (dompet)** | **Sandbox saja sampai gerbang legal (bagian 12) lulus.** Lihat risiko R1. |
| D4 | Dana ditahan (escrow) lalu dilepas ke dompet doer setelah **poster konfirmasi**; jika poster diam, **auto-release 6 jam** | Jendela 6 jam pendek, lihat R3. Nilainya dibuat konstanta konfigurasi. |
| D5 | **Foto before dan after wajib** | Before untuk mulai bekerja, after untuk menyelesaikan. |
| D6 | **Background tracking ditunda** | MVP hanya melacak saat app terbuka. |
| D7 | Radius tugas **5 km** dari lokasi tugas | |
| D8 | Pemeringkatan doer **sederhana dulu**, **kNN/ML nanti** | Kumpulkan data sejak awal (bagian 7). |
| D9 | ARIA dan NOVA lewat **OpenRouter**, kunci disimpan server | Kunci diberikan pemilik produk kemudian. |
| D10 | Tidak ada library UI baru; pakai `@expo/ui` + token DUIT | Token: lime `#D4FF3F`, ink `#0E0E10`, paper `#FAF8F3`; font Space Grotesk, Inter, JetBrains Mono. |

## 3. Alur tugas dan state machine

```
awaiting_payment ──bayar settle──▶ posted ──doer terima (atomik)──▶ accepted
        │                            │                                  │
     expired/cancel             expired (tak ada yang ambil)        enroute (live)
                                  → refund                              │
                                                                   arrived  ← foto BEFORE wajib untuk lanjut
                                                                        │
                                                                    working  (ping 5 menit saat app terbuka)
                                                                        │
                                                     submitted  ← foto AFTER wajib; timer 6 jam mulai
                                                       │      │
                                      poster konfirmasi│      │poster sengketa (timer berhenti, dana dibekukan)
                                       atau timer habis│      ▼
                                                       ▼   disputed ──▶ resolved (release / refund / split)
                                                    released  → dana masuk dompet doer → rating
```

Aturan:
- **Perubahan status hanya lewat fungsi database / Edge Function**, tidak pernah `UPDATE` langsung dari app. Setiap transisi menulis baris `task_events` (append-only).
- **Poster membayar penuh dulu** (dana masuk escrow) sebelum tugas terlihat oleh doer. Pola ini sama dengan Upwork (milestone didanai sebelum kerja).
- **Terima tugas harus atomik**: satu `UPDATE ... WHERE status = 'posted'` yang mengikat satu doer. Dua doer tidak bisa mendapat tugas yang sama.
- Tiba divalidasi jarak ke lokasi tugas (usulan ≤ 100 m) atau tombol manual yang ditandai.
- Pembatalan setelah `accepted` belum diputuskan (bagian 14).

## 4. Model data (rancangan)

Semua uang `bigint` rupiah (tanpa desimal). Semua tabel di schema `public` **wajib RLS**, dengan `TO authenticated` dan predikat kepemilikan; UPDATE punya `USING` dan `WITH CHECK`.

| Tabel | Isi utama | Akses |
|---|---|---|
| `profiles` | id (= auth.uid), nama, avatar, rating_avg, completed_count, verified_at | baca publik terbatas; ubah hanya milik sendiri; kolom sensitif tak terekspos (BOPLA) |
| `tasks` | poster_id, doer_id, kategori, tag skill, judul, deskripsi, harga, `geography(Point)` lokasi + GiST, status, timestamps | poster dan doer terkait; tugas `posted` terlihat doer dalam radius via RPC |
| `task_events` | task_id, actor_id, type, payload, at | append-only; baca oleh poster/doer tugas itu |
| `task_locations` | task_id, doer_id, lat, lng, accuracy, mocked, phase, recorded_at | doer insert hanya saat status aktif; baca oleh poster dan doer |
| `task_photos` | task_id, kind (before/after), storage_path, captured_at, lat, lng, mocked | file di Storage privat |
| `payments` | task_id, midtrans_order_id (unik, ≤ 50 karakter), status, gross_amount, raw notifikasi | **hanya server** yang menulis |
| `ledger_entries` | debit_account, credit_account, amount_idr, ref, **idempotency_key (unik)**, created_at | **hanya server** yang menulis; user membaca baris dompetnya sendiri |
| `wallets` | user_id, saldo (cache dari ledger) | baca milik sendiri |
| `payouts` | user_id, amount, status, rekening/e-wallet (terenkripsi atau token), ref Iris | hanya server |
| `ratings` | task_id, rater_id, ratee_id, stars, reasons[], comment, revealed_at | lihat bagian 8 |
| `disputes` | task_id, opened_by, reason, evidence, status, resolution | poster, doer, dan admin |
| `push_tokens` | user_id, expo_token | milik sendiri |
| `ai_usage` | user_id, agent, tokens, at | hanya server (batas per user) |

### Ledger dompet

Saldo adalah turunan dari `ledger_entries`, bukan angka yang diubah bebas. Akun: `gateway_clearing`, `escrow:<task>`, `wallet:<user>`, `platform_revenue`, `payout_pending:<id>`.

1. **Bayar settle**: `gateway_clearing → escrow:<task>` (harga tugas).
2. **Release**: `escrow → wallet:<doer>` (harga − komisi) dan `escrow → platform_revenue` (komisi).
3. **Batal/refund**: `escrow → gateway_clearing`, lalu refund lewat Midtrans.
4. **Tarik saldo**: `wallet:<doer> → payout_pending`, lalu selesai atau gagal sesuai hasil payout.

Invarian: saldo tak boleh negatif; setiap operasi uang punya **idempotency key** supaya retry atau webhook ganda tidak melipatgandakan dana (pola Airbnb "Orpheus", S10b).
Penulisan ledger lewat Edge Function (secret key) atau fungsi di schema yang tidak diekspos dengan pengecekan `auth.uid()`. Jangan memakai `SECURITY DEFINER` di `public` hanya untuk "mengatasi error izin".

## 5. Pembayaran (Midtrans)

- **Snap**: token dibuat **di backend** dengan Server Key; app hanya menerima token. Server Key tidak pernah ada di app (S11b).
- **Webhook**: Edge Function dengan `verify_jwt=false`, lalu **verifikasi di dalam handler**: `signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)`, kemudian konfirmasi lewat GET Status API (S11a, S17). Respons dan retry notifikasi perlu dicek langsung ke dokumentasi (belum terbaca di riset).
- **Siklus status**: tangani `pending`, `settlement`, `expire`, `cancel`, `deny`, dan `refund`. Ada kasus langka settlement berubah menjadi deny (S11c).
- **Cancel** hanya sebelum settlement. **Refund otomatis** hanya untuk kartu, e-wallet, QRIS, ShopeePay, dan Akulaku; metode lain (VA, minimarket) refund diurus sendiri (S11c, S11d). Ini memengaruhi desain "batal setelah bayar".
- **Payout ke doer**: payout standar Midtrans hanya ke rekening merchant sendiri. Membayar pihak ketiga butuh **Disbursement/Iris** yang didaftarkan terpisah (S12b). **Dokumentasi Iris tidak terbaca di riset (S12a), syarat dan biaya belum diketahui.**
- Batas Edge Function: CPU 2 detik per request, memori 256 MB (S17). Jaga handler tetap ringan.
- Sandbox tersedia gratis dengan kartu dan simulator uji (S11e).

## 6. Auto-release 6 jam (D4)

- Timer mulai saat doer menekan "selesai" dengan foto after.
- Poster menerima push; boleh **Konfirmasi**, atau **Sengketa** (menghentikan timer dan membekukan escrow).
- Jika tak ada tindakan sampai 6 jam: sistem rilis otomatis. Nilai `AUTO_RELEASE_HOURS` berupa konfigurasi.
- Pelaksana timer (penjadwal database atau scheduled function) dipilih saat implementasi; **belum diverifikasi**. Harus tahan restart dan idempoten.
- Pembanding riset: Fiverr menutup otomatis setelah 48 jam tanpa respons dan 3 hari setelah pengiriman (S26b); Upwork melepas dana setelah 14 hari (S26c). **6 jam jauh lebih pendek.** Lihat R3.

## 7. Matching dan pemeringkatan

- **Radius 5 km** memakai **PostGIS**: kolom `geography(Point)` + indeks GiST, RPC untuk "tugas terdekat". PostGIS dipasang di schema khusus, urutan koordinat **lng lalu lat** (S18). Kemampuan `ST_DWithin` perlu dicek ke dokumentasi PostGIS karena tidak tampil di halaman Supabase yang terbaca.
- H3 yang dipakai fitur peta tidak diperlukan untuk matching 5 km. Untuk update posisi per sel, pertimbangkan lagi nanti.
- **Penawaran terarah, bukan broadcast.** Gojek meninggalkan broadcast karena hasilnya ditentukan kecepatan perangkat dan banyak order tak terisi (S28a). Uber memproses batch beberapa detik, bukan "siapa cepat dia dapat" (S9b).
- **Peringkat MVP**: jarak rute (Valhalla), rating, completion rate. Grab dan Gojek memakai rating dan completion rate sebagai prioritas (S4, S28b).
- Batas waktu penawaran dan jumlah kandidat belum diputuskan.
- **kNN nanti**: menilai kemiripan skill dengan orang yang pernah menyelesaikan tugas serupa. Persyaratan saat ini: **kumpulkan data** kategori, tag skill, hasil akhir, rating, hasil review foto. Opsi pgvector: pada data kecil pencarian eksak sudah cukup; filter `WHERE` pada indeks approximate bisa mengembalikan hasil kurang dari `LIMIT` (S29).
- Koreksi: nama "Jaeger" untuk sistem alokasi Gojek **tidak ditemukan di sumber publik** (S28a). Jangan dianggap fakta.

## 8. Rating dan kepercayaan

- Rating dua arah **double-blind**: terbuka setelah kedua pihak mengirim (eksperimen Airbnb: ulasan naik, balas-dendam turun, rating sedikit turun; S27).
- Rating terstruktur: alasan per jumlah bintang plus teks bebas; **wajib untuk akun baru/berisiko, opsional untuk akun mapan** (S28b).
- Batas klaim berwaktu dan bukti foto, plus pembayaran hanya in-app (pola TaskRabbit; S26a).
- Resolusi sengketa dilakukan manusia (admin) di MVP.

## 9. Pelacakan lokasi dan bukti foto

**MVP tanpa background tracking (D6):**

| Fase | Lokasi |
|---|---|
| `enroute` | live selama app terbuka (foreground) |
| `arrived` | live berhenti; foto BEFORE |
| `working` | ping tiap 5 menit **selama app terbuka**; jika tak terkirim, tercatat event `no_signal` (bukan dianggap curang) |
| `submitted` | foto AFTER |

**Foto bukti:**
- Ambil dari **kamera dalam app** (`CameraView` atau `launchCameraAsync`), **bukan galeri** (S21a, S21b).
- EXIF kamera iOS **tidak memuat GPS dan bisa dipalsukan**; karena itu lokasi dan waktu diambil dari fix perangkat saat foto diambil dan dicatat server dengan timestamp server (S21b, S36b).
- Simpan `mocked` dari `expo-location` sebagai **sinyal, bukan bukti** (S21c).
- URI foto sementara harus disalin; di Android aktivitas bisa dimatikan saat kamera, pulihkan dengan `getPendingResultAsync` (S21a, S21b).
- Storage **privat**, RLS per folder pengguna, **signed URL berumur pendek** (tidak bisa dicabut; S16).
- Foto wajah bisa tergolong data biometrik (UU PDP; S14): persetujuan eksplisit dan terpisah.
- Deteksi foto dipakai ulang (pHash/dHash) dan deteksi mock location lanjutan **belum diriset** (item 42–43).

**Background tracking nanti:** perlu dev build, `startLocationUpdatesAsync` + TaskManager (task didefinisikan di global scope), persetujuan Play Console untuk izin lokasi background, batas geofence 100 (Android) dan 20 (iOS) (S21c, S21d).

## 10. Login Google (D1)

- Native sign-in dengan `@react-native-google-signin/google-signin` atau `react-native-nitro-google-signin`; **tidak jalan di Expo Go** (S22a, S22b).
- Ke Supabase lewat `signInWithIdToken` dengan **nonce** (SHA-256); client ID dipisah koma dan **web client ID pertama** (S15a).
- SHA-1 Android harus dari **App signing key** di Play Console, bukan upload key, agar jalan di build EAS/Play (S22a, S37b).
- Quickstart Supabase untuk Expo tidak membahas library native tersebut (S15b), jadi pakai kombinasi dokumentasi Expo + Supabase.
- Pemilik produk perlu membuat proyek dan OAuth client di Google Cloud; langkahnya dipandu saat implementasi.
- Profil dibuat saat login pertama. Anonymous sign-in prototipe peta dihapus.

## 11. ARIA dan NOVA (OpenRouter, D9)

- **Kunci OpenRouter tidak boleh ada di app.** Semua variabel `EXPO_PUBLIC_*` terbaca publik (S23a, S24).
- Semua panggilan lewat **Edge Function** yang: wajib autentikasi, membatasi pemakaian per user (token/hari), memeriksa kepemilikan resource, baru menempelkan kunci (S24). Kunci diatur dengan `supabase secrets set`; **jangan dikirim lewat chat atau di-commit**.
- Keluaran model diperlakukan sebagai **data tak tepercaya**: divalidasi skema (mis. zod) dan **dikonfirmasi pengguna** sebelum memposting tugas atau mengubah apa pun.
- Fallback offline sudah ada di prototipe web; pertahankan perilaku itu.
- Pilihan model dan anggaran biaya ditentukan saat implementasi.

## 12. Gerbang legal dan kepatuhan (sebelum uang sungguhan)

> **R1 — dompet dan izin.** Menurut ringkasan riset (S13a), menyimpan atau menatausahakan dana pengguna masuk izin penyelenggara jasa pembayaran **kategori 1** (modal disetor minimum Rp15 miliar, wajib PT) berdasarkan PBI 23/6/2021. **Belum diverifikasi ke teks peraturan dan bukan nasihat hukum.** Pengecualian (mis. closed-loop) dan struktur "escrow lewat gateway berizin" belum jelas.

Syarat **sebelum go-live dengan uang sungguhan**:
1. Konsultasi hukum tentang struktur dompet dan escrow (izin sendiri, kemitraan dengan PJP berlisensi, atau desain tanpa penyimpanan dana).
2. Aktivasi Midtrans produksi dan **Iris** (syarat dan biaya dibuka manual oleh pemilik produk karena dokumentasinya tak terbaca).
3. UU PDP: persetujuan eksplisit dan terpisah untuk lokasi, foto, dan biometrik; kebijakan retensi dan penghapusan; DPIA bila skala besar; prosedur notifikasi insiden ≤ 3×24 jam (S14).
4. Kebijakan Google Play: izin lokasi dan kamera, formulir Data Safety (**belum diriset**, item 40).
5. Kebijakan privasi dan syarat layanan (**belum diriset**, item 41).
6. eKYC untuk doer (KTP + selfie/liveness): kandidat VIDA, GLAIR, Verihubs; klaim sertifikasi adalah klaim vendor, harga belum diketahui (S35a–c).

Selama gerbang ini belum lulus: **Midtrans Sandbox saja, tanpa uang nyata.**

## 13. Keamanan dan tata kelola repo (tahap 0)

Pemetaan risiko OWASP (S23a, S23b):
- **API1 BOLA, API3 BOPLA**: dijawab RLS per baris dan per kolom; uji dengan akun kedua.
- **API4, API6**: batas laju untuk posting tugas, klaim, dan panggilan AI.
- **M1**: tidak ada rahasia di bundle; **M6**: minimalkan PII lokasi, hapus berkala, opt-in, tanpa PII di log atau URL.

Daftar tahap 0:
- Secret scanning: **gitleaks** di pre-commit (Husky) dan CI dengan baseline. README gitleaks menyebut proyek "feature complete" dan pengelolanya pindah fokus, jadi **evaluasi alternatif** (S25).
- **Dependabot** + OSV-Scanner; **CodeQL**. Jangan jalankan `npm audit fix --force` (saran otomatisnya menurunkan versi).
- CI: `tsc --noEmit`, lint.
- **pgTAP** untuk RLS dengan **positive control** (nol baris bisa berarti fixture rusak), cek kode `42501`, kasus: tanpa login, pemilik, akun kedua, ubah `driver_id`/`owner`, Storage (S19, S20). `supabase db advisors` sebelum membuat migrasi.
- Pengaturan GitHub yang dilakukan pemilik repo: secret scanning + push protection, branch protection untuk `main`.
- Edge Function: JWT diverifikasi kecuali webhook; secrets lewat CLI/dashboard.
- Expo: `testID` pada elemen penting agar tes Maestro stabil (S39).

## 14. Struktur kode (usulan)

```
mobile/src/
  app/                     rute saja (tanpa komponen/util di sini)
  features/{tasks,payments,wallet,ratings,ai,auth}/   komponen, hook, api per fitur
  lib/{maps,location,supabase}/                        sudah ada
mobile/supabase/
  migrations/  functions/{midtrans-webhook,ai-proxy,release-timer}/  tests/ (pgTAP)
docs/
```

## 15. Desain dan UX

- Pakai token DUIT di `constants/theme.ts`; **jangan tambah library UI** (S30–S31 sebagai inspirasi saja).
- Label tab spesifik dan pendek, hindari "Home" generik; 3–5 tab (HIG, S33b). Tab bawaan template (Home, Explore) harus diganti.
- Minta izin lokasi dan kamera **saat fiturnya dipakai**, dengan satu kalimat alasan yang spesifik (HIG, S33a).
- Layar dompet dan payout: gaya jernih dan ramah, rujukan analisis gaya Wise (S31d). Analisis gaya Uber/Airbnb di S31b dan S31c bersifat independen, bukan resmi.
- Untuk web nanti: shadcn/ui bila landing page pindah dari HTML polos.

## 16. Peta jalan

| Tahap | Isi | Selesai bila |
|---|---|---|
| 0 | Pagar keamanan + struktur (bagian 13–14) | CI hijau, secret scan aktif, tes RLS `driver_locations` |
| 1 | Login Google, `profiles`, tabel marketplace + RLS + state machine RPC | tes pgTAP lulus |
| 2 | Posting tugas, daftar tugas dalam 5 km, terima atomik | dua akun tak bisa menerima tugas sama |
| 3 | Pelacakan (berangkat, tiba, ping) + foto before/after | alur lengkap di dua perangkat |
| 4 | Bayar (Midtrans Sandbox): escrow, webhook, ledger, dompet, release + auto-release | ledger seimbang, idempotensi teruji |
| 5 | Rating double-blind + sengketa dasar | |
| 6 | ARIA/NOVA via Edge Function | kunci hanya di server, batas per user |
| 7 | Pencairan saldo (Iris) | **hanya setelah gerbang legal (bagian 12)** |

Kode peta yang ada di `mobile/` (`driver_locations`, mode driver, anonymous sign-in) adalah prototipe: **tabel `driver_locations` akan digantikan `task_locations`.** Layar dan service peta (`lib/maps`) tetap dipakai.

## 17. Risiko dan pertanyaan terbuka

**Risiko**
- **R1** Dompet berpotensi butuh izin PJP; belum diverifikasi (bagian 12).
- **R2** Dokumentasi Iris tidak terbaca; syarat dan biaya payout tak diketahui.
- **R3** Jendela konfirmasi **6 jam sangat pendek**: poster yang tidur, sibuk, atau tidak membuka app bisa kehilangan hak sengketanya. Mitigasi yang disarankan (menunggu keputusan): push pengingat, sengketa membekukan timer, jam tenang yang tidak dihitung, atau jendela lebih panjang untuk tugas bernilai besar.
- **R4** Tanpa background tracking, bukti lokasi hanya selama app terbuka; keandalan bukti bertumpu pada foto.
- **R5** Foto wajah/KTP berpotensi data biometrik (UU PDP).
- **R6** Refund otomatis hanya untuk sebagian metode bayar.

**Belum diputuskan**
1. Besar komisi dan biaya layanan (prototipe web memakai 5% dibayar poster; komisi doer belum ada).
2. Pembatalan oleh poster setelah `accepted`, dan oleh doer sebelum `arrived`.
3. Batas waktu penawaran ke doer dan jumlah kandidat per putaran.
4. Siapa yang menyelesaikan sengketa (admin) dan dalam berapa lama.
5. Harga minimum dan maksimum tugas (prototipe: Rp15.000 sampai Rp200.000).
6. Android dulu atau iOS juga (build iOS ke perangkat butuh akun Apple Developer berbayar).
7. Ambang tiba (usulan 100 m) dan perilaku bila GPS lemah di dalam gedung.

---

## Lampiran: sumber riset

Riset dikumpulkan 2026-10-18 (71 sumber: 64 terbaca, 7 gagal). Ringkasan di atas dibuat dengan kata-kata sendiri dari sumber berikut.

**Berhasil dibaca**

| ID | Sumber |
|---|---|
| S3 | https://www.grab.com/inside-grab/how-does-grab-match-trips-and-orders-to-driver-and-delivery-partners/ |
| S4 | https://www.grab.com/inside-grab/stories/principles-that-shape-the-design-of-our-marketplace/ |
| S6 | https://dev.to/gargkunal/how-uber-finds-you-a-driver-in-3-seconds-system-design-teardown-1phf (tak resmi) |
| S9b | https://www.uber.com/us/en/marketplace/matching/ |
| S10b | https://medium.com/airbnb-engineering/avoiding-double-payments-in-a-distributed-payments-system-2981f6b070bb |
| S11a | https://docs.midtrans.com/docs/https-notification-webhooks |
| S11b | https://docs.midtrans.com/docs/snap-snap-integration-guide |
| S11c | https://docs.midtrans.com/docs/transaction-status-cycle |
| S11d | https://docs.midtrans.com/docs/how-can-i-refund-transaction |
| S11e | https://docs.midtrans.com/docs/testing-payment-on-sandbox |
| S12b | https://docs.midtrans.com/docs/disbursement-1 |
| S13a | https://www.bi.go.id/id/publikasi/peraturan/Pages/PBI_230621.aspx |
| S14 | https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022 |
| S15a | https://supabase.com/docs/guides/auth/social-login/auth-google?platform=react-native |
| S15b | https://supabase.com/docs/guides/auth/quickstarts/with-expo-react-native-social-auth |
| S16 | https://supabase.com/docs/guides/storage/security/access-control |
| S17 | https://supabase.com/docs/guides/functions/auth |
| S18 | https://supabase.com/docs/guides/database/extensions/postgis |
| S19 | https://supabase.com/docs/guides/local-development/testing/overview |
| S20 | https://axonbuild.com/blog/how-to-test-supabase-rls/ (blog vendor) |
| S21a–d | https://docs.expo.dev/versions/latest/sdk/{camera,imagepicker,location,task-manager}/ |
| S22a | https://docs.expo.dev/guides/google-authentication/ |
| S22b | https://react-native-google-signin.github.io/docs/setting-up/expo |
| S23a | https://owasp.org/www-project-mobile-top-10/ |
| S23b | https://owasp.org/API-Security/editions/2023/en/0x11-t10/ |
| S24 | https://dev.to/backmesh/openai-api-key-safety-and-mistakes-in-client-side-code-3k2j |
| S25 | https://github.com/gitleaks/gitleaks |
| S26a | https://support.taskrabbit.com/hc/articles/360035570011 |
| S26b | https://help.fiverr.com/hc/en-us/articles/37332569612049-Using-the-Resolution-Center |
| S26c | https://support.upwork.com/hc/en-us/articles/211063748 |
| S27 | https://papers.ssrn.com/abstract=2939064 (hanya abstrak) |
| S28a | https://blog.gojek.io/how-gojek-manages-1-million-drivers-with-12-engineers-part-2-2 |
| S28b | https://blog.gojek.io/how-we-do-driver-ratings-at-go-jek |
| S29 | https://github.com/pgvector/pgvector |
| S30 | https://github.com/alexpate/awesome-design-systems |
| S31b–d | https://getdesign.md/design-md/{uber,airbnb,wise}/preview.html (analisis independen) |
| S33a–b | Apple Human Interface Guidelines (Accessing private data; Tab bars) |
| S35a–c | https://docs.vida.id/..., https://glair.ai/ekyc, https://verihubs.com/en/uses/customer-onboarding/ |
| S36b | https://www.clappia.com/blog/capture-gps-location-timestamp-photos (blog vendor) |
| S37a–b | https://docs.expo.dev/push-notifications/{push-notifications-setup,fcm-credentials}/ |
| S39 | https://docs.maestro.dev/platform-support/react-native |

**Gagal dibaca**: blog Gojek bagian 1 dan artikel ML matching (kode akses), dokumentasi Midtrans Iris (robots), BI Bicara (login), TaskRabbit support (JavaScript), Material Design 3 (JavaScript), listing App Store Gojek.

**Belum diriset**: Google Play Developer Policy (40), contoh kebijakan privasi dan ToS (41), deteksi mock location (42), pHash (43), pencegahan kolusi (44), cold start (45), komisi dan harga (46).
