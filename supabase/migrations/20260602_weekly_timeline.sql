CREATE TABLE weekly_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL,
  phase TEXT CHECK (phase IN ('dieting', 'gaining', 'maintenance')),
  energy_balance TEXT CHECK (energy_balance IN ('deficit', 'surplus', 'maintenance')),
  calories_td INTEGER,
  calories_ntd INTEGER,
  cardio_target TEXT,
  steps_target INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, week_number)
);

ALTER TABLE weekly_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach can manage timeline"
  ON weekly_timeline FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid()));
