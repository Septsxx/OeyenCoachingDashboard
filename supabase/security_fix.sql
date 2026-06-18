-- ============================================================
-- SECURITY FIX — Oeyen Coaching
-- Uitvoeren in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- 1. FUNCTIONS: search_path vergrendelen
--    SECURITY DEFINER functies zonder search_path zijn kwetsbaar
--    voor search_path hijacking. Fix: SET search_path = ''
--    en gebruik volledig gekwalificeerde tabelnamen (public.x).
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach'
  )
$$;

CREATE OR REPLACE FUNCTION public.my_client_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT id FROM public.clients WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_expiry_date(p_date DATE, p_package public.package_type)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  RETURN CASE p_package
    WHEN '3_months'  THEN p_date + INTERVAL '3 months'
    WHEN '6_months'  THEN p_date + INTERVAL '6 months'
    WHEN '12_months' THEN p_date + INTERVAL '12 months'
  END;
END;
$$;

-- ============================================================
-- 2. SUPPLEMENTS: policies herschrijven
--    Oud: coach_id = auth.uid() — werkt niet, coach_id is NULL
--    Nieuw: is_coach() consistent met de rest van de app
-- ============================================================

ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coach can manage supplements"  ON supplements;
DROP POLICY IF EXISTS "Client reads own supplements"  ON supplements;
DROP POLICY IF EXISTS "supplements_coach_all"         ON supplements;
DROP POLICY IF EXISTS "supplements_client_select"     ON supplements;

CREATE POLICY "supplements_coach_all" ON supplements
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

CREATE POLICY "supplements_client_select" ON supplements
  FOR SELECT TO authenticated
  USING (client_id = my_client_id());

-- ============================================================
-- 3. WEEKLY TIMELINE: policies herschrijven + client lezen
--    Oud: alleen coach policy via coach_id (werkt niet)
--    Nieuw: is_coach() + client kan eigen tijdlijn lezen
-- ============================================================

ALTER TABLE weekly_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coach can manage timeline"    ON weekly_timeline;
DROP POLICY IF EXISTS "timeline_coach_all"           ON weekly_timeline;
DROP POLICY IF EXISTS "timeline_client_select"       ON weekly_timeline;

CREATE POLICY "timeline_coach_all" ON weekly_timeline
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

CREATE POLICY "timeline_client_select" ON weekly_timeline
  FOR SELECT TO authenticated
  USING (client_id = my_client_id());

-- ============================================================
-- 4. COACH SETTINGS: bevestig correcte policy
-- ============================================================

ALTER TABLE coach_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coach manages own settings" ON coach_settings;
DROP POLICY IF EXISTS "coach_settings_all"         ON coach_settings;

CREATE POLICY "coach_settings_all" ON coach_settings
  FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());
