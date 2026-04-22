// Rewards / tier progress + payout ledger

const { useState: useStateRewards, useEffect: useEffectRewards } = React;

function RewardsScreen({ submissions, recruiterEmail }) {
  const { Badge } = window.HH_P;
  const { TopBar, Page } = window.HH_SHELL;
  const { IconCheck, IconSparkle } = window.HH_ICONS;
  const sb = window.HH_SB;

  const [ledger, setLedger] = useStateRewards([]);

  useEffectRewards(() => {
    if (!recruiterEmail) return;
    sb.from('hh_rewards_ledger')
      .select('*')
      .eq('recruiter_email', recruiterEmail)
      .order('created_at', { ascending: false })
      .then(({ data }) => setLedger(data || []));
  }, [recruiterEmail]);

  // Compute tier progress from submissions
  const interviewingCount = (submissions || []).filter(s => s.status === 'Interviewing').length;
  const hiredThisQ = (submissions || []).filter(s => {
    if (s.status !== 'Hired') return false;
    const d = new Date(s.submitted_at);
    const now = new Date();
    const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    return d >= qStart;
  }).length;

  // Build last-6-months history from real submissions
  const history = (() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('default', { month: 'short' }) });
    }
    return months.map(({ year, month, label }) => {
      const inMonth = (submissions || []).filter(s => {
        const d = new Date(s.submitted_at);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      return {
        month: label,
        interviews: inMonth.filter(s => s.status === 'Interviewing' || s.status === 'Hired').length,
        hires: inMonth.filter(s => s.status === 'Hired').length,
      };
    });
  })();

  const tiers = [
    {
      id: "active",
      name: "Active contributor",
      base: 1000,
      period: "/ month",
      threshold: 10,
      metric: interviewingCount,
      metricLabel: "interviews booked",
      window: "this month",
      criterion: "Book 10+ candidate interviews per month",
      earned: interviewingCount >= 10,
    },
    {
      id: "elite",
      name: "Elite closer",
      base: 2000,
      period: "/ month",
      threshold: 3,
      metric: hiredThisQ,
      metricLabel: "hires closed",
      window: "this quarter",
      criterion: "Close 3+ hires per quarter",
      earned: hiredThisQ >= 3,
    },
  ];

  return (
    <div>
      <TopBar title="Rewards" subtitle="Unlock monthly base pay on top of $10,000 placement fees." />

      <Page maxWidth={960}>
        {/* How it works */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 18px", marginBottom: 26,
          border: "1px solid var(--line)", borderRadius: 10, background: "var(--panel)",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "var(--accent-bg)", color: "var(--accent-ink)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}><IconSparkle size={14} /></div>
          <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
            The most active recruiters on HyperHire earn a recurring base salary — paid monthly, in addition to any placement fees. Hit a tier's threshold and the base unlocks for the next month.
          </div>
        </div>

        {/* Tier cards */}
        <div className="hh-tier-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
          {tiers.map(t => <TierCard key={t.id} tier={t} />)}
        </div>

        {/* Activity chart */}
        <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", padding: "20px 22px", marginBottom: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em" }}>Your activity</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>Interviews and hires, last 6 months</div>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
              <LegendDot color="var(--ink)" label="Interviews" />
              <LegendDot color="var(--accent)" label="Hires" />
            </div>
          </div>
          <ActivityChart history={history} threshold={10} />
        </div>

        {/* Payout ledger */}
        <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em" }}>
            Recent base-pay payouts
          </div>
          <LedgerHeader />
          {ledger.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
              No payouts yet. Keep submitting to unlock rewards.
            </div>
          ) : (
            ledger.map((row, i) => (
              <LedgerRow key={row.id}
                month={row.period_month} tier={row.tier || "—"}
                amount={row.amount ? `+$${row.amount.toLocaleString()}` : "—"}
                status={row.status} date={row.paid_at || "—"}
                muted={row.status === "Below threshold"} isLast={i === ledger.length - 1} />
            ))
          )}
        </div>
      </Page>
    </div>
  );
}

