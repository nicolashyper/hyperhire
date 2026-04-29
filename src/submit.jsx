// Submit candidate form — saves to hh_submissions

const { useState: useStateSubmit } = React;

function SubmitScreen({ jobId, jobs, recruiterEmail, onBack, onSuccess }) {
  const job = jobs.find(j => j.id === jobId);
  const { Button, Field, Input, Textarea, CompanyLogo, Badge, Chip } = window.HH_P;
  const { IconArrowLeft, IconUpload, IconCheck, IconPlus, IconX } = window.HH_ICONS;
  const { TopBar, Page } = window.HH_SHELL;
  const sb = window.HH_SB;

  const [form, setForm] = useStateSubmit({
    name: "", email: "", linkedin: "",
    pitch: "", comp: "", availability: "2 weeks",
    workAuth: "", resume: null, consent: false,
  });
  const [submitted, setSubmitted] = useStateSubmit(false);
  const [submitting, setSubmitting] = useStateSubmit(false);
  const [errors, setErrors] = useStateSubmit({});
  const [dbError, setDbError] = useStateSubmit(null);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    const e = {};
    if (!form.name) e.name = "Required";
    if (!form.email || !form.email.includes("@")) e.email = "Valid email required";
    if (!form.linkedin) e.linkedin = "Required";
    if (!form.pitch || form.pitch.length < 20) e.pitch = "At least 20 characters";
    if (!form.consent) e.consent = "You must confirm";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    setDbError(null);

    const { error } = await sb.from('hh_submissions').insert({
      recruiter_email: recruiterEmail || 'anonymous@hyperhire.app',
      job_id: jobId,
      candidate_name: form.name,
      candidate_email: form.email,
      linkedin_url: form.linkedin ? `https://${form.linkedin.replace(/^https?:\/\//, '')}` : null,
      pitch: form.pitch,
      expected_comp: form.comp || null,
      availability: form.availability,
      work_auth: form.workAuth || null,
      resume_filename: form.resume?.name || null,
      status: 'Submitted',
      stage: 'Awaiting review',
    });

    setSubmitting(false);
    if (error) { setDbError(error.message); return; }
    setSubmitted(true);
  };

  if (!job) return null;

  if (submitted) {
    return (
      <div>
        <TopBar title="Candidate submitted" />
        <Page maxWidth={560}>
          <div style={{
            border: "1px solid var(--line)", borderRadius: 10,
            background: "var(--panel)", padding: "40px 36px", textAlign: "center",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "var(--accent-bg)", color: "var(--accent-ink)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
            }}>
              <IconCheck size={20} />
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>
              {form.name} is in
            </h2>
            <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 22, lineHeight: 1.6 }}>
              Submitted to <span style={{ color: "var(--ink)", fontWeight: 500 }}>{job.title}</span> at {job.company_name}.<br/>
              You'll get a notification when the hiring team responds — usually within 48 hours.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Button variant="primary" onClick={onSuccess}>View in submissions</Button>
              <Button variant="secondary" onClick={onBack}>Back to job</Button>
            </div>
          </div>
        </Page>
      </div>
    );
  }

  return (
    <div>
      <TopBar
        breadcrumb={
          <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--faint)", fontSize: 12.5 }}>
            <IconArrowLeft size={13} /> Back to job
          </button>
        }
        title="Submit a candidate"
        subtitle={`For ${job.title} at ${job.company_name}`}
      />

      <Page maxWidth={720}>
        {/* Job recap */}
        <div style={{
          border: "1px solid var(--line)", borderRadius: 10,
          background: "var(--panel)", padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12, marginBottom: 24,
        }}>
          <CompanyLogo company={job} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{job.title}</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{job.company_name} · {job.location} · {job.remote_type}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.05em" }}>If hired</div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 500 }}>$10,000</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <FormSection title="Candidate" subtitle="Who are you submitting?">
            <div className="hh-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Full name" required error={errors.name}>
                <Input value={form.name} onChange={(v) => update("name", v)} placeholder="e.g. Nina Okafor" />
              </Field>
              <Field label="Email" required error={errors.email}>
                <Input value={form.email} onChange={(v) => update("email", v)} placeholder="name@domain.com" />
              </Field>
            </div>
            <Field label="LinkedIn URL" required error={errors.linkedin}>
              <Input value={form.linkedin} onChange={(v) => update("linkedin", v)} placeholder="linkedin.com/in/…" prefix="https://" />
            </Field>
            <ResumeUpload file={form.resume} onChange={(f) => update("resume", f)} />
          </FormSection>

          <FormSection title="Fit" subtitle="Help the hiring team see why this candidate stands out.">
            <Field label="Why are they a fit?" hint="A 2–4 sentence pitch. The team reads this first." required error={errors.pitch}>
              <Textarea rows={5} value={form.pitch} onChange={(v) => update("pitch", v)}
                placeholder="Ex: Nina led the payments platform team at Stripe for 4 years. She's shipped at startup scale and enterprise scale, writes excellent technical docs, and is looking to join a founding team." />
            </Field>
          </FormSection>

          <FormSection title="Logistics">
            <div className="hh-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Expected comp" hint="Their ask (base or OTE). Used to calibrate." optional>
                <Input value={form.comp} onChange={(v) => update("comp", v)} placeholder="e.g. $200K base" prefix="$" />
              </Field>
              <Field label="Availability to start" optional>
                <select value={form.availability} onChange={(e) => update("availability", e.target.value)}
                  style={{
                    border: "1px solid var(--line)", borderRadius: 6, background: "var(--panel)",
                    padding: "9px 11px", fontSize: 13.5, outline: "none", width: "100%",
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16' fill='none' stroke='%236B6B63' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m4 6 4 4 4-4'/></svg>")`,
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 11px center",
                  }}>
                  <option>Immediately</option>
                  <option>2 weeks</option>
                  <option>1 month</option>
                  <option>2+ months</option>
                  <option>Flexible</option>
                </select>
              </Field>
            </div>
            <Field label="Authorized to work?" hint="Most hiring teams filter on this. Be accurate.">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["US citizen / permanent resident","Authorized, no sponsorship needed","Needs sponsorship now","Will need sponsorship later","Not applicable (role is remote/global)"].map(o => (
                  <Chip key={o} active={form.workAuth === o} onClick={() => update("workAuth", o)}>{o}</Chip>
                ))}
              </div>
            </Field>
          </FormSection>

          {/* Consent */}
          <div style={{
            border: `1.5px solid ${errors.consent ? "var(--rose-ink)" : "var(--warn-ink)"}`,
            borderRadius: 8, background: "var(--warn-bg)", overflow: "hidden",
          }}>
            <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--warn-ink)", letterSpacing: "0.01em" }}>⚠ Sourcer Acknowledgment</span>
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.consent} onChange={(e) => update("consent", e.target.checked)}
                style={{ marginTop: 3, accentColor: "var(--ink)", flexShrink: 0, width: 15, height: 15 }} />
              <span style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
                I confirm that this candidate has given their <strong>explicit consent</strong> to be submitted for this role, and that all information provided is accurate to the best of my knowledge. I understand that submitting candidates without their approval, or providing inaccurate information, <strong>may result in permanent suspension from the platform.</strong>
                {errors.consent && <span style={{ color: "var(--rose-ink)", display: "block", marginTop: 6, fontSize: 12, fontWeight: 500 }}>✗ {errors.consent}</span>}
              </span>
            </label>
          </div>

          {dbError && (
            <div style={{ padding: "10px 14px", background: "var(--rose-bg)", color: "var(--rose-ink)", borderRadius: 6, fontSize: 13 }}>
              {dbError}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", paddingTop: 6 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="ghost" onClick={onBack}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit candidate"}
              </Button>
            </div>
          </div>
        </div>
      </Page>
    </div>
  );
}

