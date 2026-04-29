// My submissions — fetches from hh_submissions filtered by recruiter_email

const { useState: useStateSubs, useMemo: useMemoSubs, useEffect: useEffectSubs } = React;

function SubmissionsScreen({ submissions, submissionsLoading, jobs, onOpenJob, onRefresh }) {
  const { Badge, CompanyLogo, StatusDot, Avatar } = window.HH_P;
  const { IconArrowRight } = window.HH_ICONS;
  const { TopBar, Page } = window.HH_SHELL;

  const [tab, setTab] = useStateSubs("All");
  const [editSub, setEditSub] = useStateSubs(null);
  const tabs = ["All", "Submitted", "Interviewing", "Hired", "Rejected"];

  const jobById = useMemoSubs(() => Object.fromEntries((jobs || []).map(j => [j.id, j])), [jobs]);

  const counts = useMemoSubs(() => {
    const c = { All: submissions.length };
    for (const t of tabs.slice(1)) c[t] = submissions.filter(s => s.status === t).length;
    return c;
  }, [submissions]);

  const filtered = tab === "All" ? submissions : submissions.filter(s => s.status === tab);

  const hiredCount = submissions.filter(s => s.status === "Hired").length;
  const earned = hiredCount * 10000;
  const activeCount = submissions.filter(s => s.status === "Submitted" || s.status === "Interviewing").length;
  const winRate = submissions.length > 0 ? Math.round((hiredCount / submissions.length) * 100) : 0;

  return (
    <div>
      <TopBar title="My submissions" subtitle="Candidates you've submitted, by stage." />

      <Page>
        {/* Stat cards */}
        <div className="hh-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 26 }}>
          <Stat label="In pipeline" value={activeCount} hint="Submitted or interviewing" />
          <Stat label="Hired" value={hiredCount} hint="All-time placements" accent />
          <Stat label="Earned" value={`$${earned.toLocaleString()}`} mono hint="Total fees" />
          <Stat label="Win rate" value={`${winRate}%`} hint="Of submissions that converted" mono />
        </div>

        {/* Tabs */}
        <div className="hh-filter-chips" style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--line)", marginBottom: 16 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "9px 14px", fontSize: 13.5, fontWeight: 500,
              color: tab === t ? "var(--ink)" : "var(--muted)",
              borderBottom: tab === t ? "2px solid var(--ink)" : "2px solid transparent",
              marginBottom: -1,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              {t}
              <span className="mono" style={{
                fontSize: 11.5, color: "var(--faint)", padding: "1px 6px",
                background: "#F3F1EA", borderRadius: 999,
              }}>{counts[t] || 0}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="hh-sub-table" style={{ border: "1px solid var(--line)", borderRadius: 8, background: "var(--panel)", overflow: "hidden" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1.5fr 0.9fr 1.4fr 0.7fr 0.7fr 30px",
            gap: 14, padding: "10px 18px",
            borderBottom: "1px solid var(--line)", background: "#FBFAF5",
            fontSize: 11, fontWeight: 500, color: "var(--faint)",
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            <div>Candidate</div><div>Role</div><div>Stage</div>
            <div>Note</div><div>Submitted</div><div style={{ textAlign: "right" }}>Fee</div><div></div>
          </div>

          {editSub && (
            <EditSubmissionModal
              sub={editSub}
              job={jobById[editSub.job_id] || {}}
              onClose={() => setEditSub(null)}
              onSaved={async () => { setEditSub(null); await onRefresh(); }}
              onOpenJob={onOpenJob}
            />
          )}

          {submissionsLoading ? (
            Array.from({length: 5}).map((_, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 0.9fr 1.4fr 0.7fr 0.7fr 30px", gap: 14, padding: "14px 18px", borderBottom: i < 4 ? "1px solid var(--line-2)" : "none", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="skeleton" style={{ width: 28, height: 28, borderRadius: "50%" }} />
                  <div className="skeleton" style={{ height: 13, width: 80 }} />
                </div>
                <div className="skeleton" style={{ height: 13, width: 100 }} />
                <div className="skeleton" style={{ height: 13, width: 60 }} />
                <div className="skeleton" style={{ height: 13, width: 120 }} />
                <div className="skeleton" style={{ height: 13, width: 40 }} />
                <div className="skeleton" style={{ height: 13, width: 50 }} />
                <div />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
              {submissions.length === 0 ? "You haven't submitted any candidates yet." : "No candidates in this stage."}
            </div>
          ) : (
            filtered.map((s, i) => {
              const job = jobById[s.job_id] || {};
              return (
                <SubmissionRow key={s.id} sub={s} job={job}
                  onClick={() => setEditSub(s)}
                  isLast={i === filtered.length - 1} />
              );
            })
          )}
        </div>
      </Page>
    </div>
  );
}

function Stat({ label, value, hint, mono, accent }) {
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "var(--panel)", padding: "14px 16px" }}>
      <div style={{ fontSize: 11.5, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{label}</div>
      <div className={mono ? "mono" : ""} style={{
        fontSize: 24, fontWeight: mono ? 500 : 600, marginTop: 6,
        color: accent ? "var(--accent-ink)" : "var(--ink)", letterSpacing: "-0.015em",
      }}>{value}</div>
      {hint && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

function SubmissionRow({ sub, job, onClick, isLast }) {
  const { Avatar, StatusDot, CompanyLogo } = window.HH_P;
  const { IconArrowRight } = window.HH_ICONS;
  const [hover, setHover] = useStateSubs(false);

  const statusMap = {
    Submitted:    { dot: "blue" },
    Interviewing: { dot: "warn" },
    Hired:        { dot: "accent" },
    Rejected:     { dot: "muted" },
  };
  const s = statusMap[sub.status] || statusMap.Submitted;

  const daysAgo = Math.floor((new Date() - new Date(sub.submitted_at)) / 86400000);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 1.5fr 0.9fr 1.4fr 0.7fr 0.7fr 30px",
        gap: 14, width: "100%", padding: "14px 18px",
        borderBottom: isLast ? "none" : "1px solid var(--line-2)",
        background: hover ? "#FBFAF5" : "transparent",
        alignItems: "center", textAlign: "left", transition: "background 0.1s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <Avatar name={sub.candidate_name} size={28} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{sub.candidate_name}</div>
          {sub.expected_comp && <div className="mono" style={{ fontSize: 11.5, color: "var(--faint)" }}>{sub.expected_comp}</div>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {job.company_logo && <CompanyLogo company={job} size={24} />}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title || sub.job_id}</div>
          {job.company_name && <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{job.company_name}</div>}
        </div>
      </div>

      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <StatusDot tone={s.dot} />
          <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{sub.status}</span>
        </div>
        {sub.stage && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2, marginLeft: 12 }}>{sub.stage}</div>}
      </div>

      <div style={{ minWidth: 0 }}>
        {(sub.rejection_note || sub.note || sub.pitch) ? (
          <div title={sub.rejection_note || sub.note || sub.pitch} style={{
            fontSize: 12.5,
            color: sub.status === "Rejected" ? "var(--rose-ink)" : "var(--muted)",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden", lineHeight: 1.4,
          }}>
            {sub.rejection_note || sub.note || sub.pitch}
          </div>
        ) : (
          <span className="mono" style={{ fontSize: 13, color: "var(--faint)" }}>—</span>
        )}
      </div>

      <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
        {daysAgo === 0 ? "today" : `${daysAgo}d ago`}
      </div>

      <div style={{ textAlign: "right" }}>
        {sub.status === "Hired" ? (
          <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: "var(--accent-ink)" }}>+$10,000</div>
        ) : sub.status === "Rejected" ? (
          <div className="mono" style={{ fontSize: 13, color: "var(--faint)" }}>—</div>
        ) : (
          <div className="mono" style={{ fontSize: 13, color: "var(--muted)" }}>$10,000</div>
        )}
      </div>

      <div style={{ color: hover ? "var(--ink)" : "var(--faint)", display: "flex", justifyContent: "flex-end" }}>
        <IconArrowRight size={14} />
      </div>
    </button>
  );
}

