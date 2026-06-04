import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Client, Payment } from '@/lib/types'
import { getPaymentStatus, packageShortLabel } from '@/lib/payment-utils'

function ComplianceBadge({ count }: { count: number }) {
  const color = count >= 6 ? '#22C55E' : count >= 4 ? '#F59E0B' : count >= 2 ? '#F97316' : '#EF4444'
  const bg = count >= 6 ? 'rgba(34,197,94,0.1)' : count >= 4 ? 'rgba(245,158,11,0.1)' : count >= 2 ? 'rgba(249,115,22,0.1)' : 'rgba(239,68,68,0.1)'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem', padding: '3px 10px', borderRadius: '99px', background: bg, color, fontWeight: 600, width: 'fit-content' }}>
      {count}/7 d
    </span>
  )
}

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10)

  const [
    { data: clients },
    { data: payments },
    { data: recentLogsRaw },
    { data: lastCheckinRaw },
  ] = await Promise.all([
    supabase.from('clients').select('*').order('full_name') as unknown as Promise<{ data: Client[] | null }>,
    supabase.from('payments').select('*').order('payment_date', { ascending: false }) as unknown as Promise<{ data: Payment[] | null }>,
    supabase.from('daily_logs').select('client_id, log_date').gte('log_date', sevenDaysAgoStr).lte('log_date', todayStr),
    supabase.from('weekly_checkins').select('client_id, week_number').order('week_number', { ascending: false }).limit(200),
  ])

  const latestPayment = new Map<string, Payment>()
  payments?.forEach(p => { if (!latestPayment.has(p.client_id)) latestPayment.set(p.client_id, p) })

  const logDays = new Map<string, Set<string>>()
  recentLogsRaw?.forEach(l => {
    if (!logDays.has(l.client_id)) logDays.set(l.client_id, new Set())
    logDays.get(l.client_id)!.add(l.log_date)
  })
  const logCount = new Map<string, number>()
  logDays.forEach((days, clientId) => logCount.set(clientId, Math.min(days.size, 7)))

  const lastCheckin = new Map<string, number>()
  lastCheckinRaw?.forEach(c => { if (!lastCheckin.has(c.client_id)) lastCheckin.set(c.client_id, c.week_number) })

  const allClients = clients ?? []

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 32px)' }}>
      <style>{`
        .clients-header { display: none; }
        .client-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--surface-2);
          text-decoration: none;
          color: inherit;
          transition: background 0.1s;
        }
        .client-row:hover { background: var(--surface-2); }
        .client-cell-name { flex: 1; min-width: 0; }
        .client-cell-name-title { font-size: 0.875rem; font-weight: 500; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .client-cell-name-sub { font-size: 0.72rem; color: var(--text-dim); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .client-cell-intake { font-size: 0.7rem; color: var(--text-faint); margin-top: 1px; }
        .client-col-email { display: none; }
        .client-col-package { display: none; }
        .client-col-action { display: none; }
        .client-mobile-sub { display: block; }
        @media (min-width: 768px) {
          .clients-header { display: grid; grid-template-columns: 1fr 1fr 110px 140px 100px 90px; }
          .client-row { display: grid; grid-template-columns: 1fr 1fr 110px 140px 100px 90px; align-items: center; padding: 14px 20px; }
          .client-col-email { display: block; }
          .client-col-package { display: block; }
          .client-col-action { display: inline-flex; align-items: center; }
          .client-mobile-sub { display: none; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Klanten</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{allClients.length} klant{allClients.length !== 1 ? 'en' : ''}</p>
        </div>
        <Link href="/coach/clients/new" style={{
          background: '#004aad', color: '#ffffff', padding: '10px 16px', borderRadius: '8px',
          textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          + Nieuwe klant
        </Link>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div className="clients-header" style={{
          padding: '12px 20px', borderBottom: '1px solid var(--surface-2)',
          fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px',
        }}>
          <span>Naam</span><span>E-mail</span><span>Pakket</span><span>Betaling</span><span>Logs 7d</span><span></span>
        </div>

        {allClients.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-faint)' }}>
            <p style={{ fontSize: '0.9rem' }}>Nog geen klanten</p>
            <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>
              Voeg een klant toe of stuur de <Link href="/intake" style={{ color: 'var(--text)' }}>intake link</Link> door.
            </p>
          </div>
        ) : (
          allClients.map(client => {
            const p = latestPayment.get(client.id) ?? null
            const status = getPaymentStatus(p)
            const logs7d = logCount.get(client.id) ?? 0
            const wk = lastCheckin.get(client.id)
            return (
              <Link key={client.id} href={`/coach/clients/${client.id}`} className="client-row">
                <div className="client-cell-name">
                  <p className="client-cell-name-title">{client.full_name}</p>
                  {!client.intake_completed && <p className="client-cell-intake">Intake niet afgerond</p>}
                  <p className="client-cell-name-sub client-mobile-sub">
                    {client.email}{p?.package ? ` · ${packageShortLabel(p.package)}` : ''}
                  </p>
                </div>
                <span className="client-col-email" style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{client.email}</span>
                <span className="client-col-package" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{packageShortLabel(p?.package)}</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem',
                  padding: '3px 10px', borderRadius: '99px',
                  background: status.bg, color: status.color, width: 'fit-content', whiteSpace: 'nowrap',
                }}>
                  {status.label}
                </span>
                <div>
                  <ComplianceBadge count={logs7d} />
                  {wk != null && (
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', marginTop: '3px' }}>Check-in wk {wk}</p>
                  )}
                </div>
                <span className="client-col-action" style={{
                  fontSize: '0.75rem', color: 'var(--text)', background: 'var(--surface-2)',
                  padding: '5px 10px', borderRadius: '6px', whiteSpace: 'nowrap',
                }}>
                  Bekijken
                </span>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
