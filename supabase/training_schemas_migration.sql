-- =============================================
-- TRAINING SCHEMAS MIGRATION
-- Run this in Supabase SQL Editor
-- =============================================

CREATE TABLE training_schemas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Schema A',
  weeks_count INT NOT NULL DEFAULT 6,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_exercises (
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

-- Row Level Security
ALTER TABLE training_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_all_training_schemas" ON training_schemas
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid())
  );

CREATE POLICY "coach_all_training_exercises" ON training_exercises
  FOR ALL USING (
    schema_id IN (
      SELECT ts.id FROM training_schemas ts
      JOIN clients c ON c.id = ts.client_id
      WHERE c.coach_id = auth.uid()
    )
  );
