// App root — routing, data loading, vetting gate

const { useState: useStateApp, useEffect: useEffectApp, useCallback: useCallbackApp } = React;

function App() {
  const sb = window.HH_SB;
  const { OnboardingScreen, SignInScreen, PendingScreen } = window.HH_ONBOARDING;
  const { Sidebar, MobileNav } = window.HH_SHELL;
  const { JobsScreen } = window.HH_JOBS;
  const { JobDetailScreen } = window.HH_JOB_DETAIL;
  const { SubmitScreen } = window.HH_SUBMIT;
  const { SubmissionsScreen, ProfileScreen } = window.HH_SUBMISSIONS;
  const { RewardsScreen } = window.HH_REWARDS;

  // Auth / identity
  const [recruiter, setRecruiter] = useStateApp(null); // null = loading, false = not onboarded
  const [authLoading, setAuthLoading] = useStateApp(true);

  // App data
  const [jobs, setJobs] = useStateApp([]);
  const [jobsLoading, setJobsLoading] = useStateApp(true);
  const [submissions, setSubmissions] = useStateApp([]);
  const [submissionsLoading, setSubmissionsLoading] = useStateApp(true);

  // Navigation
  const [screen, setScreen] = useStateApp("jobs");
  const [activeJobId, setActiveJobId] = useStateApp(null);

  // Load recruiter on mount
  useEffectApp(() => {
    const email = localStorage.getItem('hh_email');
    if (!email) { setAuthLoading(false); setRecruiter(false); return; }
    sb.from('hh_recruiters').select('*').eq('email', email).maybeSingle()
      .then(({ data }) => {
        setRecruiter(data || false);
        setAuthLoading(false);
      });
  }, []);

  // Load jobs once recruiter is vetted
  useEffectApp(() => {
    if (!recruiter || !recruiter.is_vetted) return;
    sb.from('hh_jobs').select('*').eq('is_active', true)
      .then(({ data }) => { setJobs(data || []); setJobsLoading(false); });
  }, [recruiter]);

  // Load submissions when recruiter is vetted
  useEffectApp(() => {
    if (!recruiter || !recruiter.is_vetted) return;
    sb.from('hh_submissions').select('*')
      .eq('recruiter_email', recruiter.email)
      .order('submitted_at', { ascending: false })
      .then(({ data }) => { setSubmissions(data || []); setSubmissionsLoading(false); });
  }, [recruiter]);

  const refreshSubmissions = useCallbackApp(async () => {
    if (!recruiter?.email) return;
    const { data } = await sb.from('hh_submissions').select('*')
      .eq('recruiter_email', recruiter.email)
      .order('submitted_at', { ascending: false });
    setSubmissions(data || []);
  }, [recruiter]);

  // After onboarding completes, re-read recruiter row
  const handleOnboardingComplete = () => {
    const email = localStorage.getItem('hh_email');
    if (!email) return;
    sb.from('hh_recruiters').select('*').eq('email', email).maybeSingle()
      .then(({ data }) => setRecruiter(data || false));
  };

  // ── Loading splash ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>H</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Loading…</div>
        </div>
      </div>
    );
  }

  // ── Not onboarded ────────────────────────────────────────────────────────────
  if (recruiter === false) {
    const isSignIn = new URLSearchParams(window.location.search).has('signin');
    return isSignIn
      ? <SignInScreen />
      : <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // ── Onboarded but not yet vetted ─────────────────────────────────────────────
  if (!recruiter.is_vetted) {
    return <PendingScreen name={recruiter.name} />;
  }

  // ── Main app ─────────────────────────────────────────────────────────────────
  const openJob = (id) => { setActiveJobId(id); setScreen("job_detail"); };
  const openSubmit = (id) => { setActiveJobId(id || activeJobId); setScreen("submit"); };

  const renderScreen = () => {
    if (screen === "jobs") {
      return <JobsScreen jobs={jobs} jobsLoading={jobsLoading} onOpenJob={openJob} submissions={submissions} />;
    }
    if (screen === "job_detail") {
      return <JobDetailScreen jobId={activeJobId} jobs={jobs} onBack={() => setScreen("jobs")} onSubmit={() => openSubmit(activeJobId)} />;
    }
    if (screen === "submit") {
      return (
        <SubmitScreen
          jobId={activeJobId} jobs={jobs}
          recruiterEmail={recruiter.email}
          onBack={() => setScreen("job_detail")}
          onSuccess={async () => { await refreshSubmissions(); setScreen("submissions"); }}
        />
      );
    }
    if (screen === "submissions") {
      return <SubmissionsScreen submissions={submissions} submissionsLoading={submissionsLoading} jobs={jobs} onOpenJob={openJob} onRefresh={refreshSubmissions} />;
    }
    if (screen === "rewards") {
      return <RewardsScreen submissions={submissions} recruiterEmail={recruiter.email} />;
    }
    if (screen === "onboarding") {
      return <ProfileScreen recruiter={recruiter} />;
    }
    return null;
  };

  return (
    <div className="hh-layout" style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar
        currentView={screen}
        onNav={setScreen}
        recruiter={recruiter}
        submissions={submissions}
      />
      <div className="hh-content" style={{ flex: 1, minWidth: 0 }}>
        {renderScreen()}
      </div>
      <MobileNav currentView={screen} onNav={setScreen} submissions={submissions} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
