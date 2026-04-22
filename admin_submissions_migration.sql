-- Admin RLS: allow authenticated users (admin) to read/update all submissions
DO $$ BEGIN
  CREATE POLICY "auth read all submissions"
    ON hh_submissions FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth update any submission"
    ON hh_submissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
