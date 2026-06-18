import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { DailyLog, WeeklyCheckin } from '@/lib/types'
import ClientCharts from './ClientCharts'
import ActiesCard from './ActiesCard'
import { ClipboardList, MessageSquare, Dumbbell, Utensils, Ruler, Flame, CalendarDays } from 'lucide-react'

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

  // Streak: consecutive days with a log
  const logDateSet = new Set(logs.map(l => l.log_date))
  let streak = 0
  const now = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const str = d.toISOString().slice(0, 10)
    if (logDateSet.has(str)) streak++
    else break
  }

  const firstName = clientRow.full_name.split(' ')[0]
  const dateLabel = new Date().toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })

  const STREAK_MILESTONES: Record<number, { title: string; message: string; color: string; bg: string; border: string }> = {
    7: {
      title: '1 week op rij! 🔥',
      message: 'Na 7 dagen herhaling begint je brein al nieuwe neurale verbindingen te vormen. Consistentie in de eerste week is de sterkste voorspeller van een duurzame gewoonte.',
      color: '#F97316',
      bg: 'rgba(249,115,22,0.08)',
      border: 'rgba(249,115,22,0.3)',
    },
    14: {
      title: '2 weken op rij! ⚡',
      message: 'Je dopaminesysteem begint de dagelijkse routine te anticiperen vóór je hem uitvoert — een teken dat de gewoonte wortel schiet in je brein.',
      color: '#8B5CF6',
      bg: 'rgba(139,92,246,0.08)',
      border: 'rgba(139,92,246,0.3)',
    },
    30: {
      title: '30 dagen op rij! 🏆',
      message: 'Onderzoek van Lally et al. (UCL, 2010) toont aan dat gewoonten gemiddeld 66 dagen nodig hebben om automatisch te worden. Jij bent halverwege — dit is echte progressie.',
      color: '#22C55E',
      bg: 'rgba(34,197,94,0.08)',
      border: 'rgba(34,197,94,0.3)',
    },
  }

  const milestone = STREAK_MILESTONES[streak] ?? null

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', fontWeight: 500, marginBottom: '6px', textTransform: 'capitalize', letterSpacing: '0.3px' }}>
          {dateLabel}
        </p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: '12px' }}>
          Hallo, {firstName} 👋
        </h1>
        {streak > 1 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
            borderRadius: '20px', padding: '5px 12px',
          }}>
            <Flame size={13} color="#F97316" />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#F97316' }}>
              {streak} dagen op rij
            </span>
          </div>
        )}
        {milestone && (
          <div style={{
            marginTop: '16px',
            background: milestone.bg,
            border: `1px solid ${milestone.border}`,
            borderRadius: '14px',
            padding: '16px 18px',
          }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: milestone.color, marginBottom: '6px' }}>
              {milestone.title}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {milestone.message}
            </p>
          </div>
        )}
      </div>

      <ActiesCard clientId={clientRow.id} />

      {/* Quick action cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <Link href="/client/log" style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '14px', padding: '18px', textDecoration: 'none', display: 'block', color: 'var(--text)',
        }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px',
            background: 'rgba(0,74,173,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '12px',
          }}>
            <ClipboardList size={16} color="#004aad" />
          </div>
          <p style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)', marginBottom: '4px' }}>Dagelijkse log</p>
          <p style={{ fontSize: '0.95rem', fontWeight: 700 }}>Invullen →</p>
        </Link>

        <Link href="/client/checkin" style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '14px', padding: '18px', textDecoration: 'none', color: 'var(--text)', display: 'block',
        }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px',
            background: 'rgba(34,197,94,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '12px',
          }}>
            <MessageSquare size={16} color="#22C55E" />
          </div>
          <p style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)', marginBottom: '4px' }}>Wekelijkse check-in</p>
          <p style={{ fontSize: '0.95rem', fontWeight: 700 }}>Invullen →</p>
          {checkins[0] && <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>Laatste: week {checkins[0].week_number}</p>}
        </Link>
      </div>

      {/* Quick reference row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '28px' }}>
        {([
          { href: '/client/training', label: 'Training', Icon: Dumbbell, color: '#F97316' },
          { href: '/client/maaltijdplan', label: 'Voeding', Icon: Utensils, color: '#22C55E' },
          { href: '/client/metingen', label: 'Metingen', Icon: Ruler, color: '#8B5CF6' },
        ] as const).map(({ href, label, Icon, color }) => (
          <Link key={href} href={href} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '14px 8px', textDecoration: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', color: 'var(--text)',
          }}>
            <Icon size={20} color={color} strokeWidth={1.8} />
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-dim)' }}>{label}</span>
          </Link>
        ))}
      </div>

      {/* Volgende afspraak */}
      {nextAppointment && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 20px', marginBottom: '28px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CalendarDays size={16} color="#8B5CF6" />
          </div>
          <div>
            <p style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)', marginBottom: '5px' }}>Volgende afspraak</p>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '3px' }}>{nextAppointment.title}</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              {new Date(nextAppointment.appointment_date).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
              {nextAppointment.appointment_time && ` · ${nextAppointment.appointment_time.slice(0, 5)}`}
              {nextAppointment.duration_minutes && ` · ${nextAppointment.duration_minutes} min`}
            </p>
            {nextAppointment.location && <p style={{ fontSize: '0.78rem', color: 'var(--text-faint)', marginTop: '3px' }}>{nextAppointment.location}</p>}
          </div>
        </div>
      )}

      {/* Progress charts */}
      {chartLogs.length > 1 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', marginBottom: '28px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)' }}>Voortgang</p>
          </div>
          <div style={{ padding: '20px' }}>
            <ClientCharts logs={chartLogs} />
          </div>
        </div>
      )}

      {/* Coach responses */}
      {checkins.filter(c => c.coach_response).length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)' }}>Coach feedback</p>
          </div>
          {checkins.filter(c => c.coach_response).slice(0, 3).map(c => (
            <div key={c.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-2)' }}>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Week {c.week_number}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{c.coach_response}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