function TierCard({ tier }) {
  const { Badge } = window.HH_P;
  const { IconCheck } = window.HH_ICONS;
  const pct = Math.min(100, (tier.metric / tier.threshold) * 100);
  const remaining = Math.max(0, tier.threshold - tier.metric);

  return (
    <div style={{
      border: tier.earned ? "1.5px solid var(--accent)" : "1px solid var(--line)",
      borderRadius: 12, background: "var(--panel)", padding: 20,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 6 }}>{tier.name}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span className="mono" style={{ fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink)" }}>${tier.base.toLocaleString()}</span>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{tier.period}</span>
          </div>
        </div>
        {tier.earned ? (
          <Badge tone="accent"><IconCheck size={11} /> Unlocked</Badge>
        ) : (
          <Badge tone="neutral">Locked</Badge>
        )}
      </div>

      <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55, marginBottom: 18 }}>{tier.criterion}</div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, fontSize: 12 }}>
        <span style={{ color: "var(--muted)" }}>
          <span className="mono" style={{ color: "var(--ink)", fontWeight: 500 }}>{tier.metric}</span>
          {" "}/ {tier.threshold} {tier.metricLabel}
        </span>
        <span style={{ color: "var(--faint)" }}>{tier.window}</span>
      </div>

      <div style={{ height: 6, background: "#F0EEE7", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: tier.earned ? "var(--accent)" : "var(--ink)", borderRadius: 999, transition: "width 0.3s ease" }} />
      </div>

      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
        {tier.earned ? `You've qualified. Next month's base pay is confirmed.`
          : remaining === 1 ? `1 more ${tier.metricLabel.replace(/s$/, '')} to unlock.`
          : `${remaining} more ${tier.metricLabel} to unlock.`}
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--muted)" }}>
      <span style={{ width: 8, height: 8, background: color, borderRadius: 2 }} />
      {label}
    </span>
  );
}

function ActivityChart({ history, threshold }) {
  const max = Math.max(threshold + 2, ...history.map(h => h.interviews));
  const barHeight = 140;
  return (
    <div style={{ position: "relative", paddingTop: 16 }}>
      <div style={{
        position: "absolute", left: 0, right: 0,
        top: 16 + barHeight - (threshold / max) * barHeight,
        height: 1, borderTop: "1px dashed var(--accent)",
      }}>
        <div style={{
          position: "absolute", right: 0, top: -18,
          fontSize: 11, color: "var(--accent-ink)", fontWeight: 500,
          background: "var(--panel)", padding: "0 6px",
        }}>Tier 1 · 10 interviews</div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 18, height: barHeight }}>
        {history.map((h) => {
          const ih = (h.interviews / max) * barHeight;
          const hh = (h.hires / max) * barHeight;
          return (
            <div key={h.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: "100%", width: "100%", justifyContent: "center" }}>
                <div style={{ width: "45%", maxWidth: 28, height: ih, background: "var(--ink)", borderRadius: "3px 3px 0 0", position: "relative" }}>
                  <span className="mono" style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: 10.5, color: "var(--muted)" }}>{h.interviews}</span>
                </div>
                <div style={{ width: "30%", maxWidth: 18, height: Math.max(hh, h.hires > 0 ? 4 : 0), background: "var(--accent)", borderRadius: "3px 3px 0 0", opacity: h.hires > 0 ? 1 : 0 }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
        {history.map(h => (
          <div key={h.month} style={{ flex: 1, textAlign: "center", fontSize: 11.5, color: "var(--muted)" }}>{h.month}</div>
        ))}
      </div>
    </div>
  );
}

function LedgerHeader() {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr 1fr 0.8fr",
      gap: 12, padding: "10px 20px", borderBottom: "1px solid var(--line)",
      background: "#FBFAF5", fontSize: 11, fontWeight: 500, color: "var(--faint)",
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      <div>Period</div><div>Tier</div><div>Status</div><div>Paid on</div><div style={{ textAlign: "right" }}>Amount</div>
    </div>
  );
}

function LedgerRow({ month, tier, amount, status, date, muted, isLast }) {
  const { StatusDot } = window.HH_P;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr 1fr 0.8fr",
      gap: 12, padding: "13px 20px",
      borderBottom: isLast ? "none" : "1px solid var(--line-2)",
      fontSize: 13, alignItems: "center",
      color: muted ? "var(--faint)" : "var(--ink)",
    }}>
      <div className="mono" style={{ color: muted ? "var(--faint)" : "var(--ink)" }}>{month}</div>
      <div>{tier}</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <StatusDot tone={muted ? "muted" : "accent"} />
        <span style={{ fontSize: 12.5 }}>{status}</span>
      </div>
      <div className="mono" style={{ fontSize: 12.5, color: "var(--muted)" }}>{date}</div>
      <div className="mono" style={{ textAlign: "right", fontWeight: muted ? 400 : 500, color: muted ? "var(--faint)" : "var(--accent-ink)" }}>{amount}</div>
    </div>
  );
}

window.HH_REWARDS = { RewardsScreen };
