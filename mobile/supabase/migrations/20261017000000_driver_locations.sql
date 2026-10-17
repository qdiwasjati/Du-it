-- driver_locations: satu baris per driver, di-upsert tiap beberapa detik.
-- Dibaca user lewat Supabase Realtime (postgres_changes).

create table public.driver_locations (
  driver_id  uuid primary key references auth.users (id) on delete cascade,
  lat        double precision not null check (lat between -90 and 90),
  lng        double precision not null check (lng between -180 and 180),
  heading    real check (heading is null or (heading >= 0 and heading < 360)),
  h3_index   text not null,                       -- H3 resolusi 9 (hexagon ~0.1 km2), dihitung di client
  updated_at timestamptz not null default now()
);

-- Query matching: h3_index = ANY(cells) AND updated_at > cutoff.
-- Kolom equality dulu, kolom range terakhir (query-composite-indexes).
-- driver_id sudah terindeks lewat primary key (dipakai policy RLS & upsert).
create index driver_locations_h3_updated_idx
  on public.driver_locations (h3_index, updated_at);

-- updated_at dipaksa dari server supaya client tidak bisa memalsukan kesegaran lokasi.
create function public.set_driver_location_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger driver_locations_set_updated_at
  before insert or update on public.driver_locations
  for each row execute function public.set_driver_location_updated_at();

alter table public.driver_locations enable row level security;

-- Akses tabel eksplisit (Data API bisa saja tidak auto-expose tabel baru). anon tidak diberi apa pun.
revoke all on public.driver_locations from anon;
grant select, insert, update, delete on public.driver_locations to authenticated;

-- Baca: lokasi milik sendiri (selalu) + driver lain yang aktif dalam 2 menit terakhir.
-- Klausa "milik sendiri" wajib: upsert/UPDATE butuh SELECT policy pada baris lama,
-- jadi tanpa itu driver yang sempat idle >2 menit tidak bisa lagi meng-update barisnya.
create policy "driver_locations_select_active_or_own"
  on public.driver_locations
  for select
  to authenticated
  using (
    driver_id = (select auth.uid())
    or updated_at > now() - interval '2 minutes'
  );

create policy "driver_locations_insert_own"
  on public.driver_locations
  for insert
  to authenticated
  with check (driver_id = (select auth.uid()));

create policy "driver_locations_update_own"
  on public.driver_locations
  for update
  to authenticated
  using (driver_id = (select auth.uid()))
  with check (driver_id = (select auth.uid()));

create policy "driver_locations_delete_own"
  on public.driver_locations
  for delete
  to authenticated
  using (driver_id = (select auth.uid()));

alter publication supabase_realtime add table public.driver_locations;
