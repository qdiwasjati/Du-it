-- Inti marketplace DUIT!: profil, tugas, jejak event, dan RPC posting / daftar terdekat / terima / batal.
-- Aturan: klien TIDAK menulis langsung ke tasks / task_events; semua perubahan lewat fungsi di bawah.
-- Lihat docs/DESIGN-DECISIONS.md (bagian 3, 4, 7).

create extension if not exists postgis with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Fungsi pembantu (schema private: tidak terekspos lewat API)
-- ---------------------------------------------------------------------------

create function private.touch_updated_at()
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

create function private.forbid_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'tabel % bersifat append-only', tg_table_name using errcode = '55000';
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  display_name    text not null check (char_length(display_name) between 1 and 60),
  avatar_url      text check (avatar_url is null or avatar_url ~ '^https://'),
  rating_avg      numeric(3,2) not null default 0 check (rating_avg between 0 and 5),
  rating_count    integer not null default 0 check (rating_count >= 0),
  completed_count integer not null default 0 check (completed_count >= 0),
  created_at      timestamptz not null default now()
);

-- Profil dibuat otomatis saat user pertama login. raw_user_meta_data bisa diubah user:
-- dipakai HANYA untuk nama tampilan, tidak pernah untuk otorisasi.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  v_name := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Pengguna'
    ),
    60
  );

  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    v_name,
    case when new.raw_user_meta_data ->> 'avatar_url' ~ '^https://'
         then new.raw_user_meta_data ->> 'avatar_url' end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;

-- (policy SELECT profiles dibuat setelah tabel tasks, karena merujuknya)

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------

create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  poster_id     uuid not null references public.profiles (id) on delete restrict,
  doer_id       uuid references public.profiles (id) on delete restrict,
  category      text not null check (category in ('errand', 'delivery', 'help', 'other')),
  skill_tags    text[] not null default '{}' check (cardinality(skill_tags) <= 8),
  title         text not null check (char_length(title) between 3 and 120),
  description   text not null default '' check (char_length(description) <= 2000),
  price_idr     integer not null check (price_idr between 15000 and 200000),
  urgent        boolean not null default false,
  location      extensions.geography(Point, 4326) not null,
  address_text  text not null check (char_length(address_text) between 1 and 200),
  payment_mode  text not null default 'offline' check (payment_mode in ('offline', 'escrow')),
  status        text not null default 'posted' check (status in (
                  'awaiting_payment', 'posted', 'accepted', 'enroute', 'arrived',
                  'working', 'submitted', 'released', 'disputed', 'cancelled', 'expired')),
  accepted_at   timestamptz,
  enroute_at    timestamptz,
  arrived_at    timestamptz,
  working_at    timestamptz,
  submitted_at  timestamptz,
  released_at   timestamptz,
  cancelled_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint tasks_doer_is_not_poster check (doer_id is null or doer_id <> poster_id)
);

-- Pencarian radius hanya menyentuh tugas yang masih 'posted'.
create index tasks_posted_location_gix on public.tasks using gist (location) where status = 'posted';
-- Indeks FK (juga dipakai predikat RLS).
create index tasks_poster_id_idx on public.tasks (poster_id);
create index tasks_doer_id_idx on public.tasks (doer_id) where doer_id is not null;

create trigger tasks_touch_updated_at
  before update on public.tasks
  for each row execute function private.touch_updated_at();

alter table public.tasks enable row level security;

-- Profil: diri sendiri dan lawan transaksi pada tugas yang sama.
create policy profiles_select_self_or_counterpart on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.tasks t
      where (t.poster_id = profiles.id and t.doer_id = (select auth.uid()))
         or (t.doer_id = profiles.id and t.poster_id = (select auth.uid()))
    )
  );

