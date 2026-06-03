// ─── My Tasks Page ────────────────────────────────────────────────────────────

function TasksPage({ pov, onOpenTask, onOpenTracker }) {
  const [activeTab, setActiveTab] = React.useState('active');

  const posterActive = [
    { ...TASKS[0], status: 'accepted', doer: 'Andi R.' },
    { ...TASKS[3], status: 'posted', doer: null },
  ];
  const doerActive = [
    { ...TASKS[1], status: 'progress', poster: TASKS[1].poster },
  ];
  const history = [
    { ...TASKS[4], status: 'paid', date: '2 hari lalu' },
    { ...TASKS[5], status: 'paid', date: '5 hari lalu' },
  ];

  const active = pov === 'poster' ? posterActive : doerActive;
  const tabs = ['active', 'history'];

  return (
    <div style={{ background: '#FAF8F3', minHeight: '100%' }}>
      <div style={{ padding: '4px 20px 0' }}>
        <PageHeader title="Tugasku" subtitle={pov === 'doer' ? 'Tugas yang kamu kerjakan' : 'Tugas yang kamu posting'} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '0 20px 16px', background: 'rgba(14,14,16,0.03)' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            flex: 1, padding: '10px',
            background: activeTab === t ? '#0E0E10' : 'transparent',
            color: activeTab === t ? '#fff' : 'rgba(14,14,16,0.5)',
            border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            textTransform: 'capitalize',
          }}>
            {t === 'active' ? 'Aktif' : 'Riwayat'}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px 100px' }}>
        {activeTab === 'active' ? (
          active.length === 0 ? (
            <EmptyState icon="📋" title="Tidak ada tugas aktif" desc="Tugas yang aktif akan muncul di sini" />
          ) : (
            active.map(t => (
              <ActiveTaskCard key={t.id} task={t} pov={pov} onOpen={() => onOpenTracker()} />
            ))
          )
        ) : (
          history.map(t => (
            <HistoryCard key={t.id} task={t} />
          ))
        )}
      </div>
    </div>
  );
}

function ActiveTaskCard({ task, pov, onOpen }) {
  const statusMap = {
    posted:    { label: 'Menunggu Doer', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
    accepted:  { label: 'Doer Diterima', color: '#4a6900', bg: 'rgba(212,255,63,0.12)' },
    progress:  { label: 'Sedang Dikerjakan', color: '#1d4ed8', bg: 'rgba(59,130,246,0.1)' },
    completed: { label: 'Selesai — Konfirmasi?', color: '#16a34a', bg: 'rgba(34,197,94,0.1)' },
  };
  const s = statusMap[task.status] || statusMap.posted;

  return (
    <div className="card" style={{ padding: '16px', marginBottom: 10, cursor: 'pointer' }} onClick={onOpen}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <TypeChip type={task.type} urgent={task.urgent} />
        <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: s.bg, color: s.color }}>{s.label}</span>
      </div>
      <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, color: '#0E0E10', marginBottom: 10 }}>
        {task.title}
      </h4>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PriceTag price={task.price} size="sm" />
        <span style={{ fontSize: 12, color: 'rgba(14,14,16,0.45)' }}>
          {task.doer ? `Doer: ${task.doer}` : `${task.distance} km`}
        </span>
      </div>
    </div>
  );
}

function HistoryCard({ task }) {
  return (
    <div className="card" style={{ padding: '14px 16px', marginBottom: 10, opacity: 0.8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <TypeChip type={task.type} />
        <span style={{ fontSize: 11, color: 'rgba(14,14,16,0.4)' }}>{task.date}</span>
      </div>
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: '#0E0E10', marginBottom: 6 }}>
        {task.title}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PriceTag price={task.price} size="sm" />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: 'rgba(34,197,94,0.1)', padding: '3px 8px', borderRadius: 999 }}>✓ Selesai</span>
      </div>
    </div>
  );
}

// ─── Activity Page ────────────────────────────────────────────────────────────

