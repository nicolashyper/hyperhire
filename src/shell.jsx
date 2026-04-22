// App shell: sidebar + topbar

const { useState: useStateShell } = React;

const SUPPORT_URL = 'https://ytnkupxvzulgtvpdnvps.supabase.co/functions/v1/send-support';
const ANON_KEY    = 'sb_publishable_kHM9zr0VEFsy_kNWRtdaXA_i0iSO3Dv';

function SupportModal({ recruiter, onClose }) {
  const [subject, setSubject] = useStateShell('');
  const [message, setMessage] = useStateShell('');
  const [sending, setSending] = useStateShell(false);
  const [sent, setSent] = useStateShell(false);
  const [error, setError] = useStateShell('');

  const handleSend = async () => {
    if (!message.trim()) { setError('Please write a message.'); return; }
    setSending(true); setError('');
    const res = await fetch(SUPPORT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
      body: JSON.stringify({
        from_email: recruiter?.email || '',
        from_name:  recruiter?.name  || '',
        subject:    subject || 'Support request',
        message,
      }),
    });
    setSending(false);
    if (res.ok) { setSent(true); }
    else { setError('Failed to send. Please email nicolas@hypertalent.me directly.'); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 320, margin: '0 0 80px 14px',
        background: 'var(--panel)', border: '1px solid var(--line)',
        borderRadius: 12, padding: '20px 20px 18px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
      }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>✓</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Message sent</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>We'll get back to you shortly.</div>
            <button onClick={onClose} style={{ fontSize: 13, color: 'var(--faint)', textDecoration: 'underline' }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Get support</div>
              <button onClick={onClose} style={{ color: 'var(--faint)', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Subject (optional)"
                style={{
                  width: '100%', border: '1px solid var(--line)', borderRadius: 6,
                  padding: '8px 10px', fontSize: 13, outline: 'none', background: 'var(--bg)',
                }}
              />
              <textarea
                value={message}
                onChange={e => { setMessage(e.target.value); setError(''); }}
                placeholder="Describe your issue or question…"
                rows={5}
                style={{
                  width: '100%', border: '1px solid var(--line)', borderRadius: 6,
                  padding: '8px 10px', fontSize: 13, outline: 'none', background: 'var(--bg)',
                  resize: 'vertical', lineHeight: 1.55,
                }}
              />
              {error && <div style={{ fontSize: 12, color: 'var(--rose-ink)' }}>{error}</div>}
              <button
                onClick={handleSend}
                disabled={sending}
                style={{
                  background: 'var(--ink)', color: '#fff', border: 'none',
                  borderRadius: 6, padding: '9px 16px', fontSize: 13.5,
                  fontWeight: 500, cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.6 : 1,
                }}
              >
                {sending ? 'Sending…' : 'Send message'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MobileNav({ currentView, onNav, submissions }) {
  const { IconBriefcase, IconList, IconSparkle, IconSettings } = window.HH_ICONS;
  const items = [
    { id: 'jobs',        label: 'Jobs',        Icon: IconBriefcase },
    { id: 'submissions', label: 'Pipeline',    Icon: IconList, badge: (submissions||[]).length || null },
    { id: 'rewards',     label: 'Rewards',     Icon: IconSparkle },
    { id: 'onboarding', label: 'Profile',      Icon: IconSettings },
  ];
  return (
    <div className="hh-mobile-nav">
      {items.map(({ id, label, Icon, badge }) => {
        const active = currentView === id || (id === 'jobs' && (currentView === 'job_detail' || currentView === 'submit'));
        return (
          <button key={id} onClick={() => onNav(id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '4px 16px', position: 'relative',
            color: active ? 'var(--ink)' : 'var(--faint)',
          }}>
            <Icon size={22} />
            <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 400 }}>{label}</span>
            {badge ? (
              <span style={{
                position: 'absolute', top: 0, right: 10,
                background: 'var(--ink)', color: '#fff',
                borderRadius: 999, fontSize: 9, fontWeight: 600,
                padding: '1px 4px', minWidth: 14, textAlign: 'center',
              }}>{badge}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function Sidebar({ currentView, onNav, recruiter, submissions }) {
  const { IconList, IconSparkle, IconSettings, IconBriefcase, IconCheck } = window.HH_ICONS;
  const { Avatar } = window.HH_P;

  const [supportOpen, setSupportOpen] = useStateShell(false);

  const hiredCount = (submissions || []).filter(s => s.status === 'Hired').length;
  const earned = hiredCount * 10000;

  const NavItem = ({ id, label, icon, count }) => {
    const active = currentView === id
      || (id === 'jobs' && (currentView === 'job_detail' || currentView === 'submit'));
    return (
      <button
        onClick={() => onNav(id)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: "7px 10px",
          borderRadius: 6,
          background: active ? "#F0EEE7" : "transparent",
          color: active ? "var(--ink)" : "var(--ink-2)",
          fontSize: 13.5, fontWeight: active ? 500 : 400,
          transition: "background 0.12s",
          textAlign: "left",
        }}
        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#F5F3EC"; }}
        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{ color: active ? "var(--ink)" : "var(--faint)", display: "inline-flex" }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {count !== undefined && (
          <span className="mono" style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 500 }}>{count}</span>
        )}
      </button>
    );
  };

  const name = recruiter?.name || "You";

  return (
  <>
    <aside className="hh-sidebar" style={{
      width: 232, flexShrink: 0,
      borderRight: "1px solid var(--line)",
      background: "var(--bg)",
      padding: "18px 14px",
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 6px", marginBottom: 22 }}>
        <img src="assets/logo-mark.svg" alt="HyperHire" style={{ width: 22, height: 22 }} />
        <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em" }}>HyperHire</div>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <NavItem id="jobs"        icon={<IconBriefcase />} label="Open jobs" />
        <NavItem id="submissions" icon={<IconList />}      label="My submissions" count={(submissions || []).length || undefined} />
        <NavItem id="rewards"     icon={<IconSparkle />}   label="Rewards" />
      </nav>

      <div style={{ marginTop: 8 }}>
        <button
          onClick={() => setSupportOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", padding: "7px 10px", borderRadius: 6,
            background: "transparent", color: "var(--muted)",
            fontSize: 13.5, fontWeight: 400, textAlign: "left",
            transition: "background 0.12s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#F5F3EC"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={{ color: "var(--faint)", display: "inline-flex", fontSize: 14 }}>?</span>
          Support
        </button>
      </div>

      <div style={{ flex: 1 }} />

      {/* Earnings mini */}
      <div style={{
        padding: "12px 12px 11px",
        border: "1px solid var(--line)",
        borderRadius: 8,
        background: "var(--panel)",
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>All-time earnings</div>
        <div className="mono" style={{ fontSize: 18, fontWeight: 500, marginTop: 4, letterSpacing: "-0.01em" }}>
          ${earned.toLocaleString()}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
          {hiredCount} placement{hiredCount !== 1 ? 's' : ''} · next payout Apr 28
        </div>
      </div>

      {/* User */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 8px", borderRadius: 6 }}>
        <Avatar name={name} size={26} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
          <div style={{ fontSize: 11.5, color: "var(--faint)" }}>Independent recruiter</div>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ color: "var(--faint)", padding: 2 }} title="Sign out">
          <IconSettings />
        </button>
      </div>
    </aside>
    {supportOpen && <SupportModal recruiter={recruiter} onClose={() => setSupportOpen(false)} />}
  </>
  );
}

function TopBar({ title, subtitle, right, breadcrumb }) {
  return (
    <div className="hh-topbar" style={{
      padding: "18px 32px 16px",
      borderBottom: "1px solid var(--line)",
      background: "var(--bg)",
      display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      gap: 16,
      position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ minWidth: 0 }}>
        {breadcrumb && (
          <div style={{ fontSize: 12.5, color: "var(--faint)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            {breadcrumb}
          </div>
        )}
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", color: "var(--ink)" }}>{title}</h1>
        {subtitle && <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 3 }}>{subtitle}</div>}
      </div>
      {right && <div className="hh-topbar-right">{right}</div>}
    </div>
  );
}

function Page({ children, maxWidth = 1200, padding = "28px 32px 48px" }) {
  return (
    <div className="hh-page" style={{ padding, maxWidth, margin: "0 auto" }}>
      {children}
    </div>
  );
}

window.HH_SHELL = { Sidebar, MobileNav, TopBar, Page };
