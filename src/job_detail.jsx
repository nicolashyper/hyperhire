// Job detail screen

function JobDetailScreen({ jobId, jobs, onBack, onSubmit }) {
  const job = jobs.find(j => j.id === jobId);
  const { Badge, Button, CompanyLogo, Avatar, Divider } = window.HH_P;
  const { IconArrowLeft, IconCheck, IconPlus, IconExternal } = window.HH_ICONS;
  const { TopBar, Page } = window.HH_SHELL;

  if (!job) return null;

  const mustHaves = (() => { try { return JSON.parse(job.must_haves || '[]'); } catch { return []; } })();
  const niceToHaves = (() => { try { return JSON.parse(job.nice_to_haves || '[]'); } catch { return []; } })();

  const MetaRow = ({ label, value, mono }) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "9px 0", fontSize: 13 }}>
      <div style={{ color: "var(--muted)" }}>{label}</div>
      <div className={mono ? "mono" : ""} style={{ color: "var(--ink)", fontWeight: 500, textAlign: "right" }}>{value}</div>
    </div>
  );

  return (
    <div>
      <TopBar
        breadcrumb={
          <button onClick={onBack} style={{
            display: "inline-flex", alignItems: "center", gap: 5, color: "var(--faint)", fontSize: 12.5,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--faint)"}
          >
            <IconArrowLeft size={13} /> All jobs
          </button>
        }
        title={job.title}
        subtitle={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>{job.company_name}</span>
            {job.location && <><span style={{ color: "var(--line)" }}>·</span><span>{job.location}</span></>}
            {job.remote_type && <><span style={{ color: "var(--line)" }}>·</span><span>{job.remote_type}</span></>}
          </span>
        }
        right={
          <Button variant="primary" size="md" icon={<IconPlus size={14} />} onClick={onSubmit}>
            Submit candidate
          </Button>
        }
      />

      <Page maxWidth={1080}>
        <div className="hh-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 36, alignItems: "start" }}>

          {/* Main column */}
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <Badge tone="accent"><span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", display: "inline-block", marginRight: 2 }} />Open</Badge>
              {job.seniority && <Badge tone="neutral">{job.seniority}</Badge>}
              {job.function_area && <Badge tone="neutral">{job.function_area}</Badge>}
              {job.is_urgent && <Badge tone="warn">Priority fill</Badge>}
            </div>

            <Section title="About the role">
              <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--ink-2)", margin: 0, whiteSpace: "pre-wrap" }}>
                {job.description || job.about_company || `We're looking for a ${job.seniority?.toLowerCase() || ''} ${job.title} to join a small, senior team. High autonomy, early-stage company.`}
              </p>
            </Section>

            {job.about_company && job.description && (
              <Section title="About the company">
                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--ink-2)", margin: 0 }}>
                  {job.about_company}
                </p>
              </Section>
            )}

            {mustHaves.length > 0 && (
              <Section title="Must-haves">
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {mustHaves.map((m, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)" }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: "50%",
                        background: "var(--accent-bg)", color: "var(--accent-ink)",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, marginTop: 2,
                      }}>
                        <IconCheck size={11} />
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {niceToHaves.length > 0 && (
              <Section title="Nice to have">
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {niceToHaves.map((m, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "var(--ink-2)" }}>
                      <span style={{ color: "var(--faint)", marginTop: 1 }}>—</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Recruiter notes">
              <div style={{ padding: "14px 16px", background: "#F5F3EC", borderRadius: 8, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
                The hiring team moves fast — expect a first-round reply within 48h of submission. Comp band is firm; don't submit candidates expecting significantly above range.
              </div>
            </Section>

            <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
              <Button variant="primary" size="lg" onClick={onSubmit} icon={<IconPlus />}>
                Submit a candidate
              </Button>
            </div>
          </div>

          {/* Right rail */}
          <div className="hh-detail-rail" style={{ position: "sticky", top: 100 }}>
            {/* Company card */}
            <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "var(--panel)", padding: 18, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
                <CompanyLogo company={job} size={40} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{job.company_name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{job.company_industry}</div>
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--line-2)" }}>
                {job.company_stage && <><MetaRow label="Stage" value={job.company_stage} /><div style={{ borderTop: "1px solid var(--line-2)" }} /></>}
                {job.company_size && <><MetaRow label="Team size" value={job.company_size} /><div style={{ borderTop: "1px solid var(--line-2)" }} /></>}
                <MetaRow label="Salary" value={job.comp_range || "Competitive"} mono />
                <div style={{ borderTop: "1px solid var(--line-2)" }} />
                <MetaRow label="Placement fee" value="$10,000" mono />
                <div style={{ borderTop: "1px solid var(--line-2)" }} />
                <MetaRow label="Posted" value={`${job.days_open || 0}d ago`} />
              </div>
            </div>

            {/* Payout info */}
            <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "transparent", padding: 16, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6 }}>
              <div style={{ fontSize: 11.5, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, fontWeight: 500 }}>Payout</div>
              You earn <span className="mono" style={{ color: "var(--ink)", fontWeight: 500 }}>$10,000</span> when a candidate you submitted gets hired. Paid 7 days after the 2-month guarantee period ends.
            </div>
          </div>

        </div>
      </Page>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 26 }}>
      <h3 style={{
        margin: "0 0 10px", fontSize: 12, fontWeight: 500,
        color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.06em",
      }}>{title}</h3>
      {children}
    </section>
  );
}

window.HH_JOB_DETAIL = { JobDetailScreen };
