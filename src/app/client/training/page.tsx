import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { TrainingSchema, TrainingExercise } from '@/lib/types'
import TrainingTabs from './TrainingTabs'

export const dynamic = 'force-dynamic'

export default async function ClientTrainingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let clientId: string | null = null

  const { data: byUserId } = await supabase
    .from('clients').select('id').eq('user_id', user.id).maybeSingle()
  if (byUserId) {
    clientId = byUserId.id
  } else if (user.email) {
    const { data: byEmail } = await supabase
      .from('clients').select('id').eq('email', user.email).maybeSingle()
    if (byEmail) clientId = byEmail.id
  }

  if (!clientId) { await supabase.auth.signOut(); redirect('/login?error=no_profile') }

  const { data: rawSchemas } = await supabase
    .from('training_schemas')
    .select('*, training_exercises(*)')
    .eq('client_id', clientId)
    .order('created_at') as { data: (TrainingSchema & { training_exercises: TrainingExercise[] })[] | null }

  const schemas = (rawSchemas ?? []).map(({ training_exercises, ...s }) => ({
    ...s,
    exercises: [...(training_exercises ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }))

  if (schemas.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 16px', color: 'var(--text-faint)' }}>
        <p style={{ fontSize: '1.5rem', marginBottom: '12px' }}>🏋️</p>
        <p style={{ fontWeight: 600, marginBottom: '6px' }}>Nog geen trainingsschema</p>
        <p style={{ fontSize: '0.82rem' }}>Je coach maakt binnenkort een schema voor jou aan.</p>
      </div>
    )
  }

  const exerciseIds = schemas.flatMap(s => s.exercises.map(e => e.id))
  const { data: logsRaw } = exerciseIds.length > 0
    ? await supabase
        .from('training_logs')
        .select('exercise_id, week_number, set_number, value')
        .eq('client_id', clientId)
        .in('exercise_id', exerciseIds)
    : { data: [] }

  const initialLogs = (logsRaw ?? []).map(l => ({
    exercise_id: l.exercise_id as string,
    week_number: l.week_number as number,
    set_number: l.set_number as number,
    value: (l.value ?? '') as string,
  }))

  return (
    <div>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px' }}>Trainingsschema</h1>
      <TrainingTabs schemas={schemas} clientId={clientId} initialLogs={initialLogs} />
    </div>
  )
}
