-- =============================================
-- RLS FIX for training_schemas & training_exercises
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop all old policies
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

-- training_schemas: zelfde patroon als meal_plans
CREATE POLICY "Coach manages training schemas" ON training_schemas FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
);

-- training_exercises: zelfde patroon als meal_plan_items
CREATE POLICY "Coach manages training exercises" ON training_exercises FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach')
);
