-- =============================================
-- BODY MEASUREMENTS SETUP
-- Veilig te herhalen: IF NOT EXISTS / DROP IF EXISTS
-- Run in Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  measured_date DATE NOT NULL,
  weight_kg NUMERIC(5,2),
  waist_cm NUMERIC(5,1),
  hips_cm NUMERIC(5,1),
  chest_cm NUMERIC(5,1),
  arm_cm NUMERIC(5,1),
  thigh_cm NUMERIC(5,1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, measured_date)
);

ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coach manages body measurements" ON body_measurements;
DROP POLICY IF EXISTS "Client manages own body measurements" ON body_measurements;

CREATE POLICY "Coach manages body measurements" ON body_measurements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
  );

CREATE POLICY "Client manages own body measurements" ON body_measurements
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );
