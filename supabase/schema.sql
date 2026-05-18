-- =============================================
-- OEYEN COACHING PLATFORM - DATABASE SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES (extends Supabase auth.users)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('coach', 'client')),
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'client'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- CLIENTS
-- =============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Personal info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  dob DATE,
  gender TEXT CHECK (gender IN ('man', 'vrouw', 'anders')),
  height_cm NUMERIC(5,1),
  start_weight_kg NUMERIC(5,2),

  -- Goals & motivation
  short_term_goal TEXT,
  long_term_goal TEXT,
  motivation TEXT,
  coaching_experience TEXT,

  -- Medical
  medical_conditions TEXT,
  injuries TEXT,
  medications TEXT,
  surgeon_clearance BOOLEAN DEFAULT FALSE,

  -- Lifestyle & nutrition
  current_diet TEXT,
  meal_frequency INTEGER,
  food_allergies TEXT,
  alcohol_frequency TEXT,
  sleep_hours NUMERIC(3,1),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
  activity_level TEXT CHECK (activity_level IN ('sedentair', 'licht actief', 'matig actief', 'zeer actief')),
  training_days_per_week INTEGER,
  training_experience TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  intake_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PAYMENTS
-- =============================================
CREATE TYPE package_type AS ENUM ('3_months', '6_months', '12_months');

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  package package_type NOT NULL,
  amount NUMERIC(8,2) NOT NULL,
  payment_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DAILY LOGS (filled by client, editable by coach)
-- =============================================
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  week_number INTEGER,

  -- Body
  weight_kg NUMERIC(5,2),
  weigh_in_time TIME,

  -- Nutrition
  water_liters NUMERIC(3,1),
  hunger_score INTEGER CHECK (hunger_score BETWEEN 1 AND 5),
  nutrition_adherence INTEGER CHECK (nutrition_adherence BETWEEN 1 AND 5),
  off_plan_meals TEXT,
  stools INTEGER,

  -- Activity
  steps INTEGER,
  cardio_minutes INTEGER,
  resistance_training BOOLEAN,
  training_notes TEXT,
  motivation_score INTEGER CHECK (motivation_score BETWEEN 1 AND 5),
  strength_score INTEGER CHECK (strength_score BETWEEN 1 AND 5),

  -- Sleep
  sleep_duration_minutes INTEGER,
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  sleep_notes TEXT,

  -- Meta
  filled_by TEXT CHECK (filled_by IN ('client', 'coach')),
  coach_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id, log_date)
);

-- =============================================
-- SKINFOLD MEASUREMENTS
-- =============================================
CREATE TABLE skinfold_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  measured_at DATE NOT NULL,
  age_at_measurement INTEGER,

  biceps_mm NUMERIC(4,1),
  triceps_mm NUMERIC(4,1),
  subscapular_mm NUMERIC(4,1),
  suprailiac_mm NUMERIC(4,1),

  sum_mm NUMERIC(5,1) GENERATED ALWAYS AS (
    COALESCE(biceps_mm, 0) + COALESCE(triceps_mm, 0) +
    COALESCE(subscapular_mm, 0) + COALESCE(suprailiac_mm, 0)
  ) STORED,

  bf_pct NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id, measured_at)
);

-- =============================================
-- WEEKLY CHECK-INS
-- =============================================
CREATE TABLE weekly_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  checkin_date DATE NOT NULL,

  -- Client answers
  gym_performance TEXT,
  recovery TEXT,
  training_weeks_on_split TEXT,
  weeks_since_deload TEXT,
  stress_notes TEXT,
  general_notes TEXT,

  -- Coach response
  coach_response TEXT,
  coach_responded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id, week_number)
);

