-- ============================================================
-- RLS MASTER SCRIPT — Oeyen Coaching
-- Vervangt alle eerdere losse RLS-bestanden.
-- Veilig te herhalen: verwijdert bestaande policies eerst.
-- Uitvoeren in Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- HELPER FUNCTIES
-- ============================================================

-- Controleert of de ingelogde user een coach is.
-- SECURITY DEFINER zodat de functie RLS op profiles omzeilt.
CREATE OR REPLACE FUNCTION is_coach()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach'
  )
$$;

-- Geeft het client-record ID terug van de ingelogde user.
CREATE OR REPLACE FUNCTION my_client_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM clients WHERE user_id = auth.uid() LIMIT 1
$$;

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_profile"          ON profiles;
DROP POLICY IF EXISTS "coach_read_all_profiles"   ON profiles;
DROP POLICY IF EXISTS "update_own_profile"        ON profiles;

-- Elke user leest zijn eigen profiel; coach leest alle profielen
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR is_coach());

-- Elke user kan zijn eigen profiel bijwerken
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- CLIENTS
-- ============================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_all_clients"         ON clients;
DROP POLICY IF EXISTS "client_read_own"           ON clients;
DROP POLICY IF EXISTS "client_update_own_userid"  ON clients;
DROP POLICY IF EXISTS "anon_insert_intake"        ON clients;

-- Coach heeft volledige toegang
CREATE POLICY "clients_coach_all" ON clients
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client leest zijn eigen rij
CREATE POLICY "clients_client_select" ON clients
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Client mag zijn eigen rij updaten (intake-flow koppelt user_id)
CREATE POLICY "clients_client_update" ON clients
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Anoniem mag een nieuw client-record aanmaken (intake-formulier)
CREATE POLICY "clients_anon_insert" ON clients
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ============================================================
-- PAYMENTS
-- ============================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_all_payments" ON payments;

-- Alleen coach heeft toegang tot betalingen
CREATE POLICY "payments_coach_all" ON payments
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- ============================================================
-- DAILY LOGS
-- ============================================================
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_read_logs"   ON daily_logs;
DROP POLICY IF EXISTS "client_own_logs"   ON daily_logs;

-- Coach kan alle logs lezen én schrijven (coach_notes, filled_by='coach')
CREATE POLICY "daily_logs_coach_all" ON daily_logs
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan eigen logs lezen en schrijven
CREATE POLICY "daily_logs_client_all" ON daily_logs
  FOR ALL TO authenticated
  USING (client_id = my_client_id())
  WITH CHECK (client_id = my_client_id());

-- ============================================================
-- WEEKLY CHECKINS
-- ============================================================
ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_all_checkins"  ON weekly_checkins;
DROP POLICY IF EXISTS "client_own_checkins" ON weekly_checkins;

-- Coach kan alle check-ins lezen en antwoorden
CREATE POLICY "checkins_coach_all" ON weekly_checkins
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan eigen check-ins lezen en aanmaken
CREATE POLICY "checkins_client_all" ON weekly_checkins
  FOR ALL TO authenticated
  USING (client_id = my_client_id())
  WITH CHECK (client_id = my_client_id());

-- ============================================================
-- SKINFOLD MEASUREMENTS
-- ============================================================
ALTER TABLE skinfold_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_all_skinfolds"        ON skinfold_measurements;
DROP POLICY IF EXISTS "client_read_own_skinfolds"  ON skinfold_measurements;

-- Coach beheert alle skinfold-metingen
CREATE POLICY "skinfolds_coach_all" ON skinfold_measurements
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan eigen metingen alleen lezen
CREATE POLICY "skinfolds_client_select" ON skinfold_measurements
  FOR SELECT TO authenticated
  USING (client_id = my_client_id());

-- ============================================================
-- BODY MEASUREMENTS
-- ============================================================
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coach manages body measurements"  ON body_measurements;
DROP POLICY IF EXISTS "Client manages own body measurements" ON body_measurements;
DROP POLICY IF EXISTS "coach_all_measurements"           ON body_measurements;
DROP POLICY IF EXISTS "client_own_measurements"          ON body_measurements;

-- Coach beheert alle lichaamsmetingen
CREATE POLICY "body_coach_all" ON body_measurements
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan eigen metingen lezen en toevoegen
CREATE POLICY "body_client_all" ON body_measurements
  FOR ALL TO authenticated
  USING (client_id = my_client_id())
  WITH CHECK (client_id = my_client_id());

