// landing-app.jsx — mounts the REAL DUIT app inline on the landing page.
// Reuses the same components as DUIT Prototype.html (no iframe, no nested web page).
// The "Jump to screen" buttons drive the app's screen state directly.

function LandingAppPreview() {
  const [screen, setScreen] = React.useState('home');
  const [tab, setTab] = React.useState('home');
  const [pov, setPov] = React.useState('doer');
  const [openTaskId, setOpenTaskId] = React.useState('t1');
  const [trackerStage, setTrackerStage] = React.useState('accepted');

  // AI state
  const [agentLogs, setAgentLogs] = React.useState([]);
  const [posterBusy, setPosterBusy] = React.useState(false);
  const [doerBusy, setDoerBusy] = React.useState(false);
  const [doerAutopilot, setDoerAutopilot] = React.useState(false);
  const [ariaResult, setAriaResult] = React.useState(null);
  const [ariaPrompt, setAriaPrompt] = React.useState('');
  const [apiStatus, setApiStatus] = React.useState('live');

  const addLog = (agent, text) => {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAgentLogs(prev => [{ agent, text, time }, ...prev].slice(0, 50));
  };

  const runAria = async (prompt) => {
    if (!prompt || prompt.trim().length < 3) return;
    setPosterBusy(true);
    setAriaResult(null);
    setAriaPrompt(prompt);
    addLog('aria', `received request: "${prompt.slice(0, 60)}${prompt.length > 60 ? '…' : ''}"`);
    addLog('aria', 'classifying type · estimating distance · drafting copy');

    const sys = `You are ARIA, an AI agent for DUIT, a hyper-local task marketplace in Jakarta, Indonesia. Users speak mostly Bahasa Indonesia but some English. Currency is IDR. Given a short user prompt, output ONE task as strict JSON:
{"type":"errand|delivery|help|other","title":"<~50 char title>","description":"<~200 char clear detail>","price":<integer IDR 15000-200000>,"distance":<0.2-5 km>,"location":"<neighborhood>","time":"<ASAP | Today HH:MM | Tomorrow morning>","note":"<one-sentence friendly summary for the user from ARIA>"}
Output ONLY the JSON, no markdown, no prose. Match the language of the input for title/description.`;

    try {
      const text = await window.claude.complete({
        messages: [{ role: 'user', content: `${sys}\n\nUser prompt: ${prompt}` }]
      });
      const json = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
      setAriaResult(json);
      addLog('aria', `drafted: "${json.title}" · ${json.type} · Rp ${json.price.toLocaleString('id-ID')}`);
      setApiStatus('live');
    } catch (e) {
      const fallback = {
        type: 'errand', title: prompt.slice(0, 50),
        description: 'ARIA draft (simulated — API unavailable). Details based on your prompt.',
        price: 35000, distance: 1.2, location: 'Kebayoran Baru', time: 'ASAP',
        note: 'Here\'s a draft based on your request.',
      };
      setAriaResult(fallback);
      addLog('aria', `offline mode · drafted fallback task`);
      setApiStatus('sim');
    }
    setPosterBusy(false);
  };

  const runNova = async () => {
    setDoerBusy(true);
    addLog('nova', `scanning ${TASKS.length} nearby tasks`);
    addLog('nova', 'filters: ≤ 2km · ≥ Rp 20k · errand/delivery only');

    const feed = TASKS.map(t => ({
      id: t.id, title: t.title, type: t.type, price: t.price,
      distance: t.distance, urgent: !!t.urgent,
    }));

    const sys = `You are NOVA, an AI doer agent for DUIT task marketplace in Jakarta. User profile: prefers errand/delivery, within 2km, min Rp 20000, likes urgent tasks. Given the task list, return JSON:
{"pick_id":"<id>","reason":"<~80 char why this task is best>","offer":<integer IDR, slightly above listed price if good>,"skipped":[{"id":"<id>","reason":"<short reason>"}]}
Output ONLY JSON.`;

    try {
      const text = await window.claude.complete({
        messages: [{ role: 'user', content: `${sys}\n\nTasks:\n${JSON.stringify(feed, null, 2)}` }]
      });
      const json = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
      const pick = TASKS.find(t => t.id === json.pick_id) || TASKS[0];
      (json.skipped || []).slice(0, 2).forEach(s => {
        const sk = TASKS.find(t => t.id === s.id);
        if (sk) addLog('nova', `skipped "${sk.title.slice(0, 40)}" — ${s.reason}`);
      });
      addLog('nova', `✓ PICKED: "${pick.title}" — ${json.reason}`);
      addLog('nova', `sent offer: Rp ${(json.offer || pick.price).toLocaleString('id-ID')}`);
      setApiStatus('live');
      setTimeout(() => {
        addLog('nova', 'offer accepted! routing to task…');
        setOpenTaskId(pick.id);
        setScreen('tracker');
        setTrackerStage('accepted');
        setDoerBusy(false);
      }, 1400);
    } catch (e) {
      addLog('nova', `offline mode · using rules engine`);
      const pick = TASKS.filter(t => t.distance <= 2 && t.price >= 20000 && ['errand','delivery'].includes(t.type))
        .sort((a, b) => (b.urgent - a.urgent) || (b.price - a.price))[0] || TASKS[0];
      addLog('nova', `✓ PICKED: "${pick.title}"`);
      setApiStatus('sim');
      setTimeout(() => {
        setOpenTaskId(pick.id);
        setScreen('tracker');
        setTrackerStage('accepted');
        setDoerBusy(false);
      }, 1200);
    }
  };

  const handleAriaSubmit = (prompt, redo, action) => {
    if (action === 'post') {
      addLog('aria', `task posted to marketplace`);
      setAriaResult(null);
      setAriaPrompt('');
      setScreen('posted');
      return;
    }
    runAria(prompt);
  };

  const openAria = () => { setAriaResult(null); setAriaPrompt(''); setScreen('aria'); };

  const advanceTracker = (kind) => {
    const order = ['posted', 'accepted', 'progress', 'completed', 'paid'];
    if (kind === 'next') {
      const idx = order.indexOf(trackerStage);
      if (idx === 2) { setScreen('payment'); return; }
      setTrackerStage(order[Math.min(idx + 1, order.length - 1)]);
    } else if (kind === 'rate') {
      setScreen('rating');
    }
  };

  const handleTab = (id) => {
    if (id === 'create') { setScreen('create'); return; }
    setTab(id);
    setScreen('home');
  };

  const renderPhone = () => {
    if (screen === 'detail') {
      return <TaskDetail taskId={openTaskId} onBack={() => setScreen('home')}
        onAccept={() => { setScreen('tracker'); setTrackerStage('accepted'); }} pov={pov} />;
    }
    if (screen === 'create') {
      return <CreateFlow onClose={() => setScreen('home')} onPost={() => setScreen('posted')} />;
    }
    if (screen === 'posted') {
      return <PostedSuccess onDone={() => { setScreen('tracker'); setTrackerStage('posted'); }} />;
    }
    if (screen === 'tracker') {
      return <StatusTracker stage={trackerStage} onAdvance={advanceTracker}
        onConfirmPayment={() => setScreen('payment')} onBack={() => setScreen('home')} pov={pov} />;
    }
    if (screen === 'payment') {
      return <PaymentConfirm onBack={() => setScreen('tracker')}
        onConfirm={() => { setTrackerStage('paid'); setScreen('rating'); }} />;
    }
    if (screen === 'rating') {
      return <RatingScreen onSubmit={() => { setScreen('home'); setTab('home'); }}
        onBack={() => setScreen('tracker')} />;
    }
    if (screen === 'messages') {
      return <MessagesPage onBack={() => { setScreen('home'); setTab('activity'); }} />;
    }
    if (screen === 'verify') {
      return <VerificationPage onBack={() => { setScreen('home'); setTab('profile'); }}
        onDone={() => { setScreen('home'); setTab('profile'); }} />;
    }
    if (screen === 'aihub') {
      return <AIHub onBack={() => setScreen('home')} agentLogs={agentLogs}
        onRunPoster={openAria} onRunDoer={runNova} posterBusy={posterBusy} doerBusy={doerBusy}
        doerAutopilot={doerAutopilot}
        onToggleAutopilot={() => {
          const nx = !doerAutopilot; setDoerAutopilot(nx);
          addLog('nova', nx ? 'autopilot ON · will auto-accept matching tasks' : 'autopilot OFF');
        }}
        apiStatus={apiStatus} />;
    }
    if (screen === 'aria') {
      return <AriaComposer onClose={() => setScreen('aihub')} onSubmit={handleAriaSubmit}
        draft={ariaPrompt} busy={posterBusy} result={ariaResult} />;
    }
    return (
      <React.Fragment>
        {tab === 'home' && (
          <HomeFeed pov={pov} onTogglePov={() => setPov(pov === 'poster' ? 'doer' : 'poster')}
            onOpenTask={(id) => { setOpenTaskId(id); setScreen('detail'); }}
            density="balanced" onOpenAI={() => setScreen('aihub')} />
        )}
        {tab === 'tasks' && (
          <TasksPage pov={pov} onOpenTask={(id) => { setOpenTaskId(id); setScreen('detail'); }}
            onOpenTracker={() => { setScreen('tracker'); setTrackerStage('accepted'); }} />
        )}
        {tab === 'activity' && <ActivityPage onOpenMessages={() => setScreen('messages')} />}
        {tab === 'profile' && <ProfilePage onOpenVerify={() => setScreen('verify')} />}
      </React.Fragment>
    );
  };

  // ── Jump-to-screen buttons ──
  const jumps = [
    { k: 'Home',      isActive: () => screen === 'home' && tab === 'home',     go: () => { setScreen('home'); setTab('home'); } },
    { k: 'Create',    isActive: () => screen === 'create',                     go: () => setScreen('create') },
    { k: 'Status',    isActive: () => screen === 'tracker',                    go: () => { setScreen('tracker'); setTrackerStage('accepted'); } },
    { k: 'Payment',   isActive: () => screen === 'payment',                    go: () => setScreen('payment') },
    { k: 'Activity',  isActive: () => screen === 'home' && tab === 'activity', go: () => { setScreen('home'); setTab('activity'); } },
    { k: 'Profile',   isActive: () => screen === 'home' && tab === 'profile',  go: () => { setScreen('home'); setTab('profile'); } },
    { k: 'AI Agents', isActive: () => screen === 'aihub' || screen === 'aria', go: () => setScreen('aihub') },
  ];

  return (
    <React.Fragment>
      <div className="jumpbar">
        <div className="jb-label">↪ Jump to screen</div>
        {jumps.map(j => (
          <button key={j.k} className={'jb' + (j.isActive() ? ' active' : '')} onClick={j.go}>{j.k}</button>
        ))}
      </div>

      <div className="phone-wrap">
        <div className="applime">
          <IOSDevice width={390} height={844} dark={false}>
            <div style={{ position: 'relative', height: '100%', background: '#FAF8F3', overflow: 'hidden' }}>
              <div className="phone-scroll" style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', color: '#0E0E10' }}>
                {renderPhone()}
              </div>
              {screen === 'home' && (
                <BottomTabs active={tab} onChange={handleTab} pov={pov} />
              )}
            </div>
          </IOSDevice>
        </div>
      </div>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('app-preview-root')).render(<LandingAppPreview />);