function FormSection({ title, subtitle, children }) {
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "var(--panel)", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.005em" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function ResumeUpload({ file, onChange }) {
  const { IconUpload, IconX, IconCheck } = window.HH_ICONS;
  const { Field } = window.HH_P;
  const [dragging, setDragging] = useStateSubmit(false);

  return (
    <Field label="Resume" hint="PDF or DOCX, up to 10 MB" optional>
      {file ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 6, background: "var(--accent-bg)" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--accent)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <IconCheck size={14} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
            <div className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>{(file.size/1024).toFixed(0)} KB</div>
          </div>
          <button onClick={() => onChange(null)} style={{ color: "var(--muted)", padding: 6, borderRadius: 4 }}><IconX size={14} /></button>
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onChange({ name: f.name, size: f.size }); }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, padding: "18px 14px",
            border: `1.5px dashed ${dragging ? "var(--ink)" : "var(--line)"}`,
            borderRadius: 8, background: dragging ? "#F5F3EC" : "transparent",
            cursor: "pointer", fontSize: 13, color: "var(--muted)", transition: "all 0.12s",
          }}>
          <IconUpload size={14} />
          <span>Drop a resume or <span style={{ color: "var(--ink)", fontWeight: 500, textDecoration: "underline", textDecorationColor: "var(--line)", textUnderlineOffset: 3 }}>browse</span></span>
          <input type="file" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) onChange({ name: f.name, size: f.size }); }} />
        </label>
      )}
    </Field>
  );
}

window.HH_SUBMIT = { SubmitScreen };
