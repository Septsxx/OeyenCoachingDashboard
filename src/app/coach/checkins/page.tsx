import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { WeeklyCheckin } from '@/lib/types'
import { formatDate } from '@/lib/ui'

export const dynamic = 'force-dynamic'

type CheckinWithClient = WeeklyCheckin & { clients: { full_name: string } | null }

export default async function CheckinsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: checkins } = await supabase
    .from('weekly_checkins')
    .select('*, clients(full_name)')
    .order('created_at', { ascending: false })
    .limit(100) as { data: CheckinWithClient[] | null }

  const all = checkins ?? []
  const unanswered = all.filter(c => !c.coach_response)
  const answered = all.filter(c => c.coach_response)

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Check-ins</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{unanswered.length} onbeantwoord · {answered.length} beantwoord</p>
      </div>

      {unanswered.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#F97316', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            Te beantwoorden ({unanswered.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {unanswered.map(c => (
              <Link key={c.id} href={`/coach/clients/${c.client_id}?tab=checkin`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: '10px',
                padding: '16px 20px', textDecoration: 'none',
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{c.clients?.full_name ?? '—'}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>Week {c.week_number} · {formatDate(c.checkin_date)}</p>
                  {c.general_notes && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '500px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.general_notes}
                    </p>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#F97316', flexShrink: 0, marginLeft: '16px' }}>Beantwoorden →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {answered.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            Beantwoord ({answered.length})
          </p>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            {answered.map(c => (
              <Link key={c.id} href={`/coach/clients/${c.client_id}?tab=checkin`} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 20px', borderBottom: '1px solid var(--surface-2)', textDecoration: 'none',
              }}>
                <div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{c.clients?.full_name ?? '—'}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '1px' }}>Week {c.week_number} · {formatDate(c.checkin_date)}</p>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#22C55E' }}>Beantwoord</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {all.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-faint)' }}>
          <p>Nog geen check-ins ontvangen</p>
        </div>
      )}
    </div>
  )
}