-- =============================================
-- MEAL PLANS
-- =============================================
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Voedingsschema',
  is_active BOOLEAN DEFAULT TRUE,

  -- Macro targets per day type
  cals_td INTEGER, pro_td INTEGER, cho_td INTEGER, fat_td INTEGER,
  cals_rd INTEGER, pro_rd INTEGER, cho_rd INTEGER, fat_rd INTEGER,
  cals_low INTEGER, pro_low INTEGER, cho_low INTEGER, fat_low INTEGER,
  water_target TEXT DEFAULT '4L',

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meal_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_type TEXT NOT NULL CHECK (day_type IN ('TD', 'RD', 'LOW')),
  meal_number INTEGER NOT NULL,
  meal_name TEXT,
  food_item TEXT NOT NULL,
  quantity NUMERIC(7,1),
  unit TEXT DEFAULT 'g',
  calories INTEGER,
  protein_g NUMERIC(5,1),
  carbs_g NUMERIC(5,1),
  fat_g NUMERIC(5,1),
  sort_order INTEGER DEFAULT 0
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE skinfold_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;

-- Profiles: user ziet eigen profiel, coach ziet alles
CREATE POLICY "Users see own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Coach sees all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
);

-- Clients: coach ziet alle clients, client ziet zichzelf
CREATE POLICY "Coach manages all clients" ON clients FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
);
CREATE POLICY "Client sees own record" ON clients FOR SELECT USING (user_id = auth.uid());

-- Payments: alleen coach
CREATE POLICY "Coach manages payments" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
);

-- Daily logs: coach ziet alles, client ziet eigen logs
CREATE POLICY "Coach manages all logs" ON daily_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
);
CREATE POLICY "Client manages own logs" ON daily_logs FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- Skinfolds: coach manages all, client reads own
CREATE POLICY "Coach manages skinfolds" ON skinfold_measurements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
);
CREATE POLICY "Client reads own skinfolds" ON skinfold_measurements FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- Check-ins: beide
CREATE POLICY "Coach manages checkins" ON weekly_checkins FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
);
CREATE POLICY "Client manages own checkins" ON weekly_checkins FOR ALL USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- Meal plans: coach manages, client reads own
CREATE POLICY "Coach manages meal plans" ON meal_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
);
CREATE POLICY "Client reads own meal plan" ON meal_plans FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
CREATE POLICY "Coach manages meal items" ON meal_plan_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
);
CREATE POLICY "Client reads own meal items" ON meal_plan_items FOR SELECT USING (
  meal_plan_id IN (
    SELECT mp.id FROM meal_plans mp
    JOIN clients c ON c.id = mp.client_id
    WHERE c.user_id = auth.uid()
  )
);

-- =============================================
-- FOODS (central ingredient/product library)
-- =============================================
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT CHECK (category IN ('vlees', 'vis', 'zuivel', 'eieren', 'groenten', 'fruit', 'granen', 'noten_zaden', 'peulvruchten', 'olie_vet', 'sauzen', 'dranken', 'snacks', 'supplementen', 'overig')),
  calories_per_100g NUMERIC(7,2) NOT NULL DEFAULT 0,
  protein_per_100g NUMERIC(6,2) NOT NULL DEFAULT 0,
  carbs_per_100g NUMERIC(6,2) NOT NULL DEFAULT 0,
  fat_per_100g NUMERIC(6,2) NOT NULL DEFAULT 0,
  fiber_per_100g NUMERIC(6,2) DEFAULT 0,
  serving_size_g NUMERIC(6,1) DEFAULT 100,
  unit TEXT DEFAULT 'g' CHECK (unit IN ('g', 'ml')),
  off_source TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach manages foods" ON foods FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
);
CREATE POLICY "Clients read foods" ON foods FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);

-- Link meal_plan_items to foods
ALTER TABLE meal_plan_items ADD COLUMN IF NOT EXISTS food_id UUID REFERENCES foods(id) ON DELETE SET NULL;

-- =============================================
-- HELPER FUNCTION: calculate expiry date
-- =============================================
CREATE OR REPLACE FUNCTION get_expiry_date(p_date DATE, p_package package_type)
RETURNS DATE AS $$
BEGIN
  RETURN CASE p_package
    WHEN '3_months' THEN p_date + INTERVAL '3 months'
    WHEN '6_months' THEN p_date + INTERVAL '6 months'
    WHEN '12_months' THEN p_date + INTERVAL '12 months'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
