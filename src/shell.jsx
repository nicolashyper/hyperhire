// App shell: sidebar + topbar

const { useState: useStateShell } = React;

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
        <div style={{
          width: 22, height: 22, borderRadius: 5,
          background: "var(--ink)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent)" }} />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em" }}>HyperHire</div>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <NavItem id="jobs"        icon={<IconBriefcase />} label="Open jobs" />
        <NavItem id="submissions" icon={<IconList />}      label="My submissions" count={(submissions || []).length || undefined} />
        <NavItem id="rewards"     icon={<IconSparkle />}   label="Rewards" />
        <NavItem id="onboarding"  icon={<IconCheck />}     label="Get set up" />
      </nav>

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
        <button onClick={() => onNav('onboarding')} style={{ color: "var(--faint)", padding: 2 }}>
          <IconSettings />
        </button>
      </div>
    </aside>
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
