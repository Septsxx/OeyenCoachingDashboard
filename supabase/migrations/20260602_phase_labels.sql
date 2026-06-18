-- Extend phase options in weekly_timeline
ALTER TABLE weekly_timeline DROP CONSTRAINT IF EXISTS weekly_timeline_phase_check;
ALTER TABLE weekly_timeline ADD CONSTRAINT weekly_timeline_phase_check
  CHECK (phase IN ('dieting', 'gaining', 'maintenance', 'competition', 'peak_week'));

-- Coach settings table for customizable labels
CREATE TABLE IF NOT EXISTS coach_settings (
  coach_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phase_labels JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coach_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach manages own settings"
  ON coach_settings FOR ALL
  USING (coach_id = auth.uid());