function EditSubmissionModal({ sub, job, onClose, onSaved, onOpenJob }) {
  const { Button, Field, Input, Textarea } = window.HH_P;
  const sb = window.HH_SB;
  const [form, setEditForm] = useStateSubs({
    candidate_name: sub.candidate_name || "",
    candidate_email: sub.candidate_email || "",
    linkedin_url: sub.linkedin_url || "",
    expected_comp: sub.expected_comp || "",
    availability: sub.availability || "",
    work_auth: sub.work_auth || "",
    pitch: sub.pitch || "",
    note: sub.note || "",
  });
  const [saving, setSaving] = useStateSubs(false);
  const [error, setError] = useStateSubs("");

  const upd = (k, v) => setEditForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.candidate_name.trim()) { setError("Candidate name is required"); return; }
    setSaving(true); setError("");
    const { error: e } = await sb.from('hh_submissions').update({
      candidate_name: form.candidate_name.trim(),
      candidate_email: form.candidate_email.trim(),
      linkedin_url: form.linkedin_url.trim(),
      expected_comp: form.expected_comp.trim(),
      availability: form.availability.trim(),
      work_auth: form.work_auth.trim(),
      pitch: form.pitch.trim(),
      note: form.note.trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', sub.id);
    setSaving(false);
    if (e) { setError(e.message); return; }
    onSaved();
  };

  const statusColors = { Submitted: "var(--blue-ink)", Interviewing: "var(--warn-ink)", Hired: "var(--accent-ink)", Rejected: "var(--faint)" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 480, height: "100vh", background: "var(--panel)",
        borderLeft: "1px solid var(--line)", display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.08)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>{sub.candidate_name}</div>
            <button onClick={onClose} style={{ color: "var(--faint)", fontSize: 20, lineHeight: 1, padding: "0 2px" }}>×</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{job.title || sub.job_id}</span>
            {job.company_name && <><span style={{ color: "var(--faint)" }}>·</span><span style={{ fontSize: 12.5, color: "var(--muted)" }}>{job.company_name}</span></>}
            <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: statusColors[sub.status] || "var(--muted)" }}>{sub.status}</span>
          </div>
          {job.id && (
            <button onClick={() => { onClose(); onOpenJob(job.id); }} style={{ marginTop: 8, fontSize: 12.5, color: "var(--muted)", textDecoration: "underline", textDecorationColor: "var(--line)", textUnderlineOffset: 3 }}>
              View job →
            </button>
          )}
        </div>

        {/* Scrollable fields */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="hh-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Full name" required>
              <Input value={form.candidate_name} onChange={v => upd("candidate_name", v)} placeholder="Jane Smith" />
            </Field>
            <Field label="Email">
              <Input value={form.candidate_email} onChange={v => upd("candidate_email", v)} placeholder="jane@gmail.com" />
            </Field>
          </div>
          <Field label="LinkedIn URL">
            <Input value={form.linkedin_url} onChange={v => upd("linkedin_url", v.replace(/^https?:\/\//, ''))} placeholder="linkedin.com/in/…" prefix="https://" />
          </Field>
          <div className="hh-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Expected comp">
              <Input value={form.expected_comp} onChange={v => upd("expected_comp", v)} placeholder="$200K base" prefix="$" />
            </Field>
            <Field label="Availability">
              <Input value={form.availability} onChange={v => upd("availability", v)} placeholder="2 weeks notice" />
            </Field>
          </div>
          <Field label="Work authorization">
            <Input value={form.work_auth} onChange={v => upd("work_auth", v)} placeholder="US citizen, visa required…" />
          </Field>
          <Field label="Pitch" hint="Why this candidate fits this role">
            <Textarea rows={4} value={form.pitch} onChange={v => upd("pitch", v)} placeholder="Why they're a strong fit…" />
          </Field>
          <Field label="Your notes" hint="Private — not shared with the hiring team">
            <Textarea rows={3} value={form.note} onChange={v => upd("note", v)} placeholder="Follow-up reminders, context…" />
          </Field>
          {error && <div style={{ fontSize: 12.5, color: "var(--rose-ink)", padding: "8px 12px", background: "var(--rose-bg)", borderRadius: 6 }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ recruiter }) {
  const { TopBar, Page } = window.HH_SHELL;
  const fnLabels = (recruiter.functions || []).join(", ") || "—";
  const locLabels = (recruiter.locations || []).join(", ") || "—";

  return (
    <div>
      <TopBar title="My profile" subtitle="Your recruiter profile on HyperHire." />
      <Page maxWidth={600}>
        <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", overflow: "hidden" }}>
          <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
            <Row label="Name" value={recruiter.name} />
            <Row label="Email" value={recruiter.email} mono />
            <Row label="LinkedIn" value={recruiter.linkedin_url ? `https://${recruiter.linkedin_url.replace(/^https?:\/\//, '')}` : "—"} />
            <Row label="Experience" value={recruiter.years_exp || "—"} />
            <Row label="Functions" value={fnLabels} />
            <Row label="Locations" value={locLabels} />
            {recruiter.bio && <Row label="Bio" value={recruiter.bio} multiline />}
          </div>
          <div style={{ borderTop: "1px solid var(--line)", padding: "14px 28px", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              style={{ fontSize: 13, color: "var(--rose-ink)", fontWeight: 500, padding: "6px 14px", border: "1px solid var(--rose-ink)", borderRadius: 6, opacity: 0.8 }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
            >
              Sign out
            </button>
          </div>
        </div>
      </Page>
    </div>
  );
}

function Row({ label, value, mono, multiline }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, alignItems: multiline ? "flex-start" : "center" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.04em", paddingTop: multiline ? 2 : 0 }}>{label}</div>
      <div className={mono ? "mono" : ""} style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55 }}>{value || "—"}</div>
    </div>
  );
}

window.HH_SUBMISSIONS = { SubmissionsScreen, ProfileScreen };