-- ============================================================
-- APPOINTMENTS
-- ============================================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_all_appointments"       ON appointments;
DROP POLICY IF EXISTS "client_read_own_appointments" ON appointments;
DROP POLICY IF EXISTS "Coach manages appointments"   ON appointments;
DROP POLICY IF EXISTS "Client reads own appointments" ON appointments;

-- Coach beheert alle afspraken
CREATE POLICY "appointments_coach_all" ON appointments
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan eigen afspraken lezen
CREATE POLICY "appointments_client_select" ON appointments
  FOR SELECT TO authenticated
  USING (client_id = my_client_id());

-- ============================================================
-- FOODS (gedeelde voedingsdatabase)
-- ============================================================
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_all_foods" ON foods;
DROP POLICY IF EXISTS "all_read_foods"  ON foods;

-- Coach beheert de voedingsdatabase
CREATE POLICY "foods_coach_all" ON foods
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Alle ingelogde users kunnen voeding opzoeken
CREATE POLICY "foods_auth_select" ON foods
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- MEAL PLANS
-- ============================================================
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_all_meal_plans"        ON meal_plans;
DROP POLICY IF EXISTS "client_read_own_meal_plans"  ON meal_plans;

-- Coach beheert alle maaltijdplannen
CREATE POLICY "meal_plans_coach_all" ON meal_plans
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan eigen maaltijdplannen lezen
CREATE POLICY "meal_plans_client_select" ON meal_plans
  FOR SELECT TO authenticated
  USING (client_id = my_client_id());

-- ============================================================
-- MEAL PLAN ITEMS
-- ============================================================
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_all_meal_items"       ON meal_plan_items;
DROP POLICY IF EXISTS "client_read_own_meal_items" ON meal_plan_items;

-- Coach beheert alle maaltijditems
CREATE POLICY "meal_items_coach_all" ON meal_plan_items
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan items lezen van zijn eigen maaltijdplannen
CREATE POLICY "meal_items_client_select" ON meal_plan_items
  FOR SELECT TO authenticated
  USING (
    meal_plan_id IN (
      SELECT id FROM meal_plans WHERE client_id = my_client_id()
    )
  );

-- ============================================================
-- TRAINING SCHEMAS
-- ============================================================
ALTER TABLE training_schemas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_all_schemas"                  ON training_schemas;
DROP POLICY IF EXISTS "client_read_own_schemas"            ON training_schemas;
DROP POLICY IF EXISTS "Coach manages training schemas"     ON training_schemas;
DROP POLICY IF EXISTS "Client reads own training schemas"  ON training_schemas;

-- Coach beheert alle trainingsschema's
CREATE POLICY "schemas_coach_all" ON training_schemas
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan eigen schema's lezen
CREATE POLICY "schemas_client_select" ON training_schemas
  FOR SELECT TO authenticated
  USING (client_id = my_client_id());

-- ============================================================
-- TRAINING EXERCISES
-- ============================================================
ALTER TABLE training_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_all_exercises"                  ON training_exercises;
DROP POLICY IF EXISTS "client_read_own_exercises"            ON training_exercises;
DROP POLICY IF EXISTS "Coach manages training exercises"     ON training_exercises;
DROP POLICY IF EXISTS "Client reads own training exercises"  ON training_exercises;

-- Coach beheert alle oefeningen
CREATE POLICY "exercises_coach_all" ON training_exercises
  FOR ALL TO authenticated
  USING (is_coach())
  WITH CHECK (is_coach());

-- Client kan oefeningen lezen van zijn eigen schema's
CREATE POLICY "exercises_client_select" ON training_exercises
  FOR SELECT TO authenticated
  USING (
    schema_id IN (
      SELECT id FROM training_schemas WHERE client_id = my_client_id()
    )
  );

-- ============================================================
-- TRAINING LOGS (indien tabel bestaat)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'training_logs'
  ) THEN
    EXECUTE 'ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "coach_read_training_logs" ON training_logs';
    EXECUTE 'DROP POLICY IF EXISTS "client_own_training_logs" ON training_logs';
    EXECUTE $p$
      CREATE POLICY "training_logs_coach_all" ON training_logs
        FOR ALL TO authenticated
        USING (is_coach())
        WITH CHECK (is_coach())
    $p$;
    EXECUTE $p$
      CREATE POLICY "training_logs_client_all" ON training_logs
        FOR ALL TO authenticated
        USING (client_id = my_client_id())
        WITH CHECK (client_id = my_client_id())
    $p$;
  END IF;
END
$$;
