// Onboarding flow — 3 steps → upserts hh_recruiters, gates on vetting

const { useState: useStateOnb } = React;

const CALENDLY_URL = "https://calendly.com/nicolas-hypertalent/hyperhire-recruiter-onboarding";

function OnboardingScreen({ onComplete }) {
  const { Button, Field, Input, Textarea, Chip } = window.HH_P;
  const { IconCheck } = window.HH_ICONS;
  const sb = window.HH_SB;

  const [step, setStep] = useStateOnb(1);
  const [saving, setSaving] = useStateOnb(false);
  const [saveError, setSaveError] = useStateOnb(null);
  const [done, setDone] = useStateOnb(false);
  const [signInEmail, setSignInEmail] = useStateOnb("");
  const [signInError, setSignInError] = useStateOnb("");

  const [form, setForm] = useStateOnb({
    name: "", email: "", linkedin_url: "",
    years_exp: "", functions: [],
    locations: [], bio: "",
  });
  const [errors, setErrors] = useStateOnb({});

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k, v) => setForm(f => {
    const arr = f[k];
    return { ...f, [k]: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] };
  });

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.name.trim()) e.name = "Required";
      if (!form.email || !form.email.includes("@")) e.email = "Valid email required";
      if (!form.linkedin_url.trim()) e.linkedin_url = "Required";
    }
    if (step === 2) {
      if (!form.years_exp) e.years_exp = "Required";
      if (form.functions.length === 0) e.functions = "Select at least one";
    }
    if (step === 3) {
      if (form.locations.length === 0) e.locations = "Select at least one";
      if (!form.bio.trim()) e.bio = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;

    if (step === 1) {
      setSaving(true);
      setSaveError(null);
      const { error } = await sb.from('hh_recruiters').upsert({
        email: form.email.trim().toLowerCase(),
        name: form.name.trim(),
        linkedin_url: `https://${form.linkedin_url.replace(/^https?:\/\//, '')}`,
        is_vetted: false,
      }, { onConflict: 'email' });
      setSaving(false);
      if (error) { setSaveError(error.message); return; }
      localStorage.setItem('hh_email', form.email.trim().toLowerCase());
      localStorage.setItem('hh_name', form.name.trim());
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    // Step 3 — final submit
    setSaving(true);
    setSaveError(null);
    const { error } = await sb.from('hh_recruiters').update({
      years_exp: form.years_exp,
      functions: form.functions,
      locations: form.locations,
      bio: form.bio.trim(),
    }).eq('email', form.email.trim().toLowerCase());
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setDone(true);
  };

  const handleSignIn = async () => {
    const email = signInEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) { setSignInError("Enter a valid email"); return; }
    // Check if recruiter exists
    const { data } = await sb.from('hh_recruiters').select('email, name').eq('email', email).maybeSingle();
    if (!data) { setSignInError("No account found with that email"); return; }
    localStorage.setItem('hh_email', data.email);
    if (data.name) localStorage.setItem('hh_name', data.name);
    window.location.reload();
  };

  if (done) return <PendingScreen name={form.name} />;

  const steps = ["Account", "Expertise", "Profile"];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>

      {/* Logo */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>H</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>HyperHire</span>
      </div>

      {/* Step indicator */}
      <div className="hh-onb-steps" style={{ display: "flex", gap: 6, marginBottom: 32, alignItems: "center", justifyContent: "center" }}>
        {steps.map((s, i) => {
          const idx = i + 1;
          const active = idx === step;
          const done_ = idx < step;
          return (
            <React.Fragment key={s}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", fontSize: 11, fontWeight: 600,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: done_ ? "var(--accent)" : active ? "var(--ink)" : "var(--line)",
                  color: done_ || active ? "#fff" : "var(--muted)",
                }}>
                  {done_ ? <IconCheck size={11} /> : idx}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? "var(--ink)" : "var(--muted)" }}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 24, height: 1, background: "var(--line)", flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 480, border: "1px solid var(--line)", borderRadius: 14, background: "var(--panel)", padding: "28px 32px" }}>
        {step === 1 && <StepAccount form={form} update={update} errors={errors} />}
        {step === 2 && <StepExpertise form={form} update={update} toggleArr={toggleArr} errors={errors} />}
        {step === 3 && <StepProfile form={form} update={update} errors={errors} />}

        {saveError && (
          <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--rose-bg)", color: "var(--rose-ink)", borderRadius: 6, fontSize: 13 }}>
            {saveError}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
          <Button variant="primary" onClick={handleNext} disabled={saving}>
            {saving ? "Saving…" : step === 3 ? "Submit application" : "Continue"}
          </Button>
        </div>
      </div>

      {/* Sign in link */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>Already applied? </span>
        <a href="?signin" style={{
          fontSize: 13, fontWeight: 600, color: "var(--ink)",
          textDecoration: "underline", textDecorationColor: "var(--line)",
          textUnderlineOffset: 3,
        }}>Sign in →</a>
      </div>

      {/* Trust strip */}
      <div style={{ marginTop: 48, width: "100%", maxWidth: 680, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 18, letterSpacing: "0.02em" }}>
          100+ startups hire with HyperHire, backed by
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px 0", alignItems: "center", justifyItems: "center" }}>
          {[
            { src: "assets/investors/yc.png",         alt: "Y Combinator" },
            { src: "assets/investors/sequoia.png",    alt: "Sequoia" },
            { src: "assets/investors/a16z.png",       alt: "a16z" },
            { src: "assets/investors/accel.png",      alt: "Accel" },
            { src: "assets/investors/paradigm.png",   alt: "Paradigm" },
            { src: "assets/investors/lightspeed.png", alt: "Lightspeed" },
          ].map(({ src, alt }) => (
            <img key={alt} src={src} alt={alt} style={{
              height: 22, width: "auto", objectFit: "contain",
              filter: "grayscale(1) opacity(0.4)",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sign-in screen (standalone, shown at ?signin) ─────────────────────────────
function SignInScreen() {
  const { Button } = window.HH_P;
  const sb = window.HH_SB;
  const [email, setEmail] = useStateOnb("");
  const [error, setError] = useStateOnb("");
  const [loading, setLoading] = useStateOnb(false);

  const handleSignIn = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@")) { setError("Enter a valid email address"); return; }
    setLoading(true); setError("");
    const { data } = await sb.from('hh_recruiters').select('email, name').eq('email', e).maybeSingle();
    if (!data) { setError("No account found with that email. Did you mean to sign up?"); setLoading(false); return; }
    localStorage.setItem('hh_email', data.email);
    if (data.name) localStorage.setItem('hh_name', data.name);
    window.location.href = window.location.pathname;
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>H</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>HyperHire</span>
      </div>

      <div style={{ width: "100%", maxWidth: 400, border: "1px solid var(--line)", borderRadius: 14, background: "var(--panel)", padding: "32px 32px" }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>Sign in</div>
        <div style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 24, lineHeight: 1.55 }}>
          Enter the email you used when you applied.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSignIn()}
            placeholder="jane@gmail.com"
            autoFocus
            style={{
              width: "100%", border: "1px solid var(--line)", borderRadius: 7,
              padding: "10px 13px", fontSize: 14, outline: "none", background: "var(--bg)",
            }}
          />
          {error && <div style={{ fontSize: 12.5, color: "var(--rose-ink)" }}>{error}</div>}
        </div>

        <div style={{ marginTop: 16 }}>
          <Button variant="primary" onClick={handleSignIn} disabled={loading}>
            {loading ? "Signing in…" : "Sign in →"}
          </Button>
        </div>
      </div>

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>New here? </span>
        <a href={window.location.pathname} style={{
          fontSize: 13, fontWeight: 600, color: "var(--ink)",
          textDecoration: "underline", textDecorationColor: "var(--line)",
          textUnderlineOffset: 3,
        }}>Apply as a recruiter →</a>
      </div>
    </div>
  );
}

function StepAccount({ form, update, errors }) {
  const { Field, Input } = window.HH_P;
  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>Create your account</div>
        <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55 }}>You'll use this to track your submissions and earnings.</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Full name" required error={errors.name}>
          <Input value={form.name} onChange={(v) => update("name", v)} placeholder="Jane Smith" />
        </Field>
        <Field label="Work email" required error={errors.email}>
          <Input value={form.email} onChange={(v) => update("email", v)} placeholder="jane@gmail.com" />
        </Field>
        <Field label="LinkedIn URL" required error={errors.linkedin_url}>
          <Input value={form.linkedin_url} onChange={(v) => update("linkedin_url", v.replace(/^https?:\/\//, ''))} placeholder="linkedin.com/in/…" prefix="https://" />
        </Field>
      </div>
    </div>
  );
}

function StepExpertise({ form, update, toggleArr, errors }) {
  const { Chip, Field } = window.HH_P;
  const fnOptions = ["Engineering", "Product", "Design", "Sales", "Marketing", "Operations", "Finance", "Legal", "Other"];
  const expOptions = ["0–1 years", "2–3 years", "4–6 years", "7–10 years", "10+ years"];

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>Your recruiting expertise</div>
        <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55 }}>Helps us match you with the right roles.</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Field label="Years of recruiting experience" required error={errors.years_exp}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
            {expOptions.map(o => (
              <Chip key={o} active={form.years_exp === o} onClick={() => update("years_exp", o)}>{o}</Chip>
            ))}
          </div>
        </Field>
        <Field label="Functions you recruit for" required error={errors.functions}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
            {fnOptions.map(o => (
              <Chip key={o} active={form.functions.includes(o)} onClick={() => toggleArr("functions", o)}>{o}</Chip>
            ))}
          </div>
        </Field>
      </div>
    </div>
  );
}

function StepProfile({ form, update, errors }) {
  const { Field, Textarea, Chip } = window.HH_P;
  const locationOptions = ["San Francisco Bay Area", "New York", "Los Angeles", "Austin", "Remote / US", "International"];

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>Your profile</div>
        <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55 }}>Shown to hiring managers reviewing your candidates.</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Field label="Locations you recruit in" required error={errors.locations}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
            {locationOptions.map(o => (
              <Chip key={o} active={(form.locations || []).includes(o)} onClick={() => {
                const arr = form.locations || [];
                update("locations", arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o]);
              }}>{o}</Chip>
            ))}
          </div>
        </Field>
        <Field label="Short bio" hint="2–3 sentences. What makes your sourcing unique?" required error={errors.bio}>
          <Textarea rows={4} value={form.bio} onChange={(v) => update("bio", v)}
            placeholder="Ex: I've spent 6 years placing senior engineers at Series A/B startups in SF. I source passively — most of my candidates aren't actively looking." />
        </Field>
      </div>
    </div>
  );
}

