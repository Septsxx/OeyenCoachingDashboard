import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Client, Payment } from '@/lib/types'
import { PACKAGES } from '@/lib/types'
import { getPaymentStatus } from '@/lib/payment-utils'
import { formatDate } from '@/lib/ui'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: payments } = await supabase
    .from('payments')
    .select('*, clients(full_name)')
    .order('payment_date', { ascending: false }) as { data: (Payment & { clients: { full_name: string } | null })[] | null }

  const all = payments ?? []

  const stats = {
    ok: all.filter(p => { const s = getPaymentStatus(p); return s.days !== null && s.days > 14 }).length,
    soon: all.filter(p => { const s = getPaymentStatus(p); return s.days !== null && s.days >= 0 && s.days <= 14 }).length,
    expired: all.filter(p => { const s = getPaymentStatus(p); return s.days !== null && s.days < 0 }).length,
    total: all.reduce((sum, p) => sum + p.amount, 0),
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Betalingen</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{all.length} betalingen geregistreerd</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Actief', value: stats.ok, color: '#22C55E' },
          { label: 'Verloopt binnenkort', value: stats.soon, color: '#F97316' },
          { label: 'Vervallen', value: stats.expired, color: '#EF4444' },
          { label: 'Totale omzet', value: `€${stats.total.toLocaleString('nl-BE')}`, color: 'var(--text)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{label}</p>
            <p style={{ fontSize: '2rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 120px 120px 140px 140px 120px',
          padding: '12px 20px', borderBottom: '1px solid var(--surface-2)',
          fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px',
        }}>
          <span>Klant</span><span>Pakket</span><span>Bedrag</span><span>Betaaldatum</span><span>Vervaldatum</span><span>Status</span>
        </div>

        {all.length === 0 ? (
          <p style={{ padding: '48px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.9rem' }}>Nog geen betalingen</p>
        ) : (
          all.map(p => {
            const status = getPaymentStatus(p)
            return (
              <div key={p.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 120px 140px 140px 120px',
                padding: '14px 20px', borderBottom: '1px solid var(--surface-2)', alignItems: 'center',
              }}>
                <Link href={`/coach/clients/${p.client_id}?tab=payments`} style={{ textDecoration: 'none' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>{p.clients?.full_name ?? '—'}</p>
                </Link>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{PACKAGES[p.package].label}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text)' }}>€{p.amount}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{formatDate(p.payment_date)}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{formatDate(p.expiry_date)}</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem',
                  padding: '3px 10px', borderRadius: '99px', width: 'fit-content',
                  background: status.bg, color: status.color,
                }}>
                  {status.label}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
