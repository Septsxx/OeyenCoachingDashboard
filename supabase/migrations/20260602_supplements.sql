CREATE TABLE supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dose TEXT,
  timing TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach can manage supplements" ON supplements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients c WHERE c.id = supplements.client_id AND c.coach_id = auth.uid()
    )
  );

CREATE POLICY "Client reads own supplements" ON supplements
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );
