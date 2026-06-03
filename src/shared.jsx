// ─── Shared data ────────────────────────────────────────────────────────────

const TASKS = [
  {
    id: 't1', type: 'errand', title: 'Beli kopi Starbucks di Plaza Senayan',
    description: 'Tolong belikan 1 Caramel Macchiato Grande + 1 Americano. Bayar pakai cash, nanti diganti.',
    price: 45000, distance: 0.8, time: '12 mnt', location: 'Kebayoran Baru',
    poster: { name: 'Rina S.', rating: 4.9, jobs: 23, avatar: 'RS' },
    urgent: true,
  },
  {
    id: 't2', type: 'delivery', title: 'Antar dokumen ke Kantor Notaris Sudirman',
    description: 'Dokumen sudah siap di lobi Menara BCA. Perlu tanda terima.',
    price: 65000, distance: 1.4, time: '18 mnt', location: 'Sudirman',
    poster: { name: 'Budi H.', rating: 4.7, jobs: 41, avatar: 'BH' },
  },
  {
    id: 't3', type: 'help', title: 'Bantu setting WiFi router baru',
    description: 'Router TP-Link baru, perlu diconfig. Ada manual book-nya.',
    price: 80000, distance: 0.5, time: '6 mnt', location: 'Senopati',
    poster: { name: 'Dewi P.', rating: 5.0, jobs: 8, avatar: 'DP' },
  },
  {
    id: 't4', type: 'errand', title: 'Print & fotokopi dokumen KTP',
    description: '5 lembar fotokopi KTP + 2 lembar print CV. Di Alfamart mana aja.',
    price: 25000, distance: 0.3, time: '4 mnt', location: 'Melawai',
    poster: { name: 'Agus W.', rating: 4.8, jobs: 15, avatar: 'AW' },
    urgent: true,
  },
  {
    id: 't5', type: 'delivery', title: 'Jemput laundry dari Laundrette 88',
    description: 'Laundry atas nama Sari, sudah bayar. Antar ke Jl. Widya Chandra III no 12.',
    price: 35000, distance: 1.2, time: '15 mnt', location: 'Cipete',
    poster: { name: 'Sari M.', rating: 4.6, jobs: 7, avatar: 'SM' },
  },
  {
    id: 't6', type: 'other', title: 'Temani interview kerja (moral support)',
    description: 'Interview di SCBD jam 2 siang. Butuh teman nunggu di luar.',
    price: 50000, distance: 1.9, time: '22 mnt', location: 'SCBD',
    poster: { name: 'Kevin L.', rating: 4.5, jobs: 3, avatar: 'KL' },
  },
];

// ─── Shared UI components ───────────────────────────────────────────────────

function TypeChip({ type, urgent }) {
  const labels = { errand: 'Errand', delivery: 'Delivery', help: 'Bantuan', other: 'Lainnya' };
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <span className={`chip chip-${type}`}>{labels[type] || type}</span>
      {urgent && <span className="chip chip-urgent">URGENT</span>}
    </div>
  );
}

function PriceTag({ price, size = 'md' }) {
  const sizes = { sm: { f: 13, sub: 10 }, md: { f: 17, sub: 11 }, lg: { f: 24, sub: 13 } };
  const s = sizes[size];
  return (
    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: s.f, color: '#0E0E10' }}>
      Rp {price.toLocaleString('id-ID')}
      <span style={{ fontSize: s.sub, fontWeight: 500, color: 'rgba(14,14,16,0.45)', marginLeft: 2 }}>/task</span>
    </span>
  );
}

