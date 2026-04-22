// Jobs list screen — fetches from hh_jobs via Supabase

const { useState: useStateJobs, useMemo: useMemoJobs } = React;

function parseSalaryMin(comp) {
  if (!comp) return null;
  const nums = comp.match(/\d+/g);
  if (!nums) return null;
  const vals = nums.map(n => { const v = parseInt(n); return v < 2000 ? v * 1000 : v; });
  return Math.min(...vals);
}

function JobsScreen({ onOpenJob, jobs, jobsLoading, submissions }) {
  const { Chip } = window.HH_P;
  const { IconSearch, IconMapPin, IconArrowRight } = window.HH_ICONS;
  const { TopBar, Page } = window.HH_SHELL;

  const [q, setQ] = useStateJobs("");
  const [fn, setFn] = useStateJobs("All");
  const [remote, setRemote] = useStateJobs("All");
  const [salary, setSalary] = useStateJobs("Any");
  const [sort, setSort] = useStateJobs("Newest");

  const functions = ["All", "Engineering", "Product", "Design", "Sales", "Marketing", "Operations", "Other"];
  const remotes = ["All", "Remote", "Hybrid", "On-site"];
  const salaryBands = [
    { label: "Any", min: 0 },
    { label: "$150K+", min: 150000 },
    { label: "$200K+", min: 200000 },
    { label: "$250K+", min: 250000 },
    { label: "$300K+", min: 300000 },
  ];

  // Per-job submission stats for the current recruiter
  const jobStats = useMemoJobs(() => {
    const stats = {};
    (submissions || []).forEach(s => {
      if (!stats[s.job_id]) stats[s.job_id] = { total: 0, interviewing: 0 };
      stats[s.job_id].total++;
      if (s.status === 'Interviewing') stats[s.job_id].interviewing++;
    });
    return stats;
  }, [submissions]);

  const filtered = useMemoJobs(() => {
    const band = salaryBands.find(b => b.label === salary) || salaryBands[0];
    let list = jobs.filter(j => {
      if (fn !== "All" && j.function_area !== fn) return false;
      if (remote !== "All" && j.remote_type !== remote) return false;
      if (q && !(`${j.title} ${j.company_name} ${j.location}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (band.min > 0) {
        const ms = parseSalaryMin(j.comp_range);
        if (!ms || ms < band.min) return false;
      }
      return true;
    });
    if (sort === "Newest") list = [...list].sort((a,b) => a.days_open - b.days_open);
    if (sort === "Most submissions") list = [...list].sort((a,b) => (b.submissions||0) - (a.submissions||0));
    if (sort === "Fewest submissions") list = [...list].sort((a,b) => (a.submissions||0) - (b.submissions||0));
    return list;
  }, [q, fn, remote, salary, sort, jobs]);

  return (
    <div>
      <TopBar
        title="Open jobs"
        subtitle={`${jobs.length} roles hiring now · all pay $10,000 per placement`}
      />

      <Page>
        {/* Search + sort */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
          <div style={{ flex: 1, maxWidth: 420 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              border: "1px solid var(--line)", borderRadius: 6,
              background: "var(--panel)", padding: "0 11px",
            }}>
              <IconSearch style={{ color: "var(--faint)" }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search role, company, or location"
                style={{ flex: 1, border: "none", background: "transparent", outline: "none", padding: "9px 0", fontSize: 13.5 }}
              />
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12.5, color: "var(--faint)" }}>Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                border: "1px solid var(--line)", borderRadius: 6,
                padding: "7px 28px 7px 11px", fontSize: 13, color: "var(--ink)", outline: "none",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16' fill='none' stroke='%236B6B63' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m4 6 4 4 4-4'/></svg>")`,
                backgroundRepeat: "no-repeat", backgroundPosition: "right 9px center",
              }}
            >
              <option>Newest</option>
              <option>Most submissions</option>
              <option>Fewest submissions</option>
            </select>
          </div>
        </div>

        {/* Function filter */}
        <div className="hh-filter-chips" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {functions.map(f => <Chip key={f} active={fn === f} onClick={() => setFn(f)}>{f}</Chip>)}
        </div>

        {/* Remote filter */}
        <div className="hh-filter-chips" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {remotes.map(r => <Chip key={r} active={remote === r} onClick={() => setRemote(r)}>{r}</Chip>)}
        </div>

        {/* Salary filter */}
        <div className="hh-filter-chips" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {salaryBands.map(b => <Chip key={b.label} active={salary === b.label} onClick={() => setSalary(b.label)}>{b.label}</Chip>)}
        </div>

        {/* Count */}
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>
          Showing <span className="mono" style={{ color: "var(--ink)" }}>{filtered.length}</span> of {jobs.length}
        </div>

        {/* List */}
        <div style={{ border: "1px solid var(--line)", borderRadius: 8, background: "var(--panel)", overflow: "hidden" }}>
          {jobsLoading ? (
            Array.from({length: 8}).map((_, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                borderBottom: i < 7 ? "1px solid var(--line-2)" : "none",
              }}>
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 9 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="skeleton" style={{ height: 14, width: "40%" }} />
                  <div className="skeleton" style={{ height: 12, width: "60%" }} />
                </div>
                <div className="skeleton" style={{ height: 14, width: 80 }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
              No jobs match your filters.
            </div>
          ) : (
            filtered.map((job, i) => (
              <JobRow
                key={job.id} job={job}
                stats={jobStats[job.id] || null}
                onClick={() => onOpenJob(job.id)}
                isLast={i === filtered.length - 1}
              />
            ))
          )}
        </div>
      </Page>
    </div>
  );
}

function JobRow({ job, stats, onClick, isLast }) {
  const { Badge, CompanyLogo } = window.HH_P;
  const { IconMapPin, IconArrowRight } = window.HH_ICONS;
  const [hover, setHover] = useStateJobs(false);

  const daysOpen = job.days_open || 0;
  const newBadge = daysOpen <= 3;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 16,
        width: "100%", padding: "14px 20px",
        borderBottom: isLast ? "none" : "1px solid var(--line-2)",
        background: hover ? "#FBFAF5" : "transparent",
        textAlign: "left", transition: "background 0.1s",
      }}
    >
      <CompanyLogo company={job} size={36} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <div style={{
            fontSize: 14.5, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.005em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {job.title}
          </div>
          {newBadge && <Badge tone="accent">New</Badge>}
          {job.is_urgent && <Badge tone="warn">Priority</Badge>}
        </div>
        <div style={{
          fontSize: 13, color: "var(--muted)",
          display: "flex", gap: 10, alignItems: "center",
          overflow: "hidden", whiteSpace: "nowrap",
        }}>
          <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>{job.company_name}</span>
          {job.location && <><span style={{ color: "var(--line)" }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <IconMapPin size={13} /> {job.location}
          </span></>}
          {job.remote_type && <><span style={{ color: "var(--line)" }}>·</span>
          <span>{job.remote_type}</span></>}
        </div>
        {stats && stats.total > 0 && (
          <div style={{ fontSize: 11.5, marginTop: 4, display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--blue-ink)", background: "var(--blue-bg)", padding: "1px 7px", borderRadius: 999, fontWeight: 500 }}>
              {stats.total} submitted
            </span>
            {stats.interviewing > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--warn-ink)", background: "var(--warn-bg)", padding: "1px 7px", borderRadius: 999, fontWeight: 500 }}>
                {stats.interviewing} interviewing
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right meta */}
      <div className="hh-job-meta" style={{
        display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: "0 28px",
        fontSize: 12.5, color: "var(--muted)", alignItems: "center", flexShrink: 0,
      }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Salary</div>
          <div className="mono" style={{ color: "var(--ink)", fontWeight: 500, fontSize: 13 }}>{job.comp_range || "—"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Fee</div>
          <div className="mono" style={{ color: "var(--ink)", fontWeight: 500, fontSize: 13 }}>$10,000</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Posted</div>
          <div className="mono" style={{ color: "var(--ink)", fontWeight: 500, fontSize: 13 }}>{daysOpen}d ago</div>
        </div>
      </div>

      <div style={{
        color: hover ? "var(--ink)" : "var(--faint)",
        transition: "color 0.12s, transform 0.12s",
        transform: hover ? "translateX(2px)" : "translateX(0)",
      }}>
        <IconArrowRight />
      </div>
    </button>
  );
}

window.HH_JOBS = { JobsScreen };
