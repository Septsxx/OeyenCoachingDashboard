-- =============================================
-- APPOINTMENTS SETUP
-- Veilig te herhalen: IF NOT EXISTS / DROP IF EXISTS
-- Run in Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME,
  duration_minutes INT,
  type TEXT NOT NULL DEFAULT 'coaching',
  location TEXT,
  notes TEXT,
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migratie voor bestaande tabellen
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS google_event_id TEXT;

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coach manages appointments" ON appointments;
DROP POLICY IF EXISTS "Client reads own appointments" ON appointments;

CREATE POLICY "Coach manages appointments" ON appointments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
  );

CREATE POLICY "Client reads own appointments" ON appointments
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );
