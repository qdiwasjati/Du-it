-- Tes RLS dan state machine untuk 20261106000000_marketplace_core.sql.
-- Cara pakai: jalankan seluruh file (SQL editor, `psql -f`, atau execute_sql). Semua perubahan
-- di-rollback otomatis: skrip berakhir dengan RAISE EXCEPTION berisi laporan PASS/FAIL.
-- Setiap tes penolakan punya positive control supaya "nol baris" tidak menipu.

do $test$
declare
  ua uuid := '00000000-0000-0000-0000-00000000000a';  -- poster
  ub uuid := '00000000-0000-0000-0000-00000000000b';  -- doer dekat
  uc uuid := '00000000-0000-0000-0000-00000000000c';  -- doer kedua
  v_log text := '';
  v_fail integer := 0;
  t1 uuid; t2 uuid; tx uuid;
  n integer; st text; msg text; d integer; alat double precision; alng double precision; s text;
begin
  insert into auth.users (id, email, raw_user_meta_data) values
    (ua, 'a@test.local', '{"full_name":"Poster A"}'),
    (ub, 'b@test.local', '{"name":"Doer B","avatar_url":"http://tidak-https.example/x.png"}'),
    (uc, 'c@test.local', '{}');

  -- T1 trigger profil
  select count(*) into n from public.profiles where id in (ua, ub, uc);
  v_log := v_log || case when n = 3 then 'PASS' else 'FAIL' end || E' T1 profil dibuat otomatis untuk 3 user\n';
  select display_name, coalesce(avatar_url, 'NULL') into s, msg from public.profiles where id = ub;
  v_log := v_log || case when s = 'Doer B' and msg = 'NULL' then 'PASS' else 'FAIL' end || E' T1b nama dari metadata, avatar non-https dibuang\n';
  select display_name into s from public.profiles where id = uc;
  v_log := v_log || case when s = 'c' then 'PASS' else 'FAIL('||coalesce(s,'null')||')' end || E' T1c nama jatuh ke bagian email\n';

  -- ===== sebagai A (poster) =====
  perform set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', ua::text, true);
  execute 'set local role authenticated';

  t1 := public.create_task('errand', 'Beli kopi Starbucks', 'Caramel Macchiato', 45000, true, -6.1754, 106.8272, 'Plaza Senayan', '{kopi}');
  select count(*) into n from public.tasks;
  v_log := v_log || case when t1 is not null and n = 1 then 'PASS' else 'FAIL' end || E' T3 A membuat tugas dan melihatnya (positive control)\n';

  select count(*) into n from public.task_events where task_id = t1 and type = 'posted';
  v_log := v_log || case when n = 1 then 'PASS' else 'FAIL' end || E' T3b event posted tercatat dan terbaca poster\n';

  update public.profiles set display_name = 'Poster A (baru)' where id = ua;
  get diagnostics n = row_count;
  v_log := v_log || case when n = 1 then 'PASS' else 'FAIL' end || E' T7 A boleh ubah display_name sendiri (positive control)\n';

  st := null;
  begin update public.profiles set rating_avg = 5 where id = ua; exception when others then st := sqlstate; end;
  v_log := v_log || case when st = '42501' then 'PASS' else 'FAIL('||coalesce(st,'tanpa error')||')' end || E' T7b A tidak bisa mengubah rating_avg sendiri\n';

  select count(*) into n from public.nearby_tasks(-6.1754, 106.8272);
  v_log := v_log || case when n = 0 then 'PASS' else 'FAIL' end || E' T8b poster tidak melihat tugasnya sendiri di nearby_tasks\n';

  st := null; msg := null;
  begin perform public.create_task('errand', 'x', '', 20000, false, 50, 106.8, 'a'); exception when others then st := sqlstate; msg := sqlerrm; end;
  v_log := v_log || case when msg = 'invalid_location' then 'PASS' else 'FAIL('||coalesce(msg,'tanpa error')||')' end || E' T20 lokasi di luar Indonesia ditolak\n';

  st := null;
  begin perform public.create_task('errand', 'Harga murah', '', 1000, false, -6.17, 106.82, 'a'); exception when others then st := sqlstate; end;
  v_log := v_log || case when st = '23514' then 'PASS' else 'FAIL('||coalesce(st,'tanpa error')||')' end || E' T21 harga di bawah batas ditolak (check constraint)\n';

  t2 := public.create_task('delivery', 'Antar dokumen', '', 65000, false, -6.2088, 106.8456, 'Sudirman', '{}');
  execute 'reset role';

  -- ===== sebagai B (doer dekat) =====
  perform set_config('request.jwt.claims', json_build_object('sub', ub, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', ub::text, true);
  execute 'set local role authenticated';

  select count(*) into n from public.tasks;
  v_log := v_log || case when n = 0 then 'PASS' else 'FAIL('||n||')' end || E' T4 B tidak bisa SELECT tugas orang lain (kontrol: T3 A melihat 1)\n';

  st := null; msg := null;
  begin
    insert into public.tasks (poster_id, category, title, price_idr, location, address_text)
    values (ub, 'help', 'xxx', 20000, 'SRID=4326;POINT(106.8 -6.2)'::extensions.geography, 'x');
  exception when others then st := sqlstate; msg := sqlerrm; end;
  v_log := v_log || case when st = '42501' and msg like '%table tasks%' then 'PASS' else 'FAIL('||coalesce(st,'-')||')' end || E' T5 B tidak bisa INSERT langsung ke tasks\n';

  st := null; msg := null;
  begin update public.tasks set price_idr = 15000 where id = t1; exception when others then st := sqlstate; msg := sqlerrm; end;
  v_log := v_log || case when st = '42501' and msg like '%table tasks%' then 'PASS' else 'FAIL('||coalesce(st,'-')||')' end || E' T6 B tidak bisa UPDATE langsung ke tasks\n';

  select count(*) into n from public.nearby_tasks(-6.1951, 106.8231);
  select distance_m, approx_lat, approx_lng into d, alat, alng from public.nearby_tasks(-6.1951, 106.8231) where id = t1;
  v_log := v_log || case when n = 2 then 'PASS' else 'FAIL('||n||')' end || E' T8 B melihat 2 tugas dalam radius 5 km\n';
  v_log := v_log || case when d % 100 = 0 and d between 1900 and 2600 and alat = -6.175 and alng = 106.827 then 'PASS' else 'FAIL('||coalesce(d::text,'null')||','||coalesce(alat::text,'null')||')' end || E' T8c jarak dibulatkan 100 m dan koordinat dikaburkan 3 desimal\n';

  select count(*) into n from public.nearby_tasks(-6.9175, 107.6191);
  v_log := v_log || case when n = 0 then 'PASS' else 'FAIL('||n||')' end || E' T9 dari Bandung (jauh) tidak ada tugas dalam 5 km\n';

  st := null; msg := null;
  begin perform public.accept_task(t1, -6.9175, 107.6191); exception when others then msg := sqlerrm; end;
  v_log := v_log || case when msg = 'task_unavailable' then 'PASS' else 'FAIL('||coalesce(msg,'tanpa error')||')' end || E' T9b terima dari lokasi jauh ditolak\n';

  perform public.accept_task(t1, -6.1951, 106.8231);
  select status, doer_id::text into s, msg from public.tasks where id = t1;
  v_log := v_log || case when s = 'accepted' and msg = ub::text then 'PASS' else 'FAIL('||coalesce(s,'null')||')' end || E' T10 B menerima tugas: status accepted, doer = B\n';

  select count(*) into n from public.profiles where id = ua;
  v_log := v_log || case when n = 1 then 'PASS' else 'FAIL' end || E' T12 B melihat profil poster setelah menerima (counterpart)\n';

  perform public.accept_task(t2, -6.1951, 106.8231);   -- tugas aktif ke-2 milik B

  st := null;
  begin delete from public.task_events; exception when others then st := sqlstate; end;
  v_log := v_log || case when st = '42501' then 'PASS' else 'FAIL('||coalesce(st,'tanpa error')||')' end || E' T14b B tidak bisa DELETE task_events\n';
  execute 'reset role';

  -- ===== sebagai C (doer kedua) =====
  perform set_config('request.jwt.claims', json_build_object('sub', uc, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uc::text, true);
  execute 'set local role authenticated';

  st := null; msg := null;
  begin perform public.accept_task(t1, -6.1754, 106.8272); exception when others then msg := sqlerrm; end;
  v_log := v_log || case when msg = 'task_unavailable' then 'PASS' else 'FAIL('||coalesce(msg,'tanpa error')||')' end || E' T11 C gagal menerima tugas yang sudah diambil B\n';

  select count(*) into n from public.tasks;
  v_log := v_log || case when n = 0 then 'PASS' else 'FAIL('||n||')' end || E' T12b C tidak melihat tugas A/B\n';
  select count(*) into n from public.profiles where id in (ua, ub);
  v_log := v_log || case when n = 0 then 'PASS' else 'FAIL('||n||')' end || E' T12c C tidak melihat profil A/B\n';
  select count(*) into n from public.task_events;
  v_log := v_log || case when n = 0 then 'PASS' else 'FAIL('||n||')' end || E' T15b C tidak melihat event tugas orang lain\n';
  execute 'reset role';

  -- ===== kembali ke A =====
  perform set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', ua::text, true);
  execute 'set local role authenticated';

  select count(*) into n from public.task_events where task_id = t1;
  v_log := v_log || case when n = 2 then 'PASS' else 'FAIL('||n||')' end || E' T15 A melihat event posted + accepted tugasnya\n';

  st := null; msg := null;
  begin perform public.cancel_task(t1); exception when others then msg := sqlerrm; end;
  v_log := v_log || case when msg = 'cancel_not_allowed' then 'PASS' else 'FAIL('||coalesce(msg,'tanpa error')||')' end || E' T13 batal setelah diterima ditolak\n';

  select count(*) into n from public.profiles where id = ub;
  v_log := v_log || case when n = 1 then 'PASS' else 'FAIL' end || E' T12d A melihat profil doer yang menerima\n';

  tx := public.create_task('help', 'Bantu WiFi', '', 80000, false, -6.17, 106.82, 'Senopati', '{}');
  perform public.cancel_task(tx);
  select status into s from public.tasks where id = tx;
  v_log := v_log || case when s = 'cancelled' then 'PASS' else 'FAIL' end || E' T13b poster membatalkan tugas yang belum diterima\n';

  -- batas tugas terbuka: t1(accepted) + t2(accepted) sudah 2 terbuka -> 3 lagi boleh, yang ke-6 ditolak
  perform public.create_task('other', 'Tugas 3', '', 20000, false, -6.17, 106.82, 'a');
  perform public.create_task('other', 'Tugas 4', '', 20000, false, -6.17, 106.82, 'a');
  perform public.create_task('other', 'Tugas 5', '', 20000, false, -6.17, 106.82, 'a');
  st := null; msg := null;
  begin perform public.create_task('other', 'Tugas 6', '', 20000, false, -6.17, 106.82, 'a'); exception when others then msg := sqlerrm; end;
  v_log := v_log || case when msg = 'too_many_open_tasks' then 'PASS' else 'FAIL('||coalesce(msg,'tanpa error')||')' end || E' T16 tugas terbuka ke-6 ditolak\n';
  execute 'reset role';

  -- batas tugas aktif doer
  perform set_config('request.jwt.claims', json_build_object('sub', ub, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', ub::text, true);
  execute 'set local role authenticated';
  select id into tx from public.nearby_tasks(-6.1951, 106.8231) limit 1;
  st := null; msg := null;
  begin perform public.accept_task(tx, -6.1951, 106.8231); exception when others then msg := sqlerrm; end;
  v_log := v_log || case when msg = 'too_many_active_tasks' then 'PASS' else 'FAIL('||coalesce(msg,'tanpa error')||')' end || E' T17 doer maksimal 2 tugas aktif\n';
  execute 'reset role';

  -- event append-only (sebagai superuser)
  st := null;
  begin update public.task_events set type = 'posted' where task_id = t1; exception when others then st := sqlstate; end;
  v_log := v_log || case when st = '55000' then 'PASS' else 'FAIL('||coalesce(st,'tanpa error')||')' end || E' T14 task_events tidak bisa di-UPDATE (append-only)\n';

  -- anon
  execute 'set local role anon';
  st := null;
  begin perform public.create_task('errand', 'Anon', '', 20000, false, -6.17, 106.82, 'a'); exception when others then st := sqlstate; end;
  v_log := v_log || case when st = '42501' then 'PASS' else 'FAIL('||coalesce(st,'tanpa error')||')' end || E' T18 anon tidak bisa menjalankan RPC\n';
  st := null;
  begin perform count(*) from public.tasks; exception when others then st := sqlstate; end;
  v_log := v_log || case when st = '42501' then 'PASS' else 'FAIL('||coalesce(st,'tanpa error')||')' end || E' T18b anon tidak bisa membaca tabel tasks\n';
  execute 'reset role';

  -- authenticated tanpa sub
  perform set_config('request.jwt.claims', '{}', true);
  perform set_config('request.jwt.claim.sub', '', true);
  execute 'set local role authenticated';
  st := null; msg := null;
  begin perform public.create_task('errand', 'Tanpa sub', '', 20000, false, -6.17, 106.82, 'a'); exception when others then msg := sqlerrm; end;
  v_log := v_log || case when msg = 'not_authenticated' then 'PASS' else 'FAIL('||coalesce(msg,'tanpa error')||')' end || E' T19 sesi tanpa user ditolak\n';
  execute 'reset role';

  v_fail := (length(v_log) - length(replace(v_log, 'FAIL', ''))) / 4;
  raise exception E'HASIL TES (rollback otomatis): % gagal\n%', v_fail, v_log;
end;
$test$;
