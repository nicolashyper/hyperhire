-- HyperHire MVP schema
-- Run via: node -e "require('./run_migration.js')"

CREATE TABLE IF NOT EXISTS hh_recruiters (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  linkedin_url  TEXT,
  years_exp     TEXT,
  functions     TEXT[],
  locations     TEXT[],
  bio           TEXT,
  payout_method TEXT,
  is_vetted     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hh_jobs (
  id                   TEXT PRIMARY KEY,
  title                TEXT NOT NULL,
  company_name         TEXT,
  company_logo         TEXT,
  company_tint         TEXT,
  company_industry     TEXT,
  company_size         TEXT,
  company_stage        TEXT,
  location             TEXT,
  remote_type          TEXT,
  comp_range           TEXT,
  seniority            TEXT,
  function_area        TEXT,
  fee                  INTEGER DEFAULT 10000,
  description          TEXT,
  must_haves           JSONB,
  nice_to_haves        JSONB,
  hiring_manager_name  TEXT,
  hiring_manager_title TEXT,
  about_company        TEXT,
  jd_url               TEXT,
  is_urgent            BOOLEAN DEFAULT FALSE,
  is_active            BOOLEAN DEFAULT TRUE,
  days_open            INTEGER DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hh_submissions (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  recruiter_email  TEXT NOT NULL,
  job_id           TEXT REFERENCES hh_jobs(id),
  candidate_name   TEXT NOT NULL,
  candidate_email  TEXT NOT NULL,
  linkedin_url     TEXT,
  pitch            TEXT,
  expected_comp    TEXT,
  availability     TEXT,
  work_auth        TEXT,
  resume_filename  TEXT,
  status           TEXT DEFAULT 'Submitted',
  stage            TEXT DEFAULT 'Awaiting review',
  note             TEXT,
  rejection_note   TEXT,
  hired_at         TIMESTAMPTZ,
  submitted_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hh_rewards_ledger (
  id              BIGSERIAL PRIMARY KEY,
  recruiter_email TEXT NOT NULL,
  period_month    TEXT,
  tier            TEXT,
  amount          INTEGER,
  status          TEXT DEFAULT 'Pending',
  paid_at         DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE hh_recruiters     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hh_jobs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE hh_submissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hh_rewards_ledger ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hh_jobs' AND policyname='anon read jobs') THEN
    CREATE POLICY "anon read jobs" ON hh_jobs FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hh_recruiters' AND policyname='anon insert recruiter') THEN
    CREATE POLICY "anon insert recruiter" ON hh_recruiters FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hh_recruiters' AND policyname='anon update recruiter') THEN
    CREATE POLICY "anon update recruiter" ON hh_recruiters FOR UPDATE TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hh_recruiters' AND policyname='anon read recruiter') THEN
    CREATE POLICY "anon read recruiter" ON hh_recruiters FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hh_submissions' AND policyname='anon insert submission') THEN
    CREATE POLICY "anon insert submission" ON hh_submissions FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hh_submissions' AND policyname='anon read submissions') THEN
    CREATE POLICY "anon read submissions" ON hh_submissions FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hh_rewards_ledger' AND policyname='anon read rewards') THEN
    CREATE POLICY "anon read rewards" ON hh_rewards_ledger FOR SELECT TO anon USING (true);
  END IF;
END $$;
