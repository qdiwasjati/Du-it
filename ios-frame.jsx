function IOSDevice({ width = 390, height = 844, dark = false, children }) {
  const bezelColor = dark ? '#1a1a1a' : '#f5f5f0';
  const screenBg = dark ? '#000' : '#FAF8F3';
  const sideColor = dark ? '#2a2a2a' : '#e8e8e3';

  return (
    <div style={{
      width: width + 28,
      height: height + 56,
      background: bezelColor,
      borderRadius: 56,
      padding: 14,
      boxShadow: `
        inset 0 0 0 1.5px ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)'},
        0 40px 100px rgba(0,0,0,0.45),
        0 8px 24px rgba(0,0,0,0.25)
      `,
      position: 'relative',
      flexShrink: 0,
    }}>
      {/* Side buttons */}
      <div style={{
        position: 'absolute', left: -3, top: 120,
        width: 3, height: 36, background: sideColor, borderRadius: '3px 0 0 3px',
      }} />
      <div style={{
        position: 'absolute', left: -3, top: 170,
        width: 3, height: 56, background: sideColor, borderRadius: '3px 0 0 3px',
      }} />
      <div style={{
        position: 'absolute', left: -3, top: 240,
        width: 3, height: 56, background: sideColor, borderRadius: '3px 0 0 3px',
      }} />
      <div style={{
        position: 'absolute', right: -3, top: 190,
        width: 3, height: 80, background: sideColor, borderRadius: '0 3px 3px 0',
      }} />

      {/* Screen */}
      <div style={{
        width: width,
        height: height,
        background: screenBg,
        borderRadius: 44,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Dynamic island */}
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 34, background: dark ? '#000' : bezelColor,
          borderRadius: 20, zIndex: 200,
          boxShadow: `0 0 0 1px ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)'}`,
        }} />

        {/* Status bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 54, zIndex: 199,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
          fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
          color: dark ? '#fff' : '#0E0E10',
        }}>
          <span>9:41</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
            {/* Signal */}
            <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
              <rect x="0" y="4" width="3" height="8" rx="1" opacity="1"/>
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" opacity="1"/>
              <rect x="9" y="0.5" width="3" height="11.5" rx="1" opacity="1"/>
              <rect x="13.5" y="0" width="3" height="12" rx="1" opacity="0.3"/>
            </svg>
            {/* Wifi */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
              <path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
              <path d="M8 6C9.6 6 11 6.6 12.1 7.6L13.5 6.2C12 4.8 10.1 4 8 4s-4 .8-5.5 2.2l1.4 1.4C5 6.6 6.4 6 8 6z" opacity="0.7"/>
              <path d="M8 2.5c2.6 0 5 1 6.8 2.6L16 3.9C13.8 1.9 11.1.5 8 .5S2.2 1.9 0 3.9l1.2 1.2C3 3.5 5.4 2.5 8 2.5z" opacity="0.4"/>
            </svg>
            {/* Battery */}
            <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor">
              <rect x="0" y="1" width="21" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.35"/>
              <rect x="22" y="4" width="2" height="4" rx="1" opacity="0.4"/>
              <rect x="1.5" y="2.5" width="17" height="7" rx="1.5" opacity="0.9"/>
            </svg>
          </div>
        </div>

        {/* Content */}
        <div style={{ position: 'absolute', inset: 0, paddingTop: 54 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
