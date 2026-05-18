import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { DailyLog, WeeklyCheckin } from '@/lib/types'
import ClientCharts from './ClientCharts'
import ActiesCard from './ActiesCard'

export const dynamic = 'force-dynamic'

export default async function ClientDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let clientRow: { id: string; full_name: string } | null = null

  const { data: byUserId } = await supabase
    .from('clients')
    .select('id, full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (byUserId) {
    clientRow = byUserId
  } else if (user.email) {
    const { data: byEmail } = await supabase
      .from('clients')
      .select('id, full_name, user_id')
      .eq('email', user.email)
      .maybeSingle()

    if (byEmail) {
      await supabase.from('clients').update({ user_id: user.id }).eq('id', byEmail.id)
      clientRow = byEmail
    }
  }

  if (!clientRow) { await supabase.auth.signOut(); redirect('/login?error=no_profile') }

  const today = new Date().toISOString().slice(0, 10)

  const [{ data: recentLogs }, { data: recentCheckins }, { data: nextAppointmentRaw }] = await Promise.all([
    supabase.from('daily_logs').select('*').eq('client_id', clientRow.id).order('log_date', { ascending: false }).limit(30),
    supabase.from('weekly_checkins').select('*').eq('client_id', clientRow.id).order('week_number', { ascending: false }).limit(5),
    supabase.from('appointments').select('*').eq('client_id', clientRow.id).gte('appointment_date', today).order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true }).limit(1),
  ]) as [{ data: DailyLog[] | null }, { data: WeeklyCheckin[] | null }, { data: any[] | null }]

  const logs = recentLogs ?? []
  const checkins = recentCheckins ?? []
  const nextAppointment = nextAppointmentRaw?.[0] ?? null

  const chartLogs = logs.slice(0, 14).reverse()

  return (
    <div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>Hallo, {clientRow.full_name.split(' ')[0]}</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '20px' }}>{new Date().toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>

      <ActiesCard clientId={clientRow.id} />

      {/* Action cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
        <Link href="/client/log" style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '20px', textDecoration: 'none', display: 'block', color: 'var(--text)',
        }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)', marginBottom: '8px' }}>Dagelijkse log</p>
          <p style={{ fontSize: '1rem', fontWeight: 700 }}>Invullen →</p>
        </Link>
        <Link href="/client/checkin" style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '20px', textDecoration: 'none', color: 'var(--text)', display: 'block',
        }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)', marginBottom: '8px' }}>Wekelijkse check-in</p>
          <p style={{ fontSize: '1rem', fontWeight: 700 }}>Invullen →</p>
          {checkins[0] && <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>Laatste: week {checkins[0].week_number}</p>}
        </Link>
      </div>

      {/* Volgende afspraak */}
      {nextAppointment && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', marginBottom: '28px' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)', marginBottom: '10px' }}>Volgende afspraak</p>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>{nextAppointment.title}</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            {new Date(nextAppointment.appointment_date).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
            {nextAppointment.appointment_time && ` · ${nextAppointment.appointment_time.slice(0, 5)}`}
            {nextAppointment.duration_minutes && ` · ${nextAppointment.duration_minutes} min`}
          </p>
          {nextAppointment.location && <p style={{ fontSize: '0.78rem', color: 'var(--text-faint)', marginTop: '4px' }}>{nextAppointment.location}</p>}
        </div>
      )}

      {/* Progress charts */}
      {chartLogs.length > 1 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '28px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Voortgang</p>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <ClientCharts logs={chartLogs} />
          </div>
        </div>
      )}

      {/* Coach responses */}
      {checkins.filter(c => c.coach_response).length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Coach feedback</p>
          </div>
          {checkins.filter(c => c.coach_response).slice(0, 3).map(c => (
            <div key={c.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-2)' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '6px' }}>Week {c.week_number}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{c.coach_response}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
