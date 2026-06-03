// ─── Create Task Flow (6 steps) ───────────────────────────────────────────────

const STEPS = [
  { id: 'type',     label: 'Tipe Tugas' },
  { id: 'details',  label: 'Detail' },
  { id: 'location', label: 'Lokasi' },
  { id: 'time',     label: 'Waktu' },
  { id: 'price',    label: 'Harga' },
  { id: 'review',   label: 'Konfirmasi' },
];

const TASK_TYPES = [
  { id: 'errand',   emoji: '🛍', label: 'Errand', desc: 'Belanja, print, antri, dll' },
  { id: 'delivery', emoji: '📦', label: 'Delivery', desc: 'Antar barang atau dokumen' },
  { id: 'help',     emoji: '🤝', label: 'Bantuan', desc: 'Bantu setup, perbaiki, dll' },
  { id: 'other',    emoji: '✨', label: 'Lainnya', desc: 'Tugas unik lainnya' },
];

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '0 20px', marginBottom: 20 }}>
      {STEPS.map((s, i) => (
        <div key={s.id} style={{
          flex: 1, height: 3, borderRadius: 999,
          background: i <= current ? 'var(--lime)' : 'rgba(14,14,16,0.1)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  );
}

function CreateFlow({ onClose, onPost }) {
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState({
    type: '', title: '', description: '', location: '', neighborhood: '',
    time: 'ASAP', date: '', price: 35000, urgent: false,
  });

  const update = (patch) => setForm(prev => ({ ...prev, ...patch }));
  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => { if (step === 0) onClose(); else setStep(s => s - 1); };

  const canNext = () => {
    if (step === 0) return !!form.type;
    if (step === 1) return form.title.length >= 5;
    if (step === 2) return !!form.neighborhood;
    return true;
  };

  return (
    <div className="slide-up" style={{ background: '#FAF8F3', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <BackButton onBack={back} />
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(14,14,16,0.35)', letterSpacing: '0.06em' }}>
            {step + 1} / {STEPS.length}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, fontSize: 20, color: 'rgba(14,14,16,0.4)' }}>×</button>
        </div>
        <StepIndicator current={step} />
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, color: '#0E0E10', marginBottom: 6 }}>
          {STEPS[step].label}
        </h2>
      </div>

      {/* Step content */}
      <div style={{ flex: 1, padding: '12px 20px 0', overflowY: 'auto' }}>
        {step === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {TASK_TYPES.map(t => (
              <button key={t.id} onClick={() => update({ type: t.id })} style={{
                padding: '18px 14px',
                background: form.type === t.id ? 'var(--lime)' : '#fff',
                border: `2px solid ${form.type === t.id ? 'var(--lime)' : 'rgba(14,14,16,0.1)'}`,
                borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s',
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{t.emoji}</div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, color: '#0E0E10', marginBottom: 3 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(14,14,16,0.5)' }}>{t.desc}</div>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(14,14,16,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Judul Tugas *
              </label>
              <input
                className="input"
                placeholder="Contoh: Beli kopi di Starbucks"
                value={form.title}
                onChange={e => update({ title: e.target.value })}
                maxLength={60}
              />
              <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(14,14,16,0.35)', marginTop: 4 }}>
                {form.title.length}/60
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(14,14,16,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Deskripsi
              </label>
              <textarea
                className="input"
                rows={4}
                placeholder="Jelaskan detailnya: apa yang dibutuhkan, spesifikasi, dll..."
                value={form.description}
                onChange={e => update({ description: e.target.value })}
              />
            </div>
            {/* Urgent toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', borderRadius: 14, border: '1.5px solid rgba(14,14,16,0.1)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0E0E10' }}>🔥 Tandai sebagai Urgent</div>
                <div style={{ fontSize: 12, color: 'rgba(14,14,16,0.45)' }}>Muncul di posisi atas feed</div>
              </div>
              <div onClick={() => update({ urgent: !form.urgent })} style={{
                width: 46, height: 26, borderRadius: 13,
                background: form.urgent ? 'var(--lime)' : 'rgba(14,14,16,0.12)',
                cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 3, left: form.urgent ? 23 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: form.urgent ? '#0E0E10' : '#fff',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="map-placeholder" style={{ height: 160, borderRadius: 16, marginBottom: 4 }}>
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 4 }}>📍</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#4a6900' }}>
                  {form.neighborhood || 'Pilih lokasi'}
                </div>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(14,14,16,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Kawasan / Kelurahan *
              </label>
              <input
                className="input"
                placeholder="Contoh: Kebayoran Baru"
                value={form.neighborhood}
                onChange={e => update({ neighborhood: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(14,14,16,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Alamat Detail (opsional)
              </label>
              <textarea className="input" rows={2} placeholder="Jl. Melawai Raya No. 12, lt 3..." value={form.location} onChange={e => update({ location: e.target.value })} />
            </div>
            {/* Nearby neighborhoods */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(14,14,16,0.45)', marginBottom: 8 }}>Pilih Cepat</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Kebayoran Baru', 'Sudirman', 'Senopati', 'Melawai', 'Cipete', 'SCBD'].map(n => (
                  <button key={n} onClick={() => update({ neighborhood: n })} style={{
                    padding: '6px 12px', borderRadius: 999,
                    background: form.neighborhood === n ? '#0E0E10' : 'rgba(14,14,16,0.06)',
                    color: form.neighborhood === n ? '#fff' : '#0E0E10',
                    border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  }}>{n}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: 'ASAP', emoji: '⚡', label: 'ASAP', desc: 'Sekarang juga' },
              { id: 'today', emoji: '📅', label: 'Hari ini', desc: 'Dalam beberapa jam' },
              { id: 'tomorrow', emoji: '🌅', label: 'Besok pagi', desc: 'Sebelum jam 10.00' },
              { id: 'schedule', emoji: '🗓', label: 'Jadwalkan', desc: 'Pilih tanggal & jam' },
            ].map(opt => (
              <button key={opt.id} onClick={() => update({ time: opt.id })} style={{
                padding: '16px', background: form.time === opt.id ? 'var(--lime)' : '#fff',
                border: `2px solid ${form.time === opt.id ? 'var(--lime)' : 'rgba(14,14,16,0.1)'}`,
                borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 24 }}>{opt.emoji}</span>
                <div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, color: '#0E0E10' }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(14,14,16,0.5)' }}>{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(14,14,16,0.4)', marginBottom: 10 }}>
                Harga yang kamu tawarkan
              </div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 44, fontWeight: 700, color: '#0E0E10', lineHeight: 1 }}>
                Rp {form.price.toLocaleString('id-ID')}
              </div>
            </div>

            {/* Slider */}
            <input
              type="range" min={15000} max={200000} step={5000}
              value={form.price}
              onChange={e => update({ price: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--lime)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(14,14,16,0.35)' }}>
              <span>Rp 15.000</span><span>Rp 200.000</span>
            </div>

            {/* Quick presets */}
            <div>
              <div style={{ fontSize: 12, color: 'rgba(14,14,16,0.45)', marginBottom: 8, fontWeight: 600 }}>Preset Cepat</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[25000, 35000, 50000, 75000, 100000].map(p => (
                  <button key={p} onClick={() => update({ price: p })} style={{
                    flex: 1, padding: '8px 0',
                    background: form.price === p ? '#0E0E10' : 'rgba(14,14,16,0.06)',
                    color: form.price === p ? '#fff' : '#0E0E10',
                    border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  }}>
                    {p >= 1000 ? `${p/1000}k` : p}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(212,255,63,0.08)', borderRadius: 12, fontSize: 13, color: 'rgba(14,14,16,0.6)' }}>
              💡 Tugas serupa di area ini biasanya dihargai antara <strong style={{ color: '#0E0E10' }}>Rp 30.000 – Rp 60.000</strong>
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ marginBottom: 12 }}>
                <TypeChip type={form.type || 'errand'} urgent={form.urgent} />
              </div>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, color: '#0E0E10', marginBottom: 8 }}>
                {form.title || '(judul kosong)'}
              </h3>
              {form.description && (
                <p style={{ fontSize: 13, color: 'rgba(14,14,16,0.6)', marginBottom: 12, lineHeight: 1.5 }}>{form.description}</p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <MetaRow icon="📍" label={form.neighborhood || '—'} />
                <MetaRow icon="⏱" label={form.time === 'ASAP' ? 'ASAP' : form.time} />
              </div>
            </div>

            <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, color: 'rgba(14,14,16,0.5)' }}>Harga yang ditawarkan</div>
              <PriceTag price={form.price} size="lg" />
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(14,14,16,0.04)', borderRadius: 12, fontSize: 12, color: 'rgba(14,14,16,0.5)', lineHeight: 1.5 }}>
              Dengan memposting, kamu menyetujui bahwa pembayaran akan dipegang oleh DUIT! hingga tugas selesai dan dikonfirmasi.
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: '16px 20px 32px', background: '#FAF8F3', borderTop: '1px solid rgba(14,14,16,0.06)' }}>
        <button
          className="btn btn-primary"
          disabled={!canNext()}
          onClick={step === STEPS.length - 1 ? onPost : next}
          style={{ opacity: canNext() ? 1 : 0.4 }}
        >
          {step === STEPS.length - 1 ? '🚀 Post Sekarang!' : 'Lanjut →'}
        </button>
      </div>
    </div>
  );
}

function MetaRow({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(14,14,16,0.6)' }}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function PostedSuccess({ onDone }) {
  return (
    <div className="fade-in" style={{
      background: '#FAF8F3', minHeight: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 40, textAlign: 'center',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'var(--lime)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 36, marginBottom: 20,
        boxShadow: '0 8px 32px rgba(212,255,63,0.4)',
      }}>
        ✓
      </div>
      <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 700, color: '#0E0E10', marginBottom: 10 }}>
        Tugas Diposting!
      </h2>
      <p style={{ fontSize: 14, color: 'rgba(14,14,16,0.55)', lineHeight: 1.6, marginBottom: 28 }}>
        Tugasmu sudah live di marketplace. Kami akan memberi tahu kamu segera saat ada yang menerima.
      </p>
      <button className="btn btn-primary" style={{ maxWidth: 280 }} onClick={onDone}>
        Lihat Status Tugas
      </button>
    </div>
  );
}
