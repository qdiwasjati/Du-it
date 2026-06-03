// ─── AI Hub ────────────────────────────────────────────────────────────────────

function AIHub({ onBack, agentLogs, onRunPoster, onRunDoer, posterBusy, doerBusy, doerAutopilot, onToggleAutopilot, apiStatus }) {
  return (
    <div className="slide-up" style={{ background: '#0E0E10', minHeight: '100%', color: '#fff' }}>
      <div style={{ padding: '12px 20px' }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
          padding: '8px 0',
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 5L7 10L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Kembali
        </button>
      </div>

      <div style={{ padding: '0 20px 100px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 999,
            background: 'rgba(212,255,63,0.1)', border: '1px solid rgba(212,255,63,0.2)',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--lime)',
            letterSpacing: '0.06em', marginBottom: 10,
          }}>
            <span className={apiStatus === 'live' ? 'pulse' : ''} style={{ width: 6, height: 6, borderRadius: '50%', background: apiStatus === 'live' ? 'var(--lime)' : '#94a3b8', display: 'inline-block' }} />
            {apiStatus === 'live' ? 'CLAUDE API · LIVE' : 'OFFLINE · SIM MODE'}
          </div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
            AI Agents ✦
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
            Dua agen AI yang membantu poster dan doer otomatis
          </p>
        </div>

        {/* ARIA Agent card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, padding: '20px', marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 14,
                background: 'rgba(212,255,63,0.15)', border: '1px solid rgba(212,255,63,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>✦</div>
              <div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 700 }}>ARIA</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>AI Poster Assistant</div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: 'rgba(212,255,63,0.12)', color: 'var(--lime)' }}>
              Ready
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 16 }}>
            Tulis tugas dalam bahasa sehari-hari, ARIA akan menyusun judul, deskripsi, harga, dan lokasi secara otomatis menggunakan Claude.
          </p>
          <button
            onClick={onRunPoster}
            disabled={posterBusy}
            style={{
              width: '100%', padding: '13px', borderRadius: 12,
              background: posterBusy ? 'rgba(212,255,63,0.3)' : 'var(--lime)',
              color: '#0E0E10', border: 'none', cursor: posterBusy ? 'not-allowed' : 'pointer',
              fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {posterBusy ? (
              <>
                <span className="spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(14,14,16,0.3)', borderTopColor: '#0E0E10', borderRadius: '50%' }} />
                ARIA sedang bekerja...
              </>
            ) : (
              '✦ Buat Tugas dengan ARIA'
            )}
          </button>
        </div>

        {/* NOVA Agent card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, padding: '20px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 14,
                background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>⚡</div>
              <div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 700 }}>NOVA</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>AI Doer Agent</div>
              </div>
            </div>
            {/* Autopilot toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Auto</span>
              <div onClick={onToggleAutopilot} style={{
                width: 40, height: 22, borderRadius: 11,
                background: doerAutopilot ? 'var(--lime)' : 'rgba(255,255,255,0.1)',
                cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: doerAutopilot ? 20 : 2,
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 16 }}>
            NOVA memindai feed dan memilih tugas terbaik berdasarkan preferensi kamu — jarak, harga, dan jenis tugas — lalu kirim penawaran.
          </p>
          {doerAutopilot && (
            <div style={{ padding: '10px 12px', background: 'rgba(212,255,63,0.08)', borderRadius: 10, marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lime)', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Autopilot aktif · memantau feed setiap 30 detik</span>
            </div>
          )}
          <button
            onClick={onRunDoer}
            disabled={doerBusy}
            style={{
              width: '100%', padding: '13px', borderRadius: 12,
              background: doerBusy ? 'rgba(59,130,246,0.3)' : '#3b82f6',
              color: '#fff', border: 'none', cursor: doerBusy ? 'not-allowed' : 'pointer',
              fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {doerBusy ? (
              <>
                <span className="spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                NOVA memindai tugas...
              </>
            ) : (
              '⚡ Jalankan NOVA'
            )}
          </button>
        </div>

        {/* Agent log */}
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Agent Log
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.4)', borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '14px', fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, maxHeight: 200, overflowY: 'auto',
          }}>
            {agentLogs.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.2)', padding: '8px 0' }}>Belum ada aktivitas…</div>
            ) : (
              agentLogs.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
                  <span style={{ color: l.agent === 'aria' ? 'var(--lime)' : '#60a5fa', flexShrink: 0, fontWeight: 700 }}>
                    [{l.agent.toUpperCase()}]
                  </span>
                  <span style={{ flex: 1 }}>{l.text}</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{l.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ARIA Composer ────────────────────────────────────────────────────────────

function AriaComposer({ onClose, onSubmit, draft, busy, result }) {
  const [prompt, setPrompt] = React.useState(draft || '');

  return (
    <div className="slide-up" style={{ background: '#0E0E10', minHeight: '100%', color: '#fff' }}>
      <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 5L7 10L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Kembali
        </button>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--lime)', letterSpacing: '0.08em' }}>
          ✦ ARIA COMPOSER
        </div>
      </div>

      <div style={{ padding: '0 20px 80px' }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          Ceritakan tugasmu
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.5 }}>
          Tulis dalam bahasa apapun — ARIA akan menyusun postingan yang sempurna.
        </p>

        {/* Input */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={4}
            placeholder="Contoh: butuh tolong beliin kopi di starbucks pls asap, mau caramel macchiato sama americano, bayar cash gw ganti"
            style={{
              width: '100%', padding: '16px',
              background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)',
              borderRadius: 16, color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 14,
              lineHeight: 1.5, outline: 'none', resize: 'none',
            }}
          />
        </div>

        {/* Example prompts */}
        {!result && !busy && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>
              CONTOH PROMPT
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Tolong anterin dokumen kontrak ke notaris di sudirman jam 2 siang',
                'Bantuin setting wifi router tp-link yang baru',
                'Fotokopi KTP 5 lembar di alfamart terdekat',
              ].map(ex => (
                <button key={ex} onClick={() => setPrompt(ex)} style={{
                  padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                  color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'Inter, sans-serif',
                }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Busy state */}
        {busy && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: 40, height: 40, border: '3px solid rgba(212,255,63,0.2)', borderTopColor: 'var(--lime)', borderRadius: '50%', margin: '0 auto 14px' }} className="spin" />
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>ARIA sedang menyusun tugasmu…</div>
          </div>
        )}

        {/* Result */}
        {result && !busy && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--lime)', marginBottom: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>
              ✦ DRAFT DARI ARIA
            </div>
            <div style={{ background: 'rgba(212,255,63,0.05)', border: '1px solid rgba(212,255,63,0.15)', borderRadius: 16, padding: '16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'rgba(212,255,63,0.15)', color: 'var(--lime)', textTransform: 'uppercase' }}>
                  {result.type}
                </span>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--lime)' }}>
                  Rp {(result.price || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                {result.title}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 12, lineHeight: 1.5 }}>
                {result.description}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                <span>📍 {result.location}</span>
                <span>⏱ {result.time}</span>
                <span>🛣 {result.distance} km</span>
              </div>
              {result.note && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                  ARIA: {result.note}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => onSubmit(prompt, true)}
                style={{ flex: 1, padding: '13px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                🔄 Coba Lagi
              </button>
              <button
                onClick={() => onSubmit(prompt, false, 'post')}
                style={{ flex: 2, padding: '13px', borderRadius: 12, background: 'var(--lime)', color: '#0E0E10', border: 'none', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700 }}>
                🚀 Post Sekarang!
              </button>
            </div>
          </div>
        )}

        {/* CTA when no result */}
        {!result && !busy && (
          <button
            className="btn btn-primary"
            onClick={() => onSubmit(prompt)}
            disabled={prompt.trim().length < 3}
            style={{ opacity: prompt.trim().length < 3 ? 0.4 : 1 }}
          >
            ✦ Buat Draft dengan ARIA
          </button>
        )}
      </div>
    </div>
  );
}