-- Lokasi tepat hanya terlihat poster dan doer. Doer lain memakai nearby_tasks() (koordinat dikaburkan).
-- Tidak ada policy INSERT/UPDATE/DELETE: semua perubahan lewat RPC.
create policy tasks_select_participants on public.tasks
  for select to authenticated
  using (poster_id = (select auth.uid()) or doer_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- task_events (append-only)
-- ---------------------------------------------------------------------------

create table public.task_events (
  id         bigint generated always as identity primary key,
  task_id    uuid not null references public.tasks (id) on delete cascade,
  actor_id   uuid references public.profiles (id) on delete set null,
  type       text not null check (type in (
               'posted', 'accepted', 'cancelled', 'enroute', 'arrived', 'working',
               'submitted', 'released', 'disputed', 'expired', 'no_signal')),
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index task_events_task_id_idx on public.task_events (task_id, id);
create index task_events_actor_id_idx on public.task_events (actor_id) where actor_id is not null;

create trigger task_events_forbid_update
  before update on public.task_events
  for each row execute function private.forbid_mutation();

alter table public.task_events enable row level security;

-- Event terlihat bila tugasnya terlihat (RLS tasks berlaku pada subquery).
create policy task_events_select_via_task on public.task_events
  for select to authenticated
  using (exists (select 1 from public.tasks t where t.id = task_events.task_id));

-- ---------------------------------------------------------------------------
-- Hak akses tabel: Supabase memberi ALL secara default, jadi dicabut eksplisit.
-- ---------------------------------------------------------------------------

revoke all on public.profiles, public.tasks, public.task_events from anon, authenticated;
grant select on public.profiles, public.tasks, public.task_events to authenticated;
-- Kolom rating/completed tidak bisa diubah user (BOPLA).
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- RPC. SECURITY DEFINER dengan search_path kosong dan pengecekan auth.uid().
-- Kode error di pesan exception dipetakan klien: not_authenticated, profile_missing,
-- invalid_location, too_many_open_tasks, too_many_active_tasks, task_unavailable, cancel_not_allowed.
-- ---------------------------------------------------------------------------

create function public.create_task(
  p_category    text,
  p_title       text,
  p_description text,
  p_price_idr   integer,
  p_urgent      boolean,
  p_lat         double precision,
  p_lng         double precision,
  p_address     text,
  p_skill_tags  text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := (select auth.uid());
  v_open integer;
  v_id   uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'profile_missing';
  end if;
  -- Kotak pembatas kasar Indonesia; kota/area yang dilayani dikontrol di sisi produk.
  if p_lat is null or p_lng is null
     or p_lat not between -11.5 and 6.5 or p_lng not between 94.5 and 141.5 then
    raise exception 'invalid_location' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('create_task:' || v_uid::text, 0));

  select count(*) into v_open
  from public.tasks
  where poster_id = v_uid
    and status in ('awaiting_payment', 'posted', 'accepted', 'enroute', 'arrived', 'working', 'submitted', 'disputed');
  if v_open >= 5 then
    raise exception 'too_many_open_tasks';
  end if;

  insert into public.tasks (poster_id, category, skill_tags, title, description, price_idr,
                            urgent, location, address_text)
  values (v_uid, p_category, coalesce(p_skill_tags, '{}'), p_title, coalesce(p_description, ''),
          p_price_idr, coalesce(p_urgent, false),
          extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
          p_address)
  returning id into v_id;

  insert into public.task_events (task_id, actor_id, type)
  values (v_id, v_uid, 'posted');

  return v_id;
end;
$$;

-- Tugas 'posted' dalam radius (maks 5 km) dari doer. Lokasi dikaburkan (±100 m) dan alamat
-- tidak dikirim sebelum tugas diterima.
create function public.nearby_tasks(
  p_lat      double precision,
  p_lng      double precision,
  p_radius_m integer default 5000,
  p_limit    integer default 30
)
returns table (
  id               uuid,
  category         text,
  title            text,
  description      text,
  price_idr        integer,
  urgent           boolean,
  distance_m       integer,
  approx_lat       double precision,
  approx_lng       double precision,
  skill_tags       text[],
  poster_name      text,
  poster_rating    numeric,
  poster_completed integer,
  created_at       timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_pt  extensions.geography;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_lat is null or p_lng is null
     or p_lat not between -11.5 and 6.5 or p_lng not between 94.5 and 141.5 then
    raise exception 'invalid_location' using errcode = '22023';
  end if;

  v_pt := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;

  return query
  select t.id, t.category, t.title, t.description, t.price_idr, t.urgent,
         (round(extensions.st_distance(t.location, v_pt) / 100) * 100)::integer,
         round(extensions.st_y(t.location::extensions.geometry)::numeric, 3)::double precision,
         round(extensions.st_x(t.location::extensions.geometry)::numeric, 3)::double precision,
         t.skill_tags, p.display_name, p.rating_avg, p.completed_count, t.created_at
  from public.tasks t
  join public.profiles p on p.id = t.poster_id
  where t.status = 'posted'
    and t.poster_id <> v_uid
    and extensions.st_dwithin(t.location, v_pt, least(greatest(coalesce(p_radius_m, 5000), 100), 5000))
  order by t.location operator(extensions.<->) v_pt
  limit least(greatest(coalesce(p_limit, 30), 1), 50);
end;
$$;

-- Terima atomik: satu UPDATE bersyarat mengikat tepat satu doer (READ COMMITTED menilai ulang
-- WHERE setelah menunggu kunci baris, jadi penerima kedua mendapat 0 baris).
create function public.accept_task(
  p_task_id uuid,
  p_lat     double precision,
  p_lng     double precision
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_pt     extensions.geography;
  v_active integer;
  v_id     uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'profile_missing';
  end if;
  if p_lat is null or p_lng is null
     or p_lat not between -11.5 and 6.5 or p_lng not between 94.5 and 141.5 then
    raise exception 'invalid_location' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('accept_task:' || v_uid::text, 0));

  select count(*) into v_active
  from public.tasks
  where doer_id = v_uid
    and status in ('accepted', 'enroute', 'arrived', 'working', 'submitted');
  if v_active >= 2 then
    raise exception 'too_many_active_tasks';
  end if;

  v_pt := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;

  update public.tasks t
     set doer_id = v_uid, status = 'accepted', accepted_at = now()
   where t.id = p_task_id
     and t.status = 'posted'
     and t.doer_id is null
     and t.poster_id <> v_uid
     and extensions.st_dwithin(t.location, v_pt, 5000)
  returning t.id into v_id;

  if v_id is null then
    raise exception 'task_unavailable';
  end if;

  insert into public.task_events (task_id, actor_id, type)
  values (v_id, v_uid, 'accepted');
end;
$$;

-- Poster membatalkan HANYA sebelum ada yang menerima. Aturan batal setelah diterima belum diputuskan.
create function public.cancel_task(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  update public.tasks t
     set status = 'cancelled', cancelled_at = now()
   where t.id = p_task_id
     and t.poster_id = v_uid
     and t.status in ('awaiting_payment', 'posted')
  returning t.id into v_id;

  if v_id is null then
    raise exception 'cancel_not_allowed';
  end if;

  insert into public.task_events (task_id, actor_id, type)
  values (v_id, v_uid, 'cancelled');
end;
$$;

revoke execute on function public.create_task(text, text, text, integer, boolean, double precision, double precision, text, text[]) from public, anon;
revoke execute on function public.nearby_tasks(double precision, double precision, integer, integer) from public, anon;
revoke execute on function public.accept_task(uuid, double precision, double precision) from public, anon;
revoke execute on function public.cancel_task(uuid) from public, anon;
grant execute on function public.create_task(text, text, text, integer, boolean, double precision, double precision, text, text[]) to authenticated;
grant execute on function public.nearby_tasks(double precision, double precision, integer, integer) to authenticated;
grant execute on function public.accept_task(uuid, double precision, double precision) to authenticated;
grant execute on function public.cancel_task(uuid) to authenticated;

-- Realtime (RLS tetap berlaku): poster/doer melihat perubahan status tugas mereka.
alter publication supabase_realtime add table public.tasks, public.task_events;
