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
      <div style={{ textAlign: 'center', padding: '72px 24px' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '18px',
          background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>🏋️</span>
        </div>
        <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>Schema komt eraan</p>
        <p style={{ fontSize: '0.83rem', color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: '260px', margin: '0 auto' }}>
          Je coach is jouw trainingsschema aan het samenstellen. Zodra het klaar is verschijnt het hier.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px' }}>Trainingsschema</h1>
      <TrainingTabs schemas={schemas} clientId={clientId} initialLogs={[]} />
    </div>
  )
}
