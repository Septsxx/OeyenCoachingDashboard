import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { BodyMeasurement } from '@/lib/types'
import MetingenClient from './MetingenClient'

export const dynamic = 'force-dynamic'

export default async function MetingenPage() {
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

  const [
    { data: measurements },
    { data: dailyLogs },
    { data: skinfolds },
  ] = await Promise.all([
    supabase.from('body_measurements').select('*').eq('client_id', clientId)
      .order('measured_date', { ascending: false }).limit(52),
    supabase.from('daily_logs').select('log_date, weight_kg, steps').eq('client_id', clientId)
      .order('log_date', { ascending: true }).limit(180),
    supabase.from('skinfold_measurements').select('measured_at, bf_pct').eq('client_id', clientId)
      .order('measured_at', { ascending: true }).limit(52),
  ]) as [
    { data: BodyMeasurement[] | null },
    { data: { log_date: string; weight_kg: number | null; steps: number | null }[] | null },
    { data: { measured_at: string; bf_pct: number | null }[] | null },
  ]

  return (
    <div>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px' }}>Metingen</h1>
      <MetingenClient
        clientId={clientId}
        initialMeasurements={measurements ?? []}
        dailyLogs={dailyLogs ?? []}
        skinfolds={skinfolds ?? []}
      />
    </div>
  )
}
