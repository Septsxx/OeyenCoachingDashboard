-- =============================================
-- TRAINING SCHEMA SETUP — volledig script
-- Veilig te herhalen: gebruik IF NOT EXISTS / DROP IF EXISTS
-- Run dit in Supabase SQL Editor
-- =============================================

-- 1. Tabellen aanmaken (wordt overgeslagen als ze al bestaan)
CREATE TABLE IF NOT EXISTS training_schemas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Schema A',
  weeks_count INT NOT NULL DEFAULT 6,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schema_id UUID NOT NULL REFERENCES training_schemas(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  sets_count INT NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '8-12',
  tempo TEXT NOT NULL DEFAULT '3-0-1-0',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS activeren
ALTER TABLE training_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_exercises ENABLE ROW LEVEL SECURITY;

-- 3. Alle oude policies verwijderen
DROP POLICY IF EXISTS "coach_all_training_schemas" ON training_schemas;
DROP POLICY IF EXISTS "coach_all_training_exercises" ON training_exercises;
DROP POLICY IF EXISTS "coach_select_training_schemas" ON training_schemas;
DROP POLICY IF EXISTS "coach_insert_training_schemas" ON training_schemas;
DROP POLICY IF EXISTS "coach_update_training_schemas" ON training_schemas;
DROP POLICY IF EXISTS "coach_delete_training_schemas" ON training_schemas;
DROP POLICY IF EXISTS "coach_select_training_exercises" ON training_exercises;
DROP POLICY IF EXISTS "coach_insert_training_exercises" ON training_exercises;
DROP POLICY IF EXISTS "coach_update_training_exercises" ON training_exercises;
DROP POLICY IF EXISTS "coach_delete_training_exercises" ON training_exercises;
DROP POLICY IF EXISTS "Coach manages training schemas" ON training_schemas;
DROP POLICY IF EXISTS "Coach manages training exercises" ON training_exercises;
DROP POLICY IF EXISTS "Client reads own training schemas" ON training_schemas;
DROP POLICY IF EXISTS "Client reads own training exercises" ON training_exercises;

-- 4. Coach policies (zelfde patroon als meal_plans)
CREATE POLICY "Coach manages training schemas" ON training_schemas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
  );

CREATE POLICY "Coach manages training exercises" ON training_exercises
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
  );

-- 5. Client leestoegang
CREATE POLICY "Client reads own training schemas" ON training_schemas
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Client reads own training exercises" ON training_exercises
  FOR SELECT USING (
    schema_id IN (
      SELECT ts.id FROM training_schemas ts
      JOIN clients c ON c.id = ts.client_id
      WHERE c.user_id = auth.uid()
    )
  );
