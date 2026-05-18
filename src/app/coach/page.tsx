import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInDays, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Users, AlertTriangle, CheckCircle, Clock, Calendar } from 'lucide-react'
import type { Client, Payment, Appointment } from '@/lib/types'
import { getPaymentStatus } from '@/lib/payment-utils'
import { formatDate } from '@/lib/ui'

function PaymentBadge({ payment }: { payment: Payment | null }) {
  const { label, color, bg } = getPaymentStatus(payment)
  return (
    <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: '99px', background: bg, color }}>
      {label}
    </span>
  )
}

function lastLogInfo(dateStr: string | undefined): { text: string; color: string } {
  if (!dateStr) return { text: 'Nooit ingevuld', color: 'var(--text-faint)' }
  const days = differenceInDays(new Date(), parseISO(dateStr))
  if (days === 0) return { text: 'Vandaag ingevuld', color: '#22C55E' }
  if (days === 1) return { text: 'Gisteren ingevuld', color: '#86EFAC' }
  if (days <= 3) return { text: `${days} dagen geleden`, color: '#F97316' }
  if (days <= 7) return { text: `${days} dagen geleden`, color: '#EF4444' }
  return { text: `${days} dagen geleden`, color: '#EF4444' }
}

export default async function CoachDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'coach') redirect('/client')

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false }) as { data: Client[] | null }

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .order('payment_date', { ascending: false }) as { data: Payment[] | null }

  const latestPayment = new Map<string, Payment>()
  payments?.forEach(p => {
    if (!latestPayment.has(p.client_id)) latestPayment.set(p.client_id, p)
  })

  const allClients = clients ?? []
  const activeClients = allClients.filter(c => c.is_active)
  const expiringSoon = activeClients.filter(c => {
    const p = latestPayment.get(c.id)
    if (!p) return false
    const days = differenceInDays(parseISO(p.expiry_date), new Date())
    return days >= 0 && days <= 14
  })
  const expired = activeClients.filter(c => {
    const p = latestPayment.get(c.id)
    if (!p) return true
    return differenceInDays(parseISO(p.expiry_date), new Date()) < 0
  })

  const [{ data: recentCheckins }, { data: recentLogs }, { data: allLogDates }] = await Promise.all([
    supabase
      .from('weekly_checkins')
      .select('*, clients(full_name)')
      .is('coach_response', null)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('daily_logs')
      .select('*, clients(full_name)')
      .order('log_date', { ascending: false })
      .limit(8),
    supabase
      .from('daily_logs')
      .select('client_id, log_date')
      .order('log_date', { ascending: false })
      .limit(500),
  ])

  // Latest log date per client (first occurrence = most recent)
  const lastLogDate = new Map<string, string>()
  allLogDates?.forEach(l => {
    if (!lastLogDate.has(l.client_id)) lastLogDate.set(l.client_id, l.log_date)
  })

  const today = new Date().toISOString().slice(0, 10)
  const { data: upcomingAppointments } = await supabase
    .from('appointments')
    .select('*, clients(full_name)')
    .gte('appointment_date', today)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .limit(6) as { data: (Appointment & { clients: { full_name: string } | null })[] | null }

  return (
    <div style={{ padding: '32px' }}>
      <style>{`.client-link:hover { background: var(--surface-2) !important; }`}</style>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          {format(new Date(), "EEEE d MMMM yyyy", { locale: nl })}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { icon: Users, label: 'Actieve klanten', value: activeClients.length, color: 'var(--text)' },
          { icon: CheckCircle, label: 'Betalingen OK', value: activeClients.length - expiringSoon.length - expired.length, color: '#22C55E' },
          { icon: Clock, label: 'Verloopt binnenkort', value: expiringSoon.length, color: '#F97316' },
          { icon: AlertTriangle, label: 'Vervallen', value: expired.length, color: '#EF4444' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{label}</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
              </div>
              <Icon size={20} color={color} style={{ opacity: 0.6 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* All Clients */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Klanten</h2>
            <Link href="/coach/clients/new" style={{ fontSize: '0.78rem', background: '#004aad', color: '#ffffff', padding: '6px 14px', borderRadius: '6px', textDecoration: 'none', fontWeight: 500 }}>
              + Nieuwe klant
            </Link>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {allClients.length === 0 ? (
              <p style={{ padding: '24px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>Nog geen klanten</p>
            ) : (
              allClients.map(client => {
                const log = lastLogInfo(lastLogDate.get(client.id))
                return (
                  <Link key={client.id} href={`/coach/clients/${client.id}`} className="client-link" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--surface-2)',
                    textDecoration: 'none',
                    transition: 'background 0.1s',
                  }}>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)' }}>{client.full_name}</p>
                      <p style={{ fontSize: '0.72rem', marginTop: '2px', color: log.color }}>{log.text}</p>
                    </div>
                    <PaymentBadge payment={latestPayment.get(client.id) ?? null} />
                  </Link>
                )
              })
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Unanswered check-ins */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--surface-2)' }}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Check-ins zonder respons</h2>
            </div>
            <div>
              {!recentCheckins?.length ? (
                <p style={{ padding: '16px 20px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>Alles beantwoord!</p>
              ) : (
                recentCheckins.map((c: any) => (
                  <Link key={c.id} href={`/coach/clients/${c.client_id}?tab=checkin`} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 20px',
                    borderBottom: '1px solid var(--surface-2)',
                    textDecoration: 'none',
                  }}>
                    <div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{c.clients?.full_name}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>Week {c.week_number}</p>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#F97316' }}>Beantwoorden →</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent logs */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--surface-2)' }}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Recente invoer</h2>
            </div>
            <div>
              {!recentLogs?.length ? (
                <p style={{ padding: '16px 20px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>Nog geen data</p>
              ) : (
                recentLogs.map((log: any) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid var(--surface-2)' }}>
                    <div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{log.clients?.full_name}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{formatDate(log.log_date)}</p>
                    </div>
                    {log.weight_kg && <span style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{log.weight_kg} kg</span>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming appointments */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={15} style={{ opacity: 0.6 }} /> Aankomende afspraken
              </h2>
              <Link href="/coach/agenda" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textDecoration: 'none' }}>Alle →</Link>
            </div>
            <div>
              {!upcomingAppointments?.length ? (
                <p style={{ padding: '16px 20px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>Geen afspraken gepland</p>
              ) : (
                upcomingAppointments.map((a: any) => {
                  const isToday = a.appointment_date === today
                  return (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid var(--surface-2)' }}>
                      <div>
                        <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text)' }}>{a.title}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '1px' }}>
                          {a.clients?.full_name ? `${a.clients.full_name} · ` : ''}{formatDate(a.appointment_date)}{a.appointment_time ? ` · ${a.appointment_time.slice(0, 5)}` : ''}
                        </p>
                      </div>
                      {isToday && (
                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '99px', background: 'rgba(0,74,173,0.12)', color: '#004aad', fontWeight: 600 }}>
                          Vandaag
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
