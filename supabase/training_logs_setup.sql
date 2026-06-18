-- =============================================
-- TRAINING LOGS SETUP
-- Veilig te herhalen: IF NOT EXISTS / DROP IF EXISTS
-- Run in Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS training_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES training_exercises(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  set_number INT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exercise_id, client_id, week_number, set_number)
);

ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coach manages training logs" ON training_logs;
DROP POLICY IF EXISTS "Client manages own training logs" ON training_logs;

CREATE POLICY "Coach manages training logs" ON training_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
  );

CREATE POLICY "Client manages own training logs" ON training_logs
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );
