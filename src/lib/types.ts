export type PackageType = '3_months' | '6_months' | 'online_coaching'

export const PACKAGES = {
  '3_months': { label: '3 maanden', price: 499, months: 3 },
  '6_months': { label: '6 maanden', price: 899, months: 6 },
  'online_coaching': { label: 'Online coaching', price: 349, months: 3 },
} as const

export interface Client {
  id: string
  user_id: string | null
  coach_id: string | null
  full_name: string
  email: string
  phone: string | null
  dob: string | null
  gender: string | null
  height_cm: number | null
  start_weight_kg: number | null
  short_term_goal: string | null
  long_term_goal: string | null
  motivation: string | null
  coaching_experience: string | null
  medical_conditions: string | null
  injuries: string | null
  medications: string | null
  surgeon_clearance: boolean
  current_diet: string | null
  meal_frequency: number | null
  food_allergies: string | null
  alcohol_frequency: string | null
  sleep_hours: number | null
  stress_level: number | null
  activity_level: string | null
  training_days_per_week: number | null
  training_experience: string | null
  is_active: boolean
  intake_completed: boolean
  notes: string | null
  step_goal: number | null
  prev_step_goal: number | null
  company_name: string | null
  tav: string | null
  vat_number: string | null
  billing_address: string | null
  billing_phone: string | null
  created_at: string
  updated_at: string
}

export interface Supplement {
  id: string
  client_id: string
  name: string
  dose: string | null
  timing: string | null
  notes: string | null
  sort_order: number
  created_at: string
}

export interface Payment {
  id: string
  client_id: string
  package: PackageType
  amount: number
  payment_date: string
  expiry_date: string
  notes: string | null
  created_at: string
}

export interface DailyLog {
  id: string
  client_id: string
  log_date: string
  week_number: number | null
  weight_kg: number | null
  water_liters: number | null
  rhr: number | null
  hunger_score: number | null
  nutrition_adherence: number | null
  off_plan_meals: string | null
  stool_count: string | null
  steps: number | null
  cardio_minutes: number | null
  resistance_training: boolean | null
  training_notes: string | null
  motivation_score: number | null
  strength_score: number | null
  sleep_time: string | null
  wake_time: string | null
  sleep_duration_minutes: number | null
  sleep_quality: number | null
  sleep_notes: string | null
  energy_levels: number | null
  stress_levels: number | null
  filled_by: 'client' | 'coach' | null
  coach_notes: string | null
  created_at: string
}

export interface SkinfoldMeasurement {
  id: string
  client_id: string
  measured_at: string
  age_at_measurement: number | null
  biceps_mm: number | null
  triceps_mm: number | null
  subscapular_mm: number | null
  suprailiac_mm: number | null
  sum_mm: number | null
  bf_pct: number | null
  notes: string | null
}

export interface WeeklyCheckin {
  id: string
  client_id: string
  week_number: number
  checkin_date: string
  gym_performance: string | null
  recovery: string | null
  training_weeks_on_split: string | null
  weeks_since_deload: string | null
  stress_notes: string | null
  general_notes: string | null
  coach_response: string | null
  coach_responded_at: string | null
  created_at: string
}

export interface Appointment {
  id: string
  client_id: string | null
  title: string
  appointment_date: string
  appointment_time: string | null
  duration_minutes: number | null
  type: string
  location: string | null
  notes: string | null
  google_event_id: string | null
  created_at: string
}

export type FoodCategory = 'vlees' | 'vis' | 'zuivel' | 'eieren' | 'groenten' | 'fruit' | 'granen' | 'noten_zaden' | 'peulvruchten' | 'olie_vet' | 'sauzen' | 'dranken' | 'snacks' | 'supplementen' | 'overig'

export const FOOD_CATEGORIES: Record<FoodCategory, string> = {
  vlees: 'Vlees & gevogelte',
  vis: 'Vis & zeevruchten',
  zuivel: 'Zuivel',
  eieren: 'Eieren',
  groenten: 'Groenten',
  fruit: 'Fruit',
  granen: 'Granen & brood',
  noten_zaden: 'Noten & zaden',
  peulvruchten: 'Peulvruchten',
  olie_vet: 'Olie & vetten',
  sauzen: 'Sauzen & kruiden',
  dranken: 'Dranken',
  snacks: 'Snacks',
  supplementen: 'Supplementen',
  overig: 'Overig',
}

export interface Food {
  id: string
  name: string
  brand: string | null
  category: FoodCategory | null
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g: number | null
  serving_size_g: number | null
  unit: 'g' | 'ml'
  off_source: string | null
  is_active: boolean
  created_at: string
}

export interface MealPlanItem {
  id: string
  meal_plan_id: string
  day_type: 'TD' | 'RD' | 'LOW'
  meal_number: number
  meal_name: string | null
  food_item: string
  food_id: string | null
  quantity: number | null
  unit: string
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  sort_order: number
}

export interface TrainingSchema {
  id: string
  client_id: string
  name: string
  weeks_count: number
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TrainingExercise {
  id: string
  schema_id: string
  label: string
  name: string
  sets_count: number
  reps: string
  tempo: string
  sort_order: number
  created_at: string
}

export type PhaseKey = 'dieting' | 'gaining' | 'maintenance' | 'competition' | 'peak_week'

export const DEFAULT_PHASE_LABELS: Record<PhaseKey, string> = {
  dieting: 'Dieting Phase',
  gaining: 'Gaining Phase',
  maintenance: 'Maintenance',
  competition: 'Competition Phase',
  peak_week: 'Peak Week',
}

export const PHASE_COLORS: Record<PhaseKey, { text: string; bg: string; border: string }> = {
  dieting:     { text: '#16a34a', bg: '#dcfce7', border: '#22c55e' },
  gaining:     { text: '#0284c7', bg: '#e0f2fe', border: '#38bdf8' },
  maintenance: { text: '#ea580c', bg: '#ffedd5', border: '#f97316' },
  competition: { text: '#7c3aed', bg: '#ede9fe', border: '#a855f7' },
  peak_week:   { text: '#dc2626', bg: '#fee2e2', border: '#ef4444' },
}

export interface CoachSettings {
  coach_id: string
  phase_labels: Partial<Record<PhaseKey, string>>
  created_at: string
  updated_at: string
}

export interface WeeklyTimeline {
  id: string
  client_id: string
  week_number: number
  phase: PhaseKey | null
  energy_balance: 'deficit' | 'surplus' | 'maintenance' | null
  calories_td: number | null
  calories_ntd: number | null
  cardio_target: string | null
  steps_target: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BodyMeasurement {
  id: string
  client_id: string
  measured_date: string
  weight_kg: number | null
  waist_cm: number | null
  hips_cm: number | null
  chest_cm: number | null
  arm_cm: number | null
  thigh_cm: number | null
  notes: string | null
  created_at: string
}

export interface MealPlan {
  id: string
  client_id: string
  name: string
  is_active: boolean
  cals_td: number | null
  pro_td: number | null
  cho_td: number | null
  fat_td: number | null
  cals_rd: number | null
  pro_rd: number | null
  cho_rd: number | null
  fat_rd: number | null
  cals_low: number | null
  pro_low: number | null
  cho_low: number | null
  fat_low: number | null
  water_target: string | null
  notes: string | null
}
