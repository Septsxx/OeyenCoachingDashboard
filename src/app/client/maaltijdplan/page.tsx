import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { MealPlan, MealPlanItem } from '@/lib/types'
// MealPlanItem is used via the cast in allItems query
import MaaltijdplanTabs from './MaaltijdplanTabs'

export const dynamic = 'force-dynamic'

export default async function MaaltijdplanPage() {
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
      .select('id, full_name')
      .eq('email', user.email)
      .maybeSingle()

    if (byEmail) {
      await supabase.from('clients').update({ user_id: user.id }).eq('id', byEmail.id)
      clientRow = byEmail
    }
  }

  if (!clientRow) { await supabase.auth.signOut(); redirect('/login?error=no_profile') }

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('client_id', clientRow.id)
    .eq('is_active', true)
    .maybeSingle() as { data: MealPlan | null }

  if (!plan) {
    return (
      <div>
        <Link href="/client" style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
          ← Terug
        </Link>
        <div style={{ textAlign: 'center', padding: '72px 24px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>🥗</span>
          </div>
          <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>Plan komt eraan</p>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: '260px', margin: '0 auto' }}>
            Je coach stelt jouw persoonlijk maaltijdplan samen. Zodra het beschikbaar is zie je het hier.
          </p>
        </div>
      </div>
    )
  }

  const { data: allItems } = await supabase
    .from('meal_plan_items')
    .select('*')
    .eq('meal_plan_id', plan.id)
    .order('meal_number')
    .order('sort_order') as { data: MealPlanItem[] | null }

  const items = allItems ?? []

  return (
    <div>
      <Link href="/client" style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
        ← Terug
      </Link>

      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '4px' }}>{plan.name}</h1>
      {plan.water_target && (
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '16px' }}>Waterdoelstelling: {plan.water_target}</p>
      )}
      {!plan.water_target && <div style={{ marginBottom: '16px' }} />}

      <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
          <strong style={{ color: 'var(--text)' }}>Alle gewichten zijn ONGEKOOKT.</strong> Weeg al je voedingsmiddelen altijd af vóór het koken of bereiden.
        </p>
      </div>

      {plan.notes && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', marginBottom: '28px' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Notities van je coach</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{plan.notes}</p>
        </div>
      )}

      <MaaltijdplanTabs plan={plan} items={items} />
    </div>
  )
}
