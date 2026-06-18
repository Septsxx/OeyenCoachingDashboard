import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ClientDetailTabs from './ClientDetailTabs'
import type { Client, Payment, DailyLog, SkinfoldMeasurement, WeeklyCheckin, MealPlan, TrainingSchema, TrainingExercise, WeeklyTimeline, CoachSettings, Supplement } from '@/lib/types'
import DeleteClientButton from './DeleteClientButton'

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: client },
    { data: payments },
    { data: logs },
    { data: skinfolds },
    { data: checkins },
    { data: mealPlan },
    { data: rawSchemas },
    { data: timeline },
    { data: coachSettings },
    { data: supplements },
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single() as unknown as Promise<{ data: Client | null }>,
    supabase.from('payments').select('*').eq('client_id', id).order('payment_date', { ascending: false }) as unknown as Promise<{ data: Payment[] | null }>,
    supabase.from('daily_logs').select('*').eq('client_id', id).order('log_date', { ascending: false }).limit(200) as unknown as Promise<{ data: DailyLog[] | null }>,
    supabase.from('skinfold_measurements').select('*').eq('client_id', id).order('measured_at') as unknown as Promise<{ data: SkinfoldMeasurement[] | null }>,
    supabase.from('weekly_checkins').select('*').eq('client_id', id).order('week_number', { ascending: false }) as unknown as Promise<{ data: WeeklyCheckin[] | null }>,
    supabase.from('meal_plans').select('*').eq('client_id', id).eq('is_active', true).single() as unknown as Promise<{ data: MealPlan | null }>,
    supabase.from('training_schemas').select('*, training_exercises(*)').eq('client_id', id).order('created_at') as unknown as Promise<{ data: (TrainingSchema & { training_exercises: TrainingExercise[] })[] | null }>,
    supabase.from('weekly_timeline').select('*').eq('client_id', id).order('week_number') as unknown as Promise<{ data: WeeklyTimeline[] | null }>,
    supabase.from('coach_settings').select('*').eq('coach_id', user.id).single() as unknown as Promise<{ data: CoachSettings | null }>,
    supabase.from('supplements').select('*').eq('client_id', id).order('sort_order') as unknown as Promise<{ data: Supplement[] | null }>,
  ])

  const trainingSchemas = (rawSchemas ?? []).map(({ training_exercises, ...s }) => ({
    ...s,
    exercises: [...(training_exercises ?? [])].sort((a: TrainingExercise, b: TrainingExercise) => a.sort_order - b.sort_order),
  }))

  if (!client) notFound()

  return (
    <div style={{ padding: '32px' }}>
      <Link href="/coach/clients" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.82rem', marginBottom: '24px' }}>
        <ArrowLeft size={14} /> Alle klanten
      </Link>

      {/* Client header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>{client.full_name}</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{client.email} {client.phone ? `· ${client.phone}` : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {client.height_cm && <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{client.height_cm} cm</span>}
          {client.start_weight_kg && <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Start: {client.start_weight_kg} kg</span>}
          <DeleteClientButton clientId={client.id} clientName={client.full_name} />
        </div>
      </div>

      <ClientDetailTabs
        client={client}
        payments={payments ?? []}
        logs={logs ?? []}
        skinfolds={skinfolds ?? []}
        checkins={checkins ?? []}
        mealPlan={mealPlan}
        trainingSchemas={trainingSchemas}
        timeline={timeline ?? []}
        phaseLabels={coachSettings?.phase_labels ?? {}}
        initialTab={tab ?? 'overview'}
        supplements={supplements ?? []}
      />
    </div>
  )
}
