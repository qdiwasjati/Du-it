// ─── Task Card ───────────────────────────────────────────────────────────────

function TaskCard({ task, onOpen, density }) {
  const compact = density === 'dense';
  return (
    <div
      onClick={() => onOpen(task.id)}
      className="card"
      style={{
        padding: compact ? '14px 16px' : '16px',
        cursor: 'pointer',
        transition: 'transform 0.1s, box-shadow 0.1s',
        marginBottom: 10,
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.99)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: compact ? 8 : 10 }}>
        <TypeChip type={task.type} urgent={task.urgent} />
        <PriceTag price={task.price} size={compact ? 'sm' : 'md'} />
      </div>

      <h4 style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: compact ? 14 : 15, fontWeight: 700,
        color: '#0E0E10', lineHeight: 1.3,
        marginBottom: compact ? 6 : 8,
      }}>
        {task.title}
      </h4>

      {!compact && (
        <p style={{
          fontSize: 13, color: 'rgba(14,14,16,0.6)',
          lineHeight: 1.45, marginBottom: 12,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <PosterInfo poster={task.poster} compact={compact} />
        <DistanceBadge distance={task.distance} time={task.time} />
      </div>
    </div>
  );
}

// ─── Task Detail ─────────────────────────────────────────────────────────────

function TaskDetail({ taskId, onBack, onAccept, pov }) {
  const task = TASKS.find(t => t.id === taskId) || TASKS[0];
  const [offered, setOffered] = React.useState(false);

  return (
    <div className="slide-up" style={{ background: '#FAF8F3', minHeight: '100%' }}>
      <div style={{ padding: '12px 20px' }}>
        <BackButton onBack={onBack} />
      </div>

      {/* Map */}
      <div className="map-placeholder" style={{ height: 180, margin: '0 20px 20px', borderRadius: 16 }}>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--lime)', margin: '0 auto 6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>📍</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#4a6900' }}>{task.location}</div>
        </div>
      </div>

      <div style={{ padding: '0 20px 100px' }}>
        {/* Type + price row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <TypeChip type={task.type} urgent={task.urgent} />
          <PriceTag price={task.price} size="lg" />
        </div>

        <h2 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 22, fontWeight: 700, color: '#0E0E10',
          lineHeight: 1.25, marginBottom: 10,
        }}>
          {task.title}
        </h2>

        <p style={{ fontSize: 14, color: 'rgba(14,14,16,0.65)', lineHeight: 1.6, marginBottom: 20 }}>
          {task.description}
        </p>

        {/* Meta */}
        <div className="card" style={{ padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <MetaItem label="Jarak" value={`${task.distance} km`} icon="📍" />
            <MetaItem label="Estimasi" value={task.time} icon="⏱" />
            <MetaItem label="Lokasi" value={task.location} icon="🏘" />
            <MetaItem label="Waktu" value="ASAP" icon="🔥" />
          </div>
        </div>

        {/* Poster */}
        <div className="card" style={{ padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(14,14,16,0.4)', marginBottom: 10 }}>
            Dipasang oleh
          </div>
          <PosterInfo poster={task.poster} />
          <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(212,255,63,0.08)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: 'rgba(14,14,16,0.5)' }}>
              Poster ini sudah menyelesaikan <strong style={{ color: '#0E0E10' }}>{task.poster.jobs} tugas</strong> dengan
              rating rata-rata <strong style={{ color: '#0E0E10' }}>⭐ {task.poster.rating}</strong>
            </div>
          </div>
        </div>

        {/* CTA */}
        {pov === 'doer' ? (
          <div>
            {!offered ? (
              <button className="btn btn-primary" onClick={() => { setOffered(true); onAccept(); }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2L11.5 7.5H17L12.5 11L14.5 16.5L9 13L3.5 16.5L5.5 11L1 7.5H6.5L9 2Z"
                    fill="currentColor"/>
                </svg>
                Terima Tugas · Rp {task.price.toLocaleString('id-ID')}
              </button>
            ) : (
              <button className="btn btn-primary" style={{ background: '#00C87A', color: '#fff' }}>
                ✓ Diterima! Navigasi...
              </button>
            )}
            <button className="btn btn-secondary" style={{ marginTop: 8, width: '100%' }}>
              Tanya Poster
            </button>
          </div>
        ) : (
          <div>
            <div className="card" style={{ padding: '12px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'rgba(14,14,16,0.5)', marginBottom: 4 }}>Status</div>
              <span className="status-pill status-posted">Menunggu Doer</span>
            </div>
            <button className="btn btn-secondary" style={{ width: '100%' }}>
              Edit Tugas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaItem({ label, value, icon }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'rgba(14,14,16,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0E0E10' }}>
        {icon} {value}
      </div>
    </div>
  );
}

// ─── Home Feed ────────────────────────────────────────────────────────────────

function HomeFeed({ pov, onTogglePov, onOpenTask, density, onOpenAI }) {
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('all');

  const filters = ['all', 'errand', 'delivery', 'help', 'other'];
  const filteredTasks = TASKS.filter(t => {
    const matchFilter = filter === 'all' || t.type === filter;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ background: '#FAF8F3', minHeight: '100%' }}>
      {/* Top header */}
      <div style={{ padding: '4px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 24, fontWeight: 700, color: '#0E0E10', letterSpacing: '-0.02em',
            }}>
              DUIT<span style={{ color: 'var(--lime)' }}>!</span>
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(14,14,16,0.45)', marginTop: 1 }}>
              📍 Kebayoran Baru, Jakarta
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* AI Hub button */}
            <button onClick={onOpenAI} style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(212,255,63,0.15)', border: '1px solid rgba(212,255,63,0.3)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>
              ✦
            </button>
            {/* POV toggle */}
            <button onClick={onTogglePov} style={{
              padding: '6px 12px', borderRadius: 999,
              background: pov === 'doer' ? 'var(--lime)' : '#0E0E10',
              color: pov === 'doer' ? '#0E0E10' : '#fff',
              border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {pov === 'doer' ? '→ Doer' : '→ Poster'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }}
            width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="#0E0E10" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="#0E0E10" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            className="input"
            style={{ paddingLeft: 36 }}
            placeholder="Cari tugas di sekitarmu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 999, flexShrink: 0,
              background: filter === f ? '#0E0E10' : 'rgba(14,14,16,0.06)',
              color: filter === f ? '#fff' : 'rgba(14,14,16,0.6)',
              border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              textTransform: 'capitalize',
            }}>
              {f === 'all' ? 'Semua' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats banner */}
      <div style={{ margin: '0 20px 16px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0E0E10 0%, #2a2a2d 100%)',
          borderRadius: 16, padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3, fontWeight: 600 }}>
              TUGAS TERSEDIA
            </div>
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 26, fontWeight: 700, color: 'var(--lime)', lineHeight: 1,
            }}>
              {filteredTasks.length}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3, fontWeight: 600 }}>
              DALAM RADIUS
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>2 km</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3, fontWeight: 600 }}>
              RATA-RATA
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Rp 50k</div>
          </div>
        </div>
      </div>

      {/* Task list */}
      <div style={{ padding: '0 20px 100px' }}>
        <SectionHeader title={pov === 'doer' ? 'Tugas Tersedia' : 'Feed Sekitarmu'} />
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(14,14,16,0.35)' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
            <div style={{ fontWeight: 600 }}>Tidak ada tugas ditemukan</div>
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} onOpen={onOpenTask} density={density} />
          ))
        )}
      </div>
    </div>
  );
}
