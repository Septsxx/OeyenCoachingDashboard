-- Push notification subscriptions & preferences
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  daily_enabled BOOLEAN DEFAULT FALSE,
  daily_hour INTEGER DEFAULT 20 CHECK (daily_hour BETWEEN 0 AND 23),
  weekly_enabled BOOLEAN DEFAULT FALSE,
  weekly_day INTEGER DEFAULT 0 CHECK (weekly_day BETWEEN 0 AND 6), -- 0=Sunday
  weekly_hour INTEGER DEFAULT 10 CHECK (weekly_hour BETWEEN 0 AND 23),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscription"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id);
