-- ============================================================
-- ROW LEVEL SECURITY — Oeyen Coaching Dashboard
-- Uitvoeren in Supabase SQL Editor (eenmalig)
-- ============================================================

-- Helper: controleer of ingelogde user een coach is
CREATE OR REPLACE FUNCTION is_coach()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'coach'
  )
$$;

-- Helper: haal het client-id op van de ingelogde user
CREATE OR REPLACE FUNCTION my_client_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM clients
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- ============================================================
-- CLIENTS
-- ============================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Coach kan alles
CREATE POLICY "coach_all_clients" ON clients
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan enkel zijn eigen rij lezen
CREATE POLICY "client_read_own" ON clients
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Client kan zijn eigen user_id updaten (intake flow)
CREATE POLICY "client_update_own_userid" ON clients
  FOR UPDATE TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Anoniem mag een nieuwe client aanmaken (intake formulier)
CREATE POLICY "anon_insert_intake" ON clients
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ============================================================
-- PAYMENTS
-- ============================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Alleen coach heeft toegang
CREATE POLICY "coach_all_payments" ON payments
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- ============================================================
-- DAILY LOGS
-- ============================================================
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Coach kan alle logs lezen
CREATE POLICY "coach_read_logs" ON daily_logs
  FOR SELECT TO authenticated
  USING (is_coach());

-- Client kan enkel zijn eigen logs lezen en schrijven
CREATE POLICY "client_own_logs" ON daily_logs
  FOR ALL TO authenticated
  USING (client_id = my_client_id())
  WITH CHECK (client_id = my_client_id());

-- ============================================================
-- WEEKLY CHECKINS
-- ============================================================
ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;

-- Coach kan alle check-ins lezen en antwoorden
CREATE POLICY "coach_all_checkins" ON weekly_checkins
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan eigen check-ins lezen en aanmaken
CREATE POLICY "client_own_checkins" ON weekly_checkins
  FOR ALL TO authenticated
  USING (client_id = my_client_id())
  WITH CHECK (client_id = my_client_id());

-- ============================================================
-- TRAINING SCHEMAS
-- ============================================================
ALTER TABLE training_schemas ENABLE ROW LEVEL SECURITY;

-- Coach kan alles
CREATE POLICY "coach_all_schemas" ON training_schemas
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan eigen schema's lezen
CREATE POLICY "client_read_own_schemas" ON training_schemas
  FOR SELECT TO authenticated
  USING (client_id = my_client_id());

-- ============================================================
-- TRAINING EXERCISES
-- ============================================================
ALTER TABLE training_exercises ENABLE ROW LEVEL SECURITY;

-- Coach kan alles
CREATE POLICY "coach_all_exercises" ON training_exercises
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan oefeningen lezen van zijn eigen schema's
CREATE POLICY "client_read_own_exercises" ON training_exercises
  FOR SELECT TO authenticated
  USING (
    schema_id IN (
      SELECT id FROM training_schemas WHERE client_id = my_client_id()
    )
  );

-- ============================================================
-- TRAINING LOGS
-- ============================================================
ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;

-- Coach kan alles lezen
CREATE POLICY "coach_read_training_logs" ON training_logs
  FOR SELECT TO authenticated
  USING (is_coach());

-- Client kan eigen logs lezen en schrijven
CREATE POLICY "client_own_training_logs" ON training_logs
  FOR ALL TO authenticated
  USING (client_id = my_client_id())
  WITH CHECK (client_id = my_client_id());

-- ============================================================
-- BODY MEASUREMENTS
-- ============================================================
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- Coach kan alles
CREATE POLICY "coach_all_measurements" ON body_measurements
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan eigen metingen lezen en toevoegen
CREATE POLICY "client_own_measurements" ON body_measurements
  FOR ALL TO authenticated
  USING (client_id = my_client_id())
  WITH CHECK (client_id = my_client_id());

-- ============================================================
-- SKINFOLD MEASUREMENTS
-- ============================================================
ALTER TABLE skinfold_measurements ENABLE ROW LEVEL SECURITY;

-- Coach kan alles
CREATE POLICY "coach_all_skinfolds" ON skinfold_measurements
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan eigen skinfolds lezen
CREATE POLICY "client_read_own_skinfolds" ON skinfold_measurements
  FOR SELECT TO authenticated
  USING (client_id = my_client_id());

-- ============================================================
-- MEAL PLANS
-- ============================================================
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Coach kan alles
CREATE POLICY "coach_all_meal_plans" ON meal_plans
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan eigen actief maaltijdplan lezen
CREATE POLICY "client_read_own_meal_plans" ON meal_plans
  FOR SELECT TO authenticated
  USING (client_id = my_client_id());

-- ============================================================
-- MEAL PLAN ITEMS
-- ============================================================
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;

-- Coach kan alles
CREATE POLICY "coach_all_meal_items" ON meal_plan_items
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan items lezen van zijn eigen maaltijdplannen
CREATE POLICY "client_read_own_meal_items" ON meal_plan_items
  FOR SELECT TO authenticated
  USING (
    meal_plan_id IN (
      SELECT id FROM meal_plans WHERE client_id = my_client_id()
    )
  );

-- ============================================================
-- APPOINTMENTS
-- ============================================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Coach kan alles
CREATE POLICY "coach_all_appointments" ON appointments
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan eigen afspraken lezen
CREATE POLICY "client_read_own_appointments" ON appointments
  FOR SELECT TO authenticated
  USING (client_id = my_client_id());

-- ============================================================
-- FOODS (voedingsdatabase — gedeeld, alleen lezen voor clients)
-- ============================================================
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

-- Coach kan alles (beheer voedingsdatabase)
CREATE POLICY "coach_all_foods" ON foods
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Alle ingelogde users kunnen voeding lezen
CREATE POLICY "all_read_foods" ON foods
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- PROFILES (voor role check)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Iedereen kan eigen profiel lezen
CREATE POLICY "read_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Coach kan alle profielen lezen
CREATE POLICY "coach_read_all_profiles" ON profiles
  FOR SELECT TO authenticated
  USING (is_coach());

-- Eigen profiel updaten
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