function DistanceBadge({ distance, time }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'rgba(14,14,16,0.5)', display: 'flex', alignItems: 'center', gap: 3 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6 1C3.8 1 2 2.8 2 5c0 3 4 7 4 7s4-4 4-7c0-2.2-1.8-4-4-4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        </svg>
        {distance} km
      </span>
      <span style={{ fontSize: 12, color: 'rgba(14,14,16,0.5)', display: 'flex', alignItems: 'center', gap: 3 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {time}
      </span>
    </div>
  );
}

function Avatar({ initials, size = 36, color }) {
  const bg = color || 'rgba(212,255,63,0.2)';
  return (
    <div className="avatar" style={{
      width: size, height: size,
      background: bg, fontSize: size * 0.33,
      color: '#0E0E10',
    }}>
      {initials}
    </div>
  );
}

function PosterInfo({ poster, compact = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Avatar initials={poster.avatar} size={compact ? 28 : 32} />
      <div>
        <div style={{ fontSize: compact ? 12 : 13, fontWeight: 600, color: '#0E0E10' }}>{poster.name}</div>
        <div style={{ fontSize: 11, color: 'rgba(14,14,16,0.45)', display: 'flex', gap: 6 }}>
          <span>⭐ {poster.rating}</span>
          <span>·</span>
          <span>{poster.jobs} task</span>
        </div>
      </div>
    </div>
  );
}

function BackButton({ onBack, label = '' }) {
  return (
    <button onClick={onBack} style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#0E0E10',
      padding: '8px 0',
    }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12 5L7 10L12 15" stroke="#0E0E10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {label}
    </button>
  );
}

function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 700, color: '#0E0E10' }}>
        {title}
      </h3>
      {action && (
        <button onClick={onAction} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: 'rgba(14,14,16,0.45)',
        }}>
          {action}
        </button>
      )}
    </div>
  );
}

function BottomTabs({ active, onChange, pov }) {
  const tabs = [
    { id: 'home', label: 'Beranda', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
          stroke="currentColor" strokeWidth="1.8" fill={a ? 'currentColor' : 'none'} strokeLinejoin="round"/>
        <path d="M8 20v-7h6v7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    )},
    { id: 'tasks', label: 'Tugas', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" fill={a ? 'currentColor' : 'none'}/>
        <path d="M7 8h8M7 11h8M7 14h5" stroke={a ? '#FAF8F3' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )},
    { id: 'create', label: '', icon: () => (
      <div style={{
        width: 50, height: 50, borderRadius: '50%',
        background: 'var(--lime)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginTop: -22,
        boxShadow: '0 4px 16px rgba(212,255,63,0.45)',
      }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 5v12M5 11h12" stroke="#0E0E10" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>
    )},
    { id: 'activity', label: 'Aktivitas', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 13l4-4 3 3 4-5 3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="3" y="3" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" fill={a ? 'currentColor' : 'none'}/>
        {a && <path d="M4 13l4-4 3 3 4-5 3 2" stroke="#FAF8F3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>}
      </svg>
    )},
    { id: 'profile', label: 'Profil', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" fill={a ? 'currentColor' : 'none'}/>
        <path d="M4 19c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )},
  ];

  return (
    <div className="bottom-nav">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '0 8px' }}>
        {tabs.map(t => {
          const isActive = active === t.id;
          if (t.id === 'create') {
            return (
              <button key={t.id} onClick={() => onChange(t.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
                padding: '0 4px',
              }}>
                {t.icon(false)}
              </button>
            );
          }
          return (
            <button key={t.id} onClick={() => onChange(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '6px 8px',
              color: isActive ? 'var(--lime)' : 'rgba(14,14,16,0.4)',
              transition: 'color 0.15s',
            }}>
              {t.icon(isActive)}
              <span style={{ fontSize: 10, fontWeight: 600 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, onBack, right }) {
  return (
    <div style={{ padding: '8px 20px 12px', position: 'relative' }}>
      {onBack && (
        <div style={{ marginBottom: 4 }}>
          <BackButton onBack={onBack} />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 22, fontWeight: 700, color: '#0E0E10', letterSpacing: '-0.02em',
          }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 13, color: 'rgba(14,14,16,0.5)', marginTop: 2 }}>{subtitle}</p>}
        </div>
        {right}
      </div>
    </div>
  );
}
