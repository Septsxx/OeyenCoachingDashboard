import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { differenceInDays, parseISO } from 'date-fns'
import type { Payment } from '@/lib/types'
import { getPaymentStatus } from '@/lib/payment-utils'
import { PACKAGES } from '@/lib/types'
import FinancienTabs from './FinancienTabs'

export const dynamic = 'force-dynamic'

type PaymentWithClient = Payment & { clients: { full_name: string } | null }

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: payments } = await supabase
    .from('payments')
    .select('*, clients(full_name)')
    .order('payment_date', { ascending: false }) as { data: PaymentWithClient[] | null }

  const all = payments ?? []
  const now = new Date()

  // Status stats
  const stats = {
    ok: all.filter(p => { const s = getPaymentStatus(p); return s.days !== null && s.days > 7 }).length,
    soon: all.filter(p => { const s = getPaymentStatus(p); return s.days !== null && s.days >= 0 && s.days <= 7 }).length,
    expired: all.filter(p => { const s = getPaymentStatus(p); return s.days !== null && s.days < 0 }).length,
    total: all.reduce((sum, p) => sum + p.amount, 0),
  }

  // Monthly revenue — last 12 months
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const revenue = all
      .filter(p => p.payment_date.startsWith(key))
      .reduce((sum, p) => sum + p.amount, 0)
    return {
      month: d.toLocaleDateString('nl-BE', { month: 'short', year: '2-digit' }),
      revenue,
    }
  })

  // Per-package breakdown
  const packageData = (Object.keys(PACKAGES) as (keyof typeof PACKAGES)[]).map(key => {
    const pkgPayments = all.filter(p => p.package === key)
    return {
      label: PACKAGES[key].label,
      count: pkgPayments.length,
      revenue: pkgPayments.reduce((sum, p) => sum + p.amount, 0),
    }
  })

  // This month revenue
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonthRevenue = all
    .filter(p => p.payment_date.startsWith(currentMonthKey))
    .reduce((sum, p) => sum + p.amount, 0)

  // YTD revenue
  const ytdRevenue = all
    .filter(p => p.payment_date.startsWith(String(now.getFullYear())))
    .reduce((sum, p) => sum + p.amount, 0)

  // Expiring within 30 days (not expired)
  const expiringSoon = all
    .map(p => ({ ...p, daysLeft: differenceInDays(parseISO(p.expiry_date), now) }))
    .filter(p => p.daysLeft >= 0 && p.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Financiën</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{all.length} betalingen geregistreerd</p>
      </div>

      <FinancienTabs
        payments={all}
        monthlyData={monthlyData}
        packageData={packageData}
        thisMonthRevenue={thisMonthRevenue}
        ytdRevenue={ytdRevenue}
        expiringSoon={expiringSoon}
        stats={stats}
      />
    </div>
  )
}