function ActivityPage({ onOpenMessages }) {
  const notifications = [
    { id: 1, type: 'accepted', icon: '✦', title: 'Andi R. menerima tugasmu', desc: 'Beli kopi Starbucks di Plaza Senayan', time: '2 mnt lalu', unread: true },
    { id: 2, type: 'message',  icon: '💬', title: 'Pesan dari Budi H.', desc: 'Dokumen sudah saya ambil, dalam perjalanan', time: '15 mnt lalu', unread: true },
    { id: 3, type: 'payment',  icon: '💸', title: 'Pembayaran diterima!', desc: 'Rp 65.000 dari Sari M. masuk ke saldo', time: '1 jam lalu', unread: false },
    { id: 4, type: 'rating',   icon: '⭐', title: 'Kamu mendapat rating baru', desc: 'Dewi P. memberi ⭐⭐⭐⭐⭐', time: '3 jam lalu', unread: false },
    { id: 5, type: 'new',      icon: '📋', title: 'Tugas baru di dekatmu', desc: 'Fotokopi di Melawai · Rp 25.000 · 0.3 km', time: 'Kemarin', unread: false },
  ];

  return (
    <div style={{ background: '#FAF8F3', minHeight: '100%' }}>
      <div style={{ padding: '4px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }}>
          <PageHeader title="Aktivitas" />
          <button onClick={onOpenMessages} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 999,
            background: '#0E0E10', color: '#fff',
            border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            💬 Pesan
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px 100px' }}>
        {notifications.map(n => (
          <div key={n.id} style={{
            display: 'flex', gap: 12, padding: '14px 0',
            borderBottom: '1px solid rgba(14,14,16,0.06)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: n.unread ? 'rgba(212,255,63,0.15)' : 'rgba(14,14,16,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              {n.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <div style={{ fontSize: 14, fontWeight: n.unread ? 700 : 500, color: '#0E0E10' }}>{n.title}</div>
                {n.unread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--lime)', flexShrink: 0, marginTop: 5 }} />}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(14,14,16,0.55)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.desc}</div>
              <div style={{ fontSize: 11, color: 'rgba(14,14,16,0.35)' }}>{n.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Messages Page ────────────────────────────────────────────────────────────

function MessagesPage({ onBack }) {
  const [active, setActive] = React.useState(null);
  const convos = [
    { id: 1, name: 'Andi R.', avatar: 'AR', lastMsg: 'Oke, saya sedang dalam perjalanan!', time: '2 mnt', unread: 2 },
    { id: 2, name: 'Budi H.', avatar: 'BH', lastMsg: 'Dokumen sudah saya ambil', time: '15 mnt', unread: 0 },
    { id: 3, name: 'Dewi P.', avatar: 'DP', lastMsg: 'Terima kasih ya!', time: '1 jam', unread: 0 },
  ];

  if (active) {
    return <ChatView convo={convos.find(c => c.id === active)} onBack={() => setActive(null)} />;
  }

  return (
    <div className="slide-up" style={{ background: '#FAF8F3', minHeight: '100%' }}>
      <div style={{ padding: '12px 20px 16px' }}>
        <BackButton onBack={onBack} />
        <PageHeader title="Pesan" />
      </div>
      <div style={{ padding: '0 20px 100px' }}>
        {convos.map(c => (
          <div key={c.id} onClick={() => setActive(c.id)} style={{
            display: 'flex', gap: 12, padding: '14px 0',
            borderBottom: '1px solid rgba(14,14,16,0.06)', cursor: 'pointer',
          }}>
            <div style={{ position: 'relative' }}>
              <Avatar initials={c.avatar} size={46} />
              {c.unread > 0 && (
                <div style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--lime)', fontSize: 10, fontWeight: 700,
                  color: '#0E0E10', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #FAF8F3',
                }}>{c.unread}</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0E0E10' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(14,14,16,0.35)' }}>{c.time}</div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(14,14,16,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.lastMsg}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatView({ convo, onBack }) {
  const [msg, setMsg] = React.useState('');
  const msgs = [
    { from: 'them', text: 'Halo! Saya sudah terima tugasnya ya', time: '14:30' },
    { from: 'me',   text: 'Oke, terima kasih! Sudah di mana?', time: '14:31' },
    { from: 'them', text: 'Oke, saya sedang dalam perjalanan!', time: '14:32' },
  ];
  return (
    <div style={{ background: '#FAF8F3', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 20px 12px', borderBottom: '1px solid rgba(14,14,16,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackButton onBack={onBack} />
        <Avatar initials={convo.avatar} size={34} />
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, color: '#0E0E10' }}>{convo.name}</div>
      </div>
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '75%', padding: '10px 14px', borderRadius: m.from === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.from === 'me' ? '#0E0E10' : '#fff',
              color: m.from === 'me' ? '#fff' : '#0E0E10',
              fontSize: 14, lineHeight: 1.4,
              border: m.from === 'me' ? 'none' : '1px solid rgba(14,14,16,0.08)',
            }}>
              {m.text}
              <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>{m.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 16px 32px', borderTop: '1px solid rgba(14,14,16,0.08)', display: 'flex', gap: 8 }}>
        <input className="input" style={{ flex: 1, padding: '10px 14px' }} placeholder="Ketik pesan..." value={msg} onChange={e => setMsg(e.target.value)} />
        <button style={{
          width: 42, height: 42, borderRadius: '50%', background: 'var(--lime)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>↑</button>
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

function ProfilePage({ onOpenVerify }) {
  const user = { name: 'Kamu', avatar: 'KM', rating: 4.8, tasksPosted: 12, tasksDone: 34, earned: 1250000, verified: false };

  return (
    <div style={{ background: '#FAF8F3', minHeight: '100%' }}>
      <div style={{ padding: '4px 20px 0' }}>
        <PageHeader title="Profil" right={
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>⚙️</button>
        } />
      </div>

      <div style={{ padding: '0 20px 100px' }}>
        {/* Profile card */}
        <div className="card" style={{ padding: '20px', marginBottom: 16, textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--lime), #a8cc00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#0E0E10',
            margin: '0 auto 12px',
          }}>
            {user.avatar}
          </div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700, color: '#0E0E10', marginBottom: 2 }}>
            {user.name}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(14,14,16,0.45)', marginBottom: 14 }}>
            📍 Kebayoran Baru, Jakarta
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '14px 0', borderTop: '1px solid rgba(14,14,16,0.07)', borderBottom: '1px solid rgba(14,14,16,0.07)', marginBottom: 14 }}>
            {[
              { v: `⭐ ${user.rating}`, l: 'Rating' },
              { v: user.tasksPosted, l: 'Diposting' },
              { v: user.tasksDone, l: 'Diselesaikan' },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, color: '#0E0E10' }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'rgba(14,14,16,0.4)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Earned */}
          <div style={{ background: 'rgba(212,255,63,0.08)', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: 'rgba(14,14,16,0.5)' }}>Total diperoleh</div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, color: '#0E0E10' }}>
              Rp {user.earned.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Verification */}
        {!user.verified && (
          <div onClick={onOpenVerify} className="card" style={{ padding: '16px', marginBottom: 16, cursor: 'pointer', borderColor: 'rgba(255,183,0,0.3)', background: 'rgba(255,183,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>🔓</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0E0E10' }}>Verifikasi Identitas</div>
                <div style={{ fontSize: 12, color: 'rgba(14,14,16,0.5)' }}>Tingkatkan kepercayaan & batas task</div>
              </div>
              <span style={{ fontSize: 16, color: 'rgba(14,14,16,0.3)' }}>›</span>
            </div>
          </div>
        )}

        {/* Menu items */}
        {[
          { icon: '💰', label: 'Saldo & Penarikan', sub: `Rp ${(user.earned * 0.1).toLocaleString('id-ID')} tersedia` },
          { icon: '🔔', label: 'Notifikasi', sub: 'Atur preferensi notifikasi' },
          { icon: '🛡', label: 'Keamanan', sub: 'PIN, biometrik, 2FA' },
          { icon: '❓', label: 'Bantuan', sub: 'FAQ & hubungi support' },
        ].map(item => (
          <div key={item.label} className="card" style={{ padding: '14px 16px', marginBottom: 8, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0E0E10' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(14,14,16,0.45)' }}>{item.sub}</div>
              </div>
              <span style={{ fontSize: 16, color: 'rgba(14,14,16,0.25)' }}>›</span>
            </div>
          </div>
        ))}

        <button style={{ width: '100%', marginTop: 8, padding: '14px', borderRadius: 14, background: 'transparent', border: '1.5px solid rgba(255,50,50,0.2)', color: '#dc2626', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Keluar
        </button>
      </div>
    </div>
  );
}

// ─── Verification Page ────────────────────────────────────────────────────────

function VerificationPage({ onBack, onDone }) {
  const [step, setStep] = React.useState(0);
  const steps = [
    { icon: '📋', title: 'KTP / NIK', desc: 'Foto KTP atau masukkan NIK kamu' },
    { icon: '🤳', title: 'Selfie', desc: 'Selfie pegang KTP' },
    { icon: '✅', title: 'Review', desc: 'Sedang diproses' },
  ];

  return (
    <div className="slide-up" style={{ background: '#FAF8F3', minHeight: '100%' }}>
      <div style={{ padding: '12px 20px' }}>
        <BackButton onBack={onBack} />
      </div>
      <div style={{ padding: '0 20px 60px' }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, color: '#0E0E10', marginBottom: 6 }}>
          Verifikasi Identitas
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(14,14,16,0.5)', marginBottom: 20, lineHeight: 1.5 }}>
          Verifikasi meningkatkan kepercayaan dan membuka fitur lebih banyak.
        </p>

        {/* Progress */}
        <div className="progress-bar" style={{ marginBottom: 20 }}>
          <div className="progress-fill" style={{ width: `${(step / (steps.length - 1)) * 100}%` }} />
        </div>

        {steps.map((s, i) => (
          <div key={i} style={{
            display: 'flex', gap: 14, padding: '16px',
            background: i === step ? '#fff' : 'transparent',
            border: `1.5px solid ${i === step ? 'rgba(14,14,16,0.15)' : 'transparent'}`,
            borderRadius: 14, marginBottom: 10, alignItems: 'center',
            opacity: i > step ? 0.4 : 1,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: i < step ? 'var(--lime)' : i === step ? '#0E0E10' : 'rgba(14,14,16,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i < step ? 18 : 22,
            }}>
              {i < step ? '✓' : s.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0E0E10' }}>{s.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(14,14,16,0.5)' }}>{s.desc}</div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 24 }}>
          {step < steps.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
              {step === 0 ? '📷 Foto KTP' : '🤳 Ambil Selfie'}
            </button>
          ) : (
            <div>
              <div style={{ textAlign: 'center', padding: '20px 0', marginBottom: 16 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>⏳</div>
                <div style={{ fontSize: 14, color: 'rgba(14,14,16,0.5)' }}>Sedang diproses (1-2 jam kerja)</div>
              </div>
              <button className="btn btn-primary" onClick={onDone}>Kembali ke Profil</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon, title, desc }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: 'rgba(14,14,16,0.35)' }}>
      <div style={{ fontSize: 42, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'rgba(14,14,16,0.5)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13 }}>{desc}</div>
    </div>
  );
}
