-- Admin RLS: allow authenticated users (admin) to read/update/delete all recruiters
DO $$ BEGIN
  CREATE POLICY "auth read all recruiters"
    ON hh_recruiters FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth update any recruiter"
    ON hh_recruiters FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth delete recruiter"
    ON hh_recruiters FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
