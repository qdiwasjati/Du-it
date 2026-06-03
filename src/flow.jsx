// ─── Status Tracker ───────────────────────────────────────────────────────────

const STAGE_META = {
  posted:    { label: 'Diposting',      emoji: '📋', pct: 15,  color: '#94a3b8' },
  accepted:  { label: 'Diterima!',      emoji: '✦',  pct: 40,  color: 'var(--lime)' },
  progress:  { label: 'Sedang Dikerjakan', emoji: '🏃', pct: 70,  color: '#3b82f6' },
  completed: { label: 'Selesai!',       emoji: '🎉', pct: 90,  color: '#22c55e' },
  paid:      { label: 'Dibayar ✓',      emoji: '💸', pct: 100, color: 'var(--lime)' },
};

function StatusTracker({ stage, onAdvance, onConfirmPayment, onBack, pov }) {
  const task = TASKS[0];
  const meta = STAGE_META[stage] || STAGE_META.accepted;
  const stageOrder = ['posted', 'accepted', 'progress', 'completed', 'paid'];
  const stageIdx = stageOrder.indexOf(stage);

  const doer = { name: 'Andi R.', avatar: 'AR', rating: 4.8, jobs: 67, distance: '0.6 km' };

  return (
    <div className="slide-up" style={{ background: '#FAF8F3', minHeight: '100%' }}>
      <div style={{ padding: '12px 20px' }}>
        <BackButton onBack={onBack} />
      </div>

      {/* Progress header */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(14,14,16,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
          Status Tugas
        </div>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700, color: '#0E0E10', marginBottom: 12, lineHeight: 1.25 }}>
          {task.title}
        </h2>

        {/* Progress bar */}
        <div className="progress-bar" style={{ marginBottom: 8 }}>
          <div className="progress-fill" style={{ width: `${meta.pct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#0E0E10' }}>
            <span>{meta.emoji}</span>
            {meta.label}
          </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'rgba(14,14,16,0.4)' }}>
            {meta.pct}%
          </span>
        </div>
      </div>

      {/* Stage steps */}
      <div style={{ padding: '0 20px', marginBottom: 16 }}>
        {stageOrder.map((s, i) => {
          const m = STAGE_META[s];
          const done = i < stageIdx;
          const current = i === stageIdx;
          return (
            <div key={s} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 12 }}>
              {/* Dot + line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: done ? 'var(--lime)' : current ? '#0E0E10' : 'rgba(14,14,16,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: done ? '#0E0E10' : current ? '#FAF8F3' : 'rgba(14,14,16,0.3)',
                  fontWeight: 700,
                }}>
                  {done ? '✓' : i + 1}
                </div>
                {i < stageOrder.length - 1 && (
                  <div style={{ width: 2, height: 22, background: done ? 'var(--lime)' : 'rgba(14,14,16,0.08)', marginTop: 2 }} />
                )}
              </div>
              <div style={{ paddingTop: 2 }}>
                <div style={{ fontSize: 13, fontWeight: current ? 700 : 500, color: current ? '#0E0E10' : done ? 'rgba(14,14,16,0.5)' : 'rgba(14,14,16,0.35)' }}>
                  {m.emoji} {m.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map */}
      <div className="map-placeholder" style={{ height: 120, margin: '0 20px 16px', borderRadius: 14 }}>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 22 }}>🏃</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#4a6900' }}>
            {stage === 'progress' ? 'Doer sedang dalam perjalanan' : 'Kebayoran Baru'}
          </div>
        </div>
      </div>

      {/* Doer card */}
      {stage !== 'posted' && (
        <div className="card" style={{ margin: '0 20px 16px', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(14,14,16,0.4)', marginBottom: 10 }}>
            {pov === 'doer' ? 'Tugasmu' : 'Doer kamu'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar initials={doer.avatar} size={44} color="rgba(59,130,246,0.15)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0E0E10' }}>{doer.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(14,14,16,0.45)' }}>⭐ {doer.rating} · {doer.jobs} selesai · {doer.distance}</div>
            </div>
            <button style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(14,14,16,0.06)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>💬</button>
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: '0 20px 40px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stage === 'completed' && pov !== 'doer' && (
          <button className="btn btn-primary" onClick={() => onAdvance('next')}>
            💸 Konfirmasi & Bayar
          </button>
        )}
        {stage === 'progress' && pov === 'doer' && (
          <button className="btn btn-primary" onClick={() => onAdvance('next')}>
            ✓ Tandai Selesai
          </button>
        )}
        {stage === 'accepted' && pov === 'doer' && (
          <button className="btn btn-primary" onClick={() => onAdvance('next')}>
            Mulai Kerjakan →
          </button>
        )}
        {stage === 'paid' && (
          <button className="btn btn-primary" onClick={() => onAdvance('rate')}>
            ⭐ Beri Rating
          </button>
        )}
        {!['completed','paid'].includes(stage) && (
          <button className="btn btn-secondary" style={{ background: 'transparent', border: '1px solid rgba(14,14,16,0.15)' }}>
            💬 Chat
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Payment Confirm ──────────────────────────────────────────────────────────

function PaymentConfirm({ onBack, onConfirm }) {
  const task = TASKS[0];
  const fee = Math.round(task.price * 0.05);
  const total = task.price + fee;

  const [method, setMethod] = React.useState('gopay');
  const methods = [
    { id: 'gopay', label: 'GoPay', emoji: '💚' },
    { id: 'ovo',   label: 'OVO',   emoji: '💜' },
    { id: 'bca',   label: 'Transfer BCA', emoji: '🏦' },
    { id: 'qris',  label: 'QRIS',  emoji: '📱' },
  ];

  return (
    <div className="slide-up" style={{ background: '#FAF8F3', minHeight: '100%' }}>
      <div style={{ padding: '12px 20px' }}>
        <BackButton onBack={onBack} />
      </div>
      <div style={{ padding: '0 20px 100px' }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 4, color: '#0E0E10' }}>
          Konfirmasi Pembayaran
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(14,14,16,0.5)', marginBottom: 20 }}>
          Pembayaran akan diteruskan ke doer setelah dikonfirmasi
        </p>

        {/* Breakdown */}
        <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#0E0E10' }}>
            {task.title}
          </div>
          {[
            ['Harga tugas', task.price],
            ['Biaya layanan (5%)', fee],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: 'rgba(14,14,16,0.6)' }}>
              <span>{k}</span>
              <span>Rp {v.toLocaleString('id-ID')}</span>
            </div>
          ))}
          <div className="divider" style={{ margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#0E0E10' }}>
            <span>Total</span>
            <span style={{ color: 'var(--lime)', fontFamily: 'Space Grotesk, sans-serif' }}>
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Payment methods */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(14,14,16,0.4)', marginBottom: 10 }}>
            Metode Pembayaran
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {methods.map(m => (
              <button key={m.id} onClick={() => setMethod(m.id)} style={{
                padding: '14px 16px', background: '#fff',
                border: `2px solid ${method === m.id ? '#0E0E10' : 'rgba(14,14,16,0.1)'}`,
                borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 0.15s',
              }}>
                <span style={{ fontSize: 20 }}>{m.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0E0E10' }}>{m.label}</span>
                {method === m.id && <span style={{ marginLeft: 'auto', fontSize: 16 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={onConfirm}>
          Bayar Rp {total.toLocaleString('id-ID')}
        </button>
      </div>
    </div>
  );
}

// ─── Rating Screen ────────────────────────────────────────────────────────────

function RatingScreen({ onSubmit, onBack }) {
  const [stars, setStars] = React.useState(0);
  const [hovered, setHovered] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const tags = ['Cepat', 'Ramah', 'Tepat Waktu', 'Rapi', 'Komunikatif'];
  const [selected, setSelected] = React.useState([]);

  const toggleTag = (t) => setSelected(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t]);
  const display = hovered || stars;

  return (
    <div className="slide-up" style={{ background: '#FAF8F3', minHeight: '100%' }}>
      <div style={{ padding: '12px 20px' }}>
        <BackButton onBack={onBack} />
      </div>
      <div style={{ padding: '0 20px 60px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, color: '#0E0E10', marginBottom: 6 }}>
          Tugas Selesai!
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(14,14,16,0.55)', marginBottom: 28 }}>
          Bagaimana pengalaman kamu dengan Andi R.?
        </p>

        {/* Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {[1,2,3,4,5].map(n => (
            <span
              key={n}
              className={`star${display >= n ? ' filled' : ''}`}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setStars(n)}
            >★</span>
          ))}
        </div>

        {stars > 0 && (
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0E0E10', marginBottom: 20 }}>
            {['', 'Mengecewakan', 'Kurang Baik', 'Lumayan', 'Bagus!', 'Luar Biasa! 🔥'][stars]}
          </div>
        )}

        {/* Quick tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
          {tags.map(t => (
            <button key={t} onClick={() => toggleTag(t)} style={{
              padding: '8px 16px', borderRadius: 999,
              background: selected.includes(t) ? '#0E0E10' : 'rgba(14,14,16,0.06)',
              color: selected.includes(t) ? '#fff' : '#0E0E10',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              transition: 'all 0.15s',
            }}>{t}</button>
          ))}
        </div>

        <textarea
          className="input"
          rows={3}
          placeholder="Tambah komentar (opsional)..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          style={{ textAlign: 'left', marginBottom: 16 }}
        />

        <button
          className="btn btn-primary"
          disabled={stars === 0}
          onClick={onSubmit}
          style={{ opacity: stars === 0 ? 0.4 : 1 }}
        >
          Kirim Rating
        </button>
      </div>
    </div>
  );
}