function PendingScreen({ name }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>H</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>HyperHire</span>
      </div>

      <div style={{ width: "100%", maxWidth: 480, border: "1px solid var(--line)", borderRadius: 14, background: "var(--panel)", padding: "36px 32px", textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent-bg)", color: "var(--accent-ink)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18, fontSize: 22 }}>👋</div>

        <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
          You're on the list{name ? `, ${name.split(" ")[0]}` : ""}
        </h2>

        <p style={{ margin: "0 0 6px", fontSize: 14, color: "var(--ink-2)", lineHeight: 1.65 }}>
          Your application is under review. We vet every recruiter manually to keep the quality bar high for hiring managers.
        </p>
        <p style={{ margin: "0 0 26px", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55 }}>
          To get approved, you must book a 10-minute intro call.
        </p>

        <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "var(--ink)", color: "#fff",
            padding: "12px 22px", borderRadius: 8,
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >
            <span style={{ fontSize: 16 }}>📅</span>
            Book intro call · 10 min
          </div>
        </a>

        <div style={{ marginTop: 20, fontSize: 12.5, color: "var(--faint)" }}>
          We'll email you once your account is approved after the call.
        </div>
      </div>

      <button
        onClick={() => { localStorage.clear(); window.location.reload(); }}
        style={{ marginTop: 20, fontSize: 12.5, color: "var(--faint)", textDecoration: "underline", textDecorationColor: "var(--line)", textUnderlineOffset: 3 }}
      >
        Sign out
      </button>
    </div>
  );
}

window.HH_ONBOARDING = { OnboardingScreen, SignInScreen, PendingScreen };
