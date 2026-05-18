import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { MealPlan, MealPlanItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

const DAY_LABELS = { TD: 'Trainingsdag', RD: 'Rustdag', LOW: 'Low dag' }
const DAY_COLORS = { TD: '#004aad', RD: '#22C55E', LOW: '#F59E0B' }

function MacroRow({ label, value, color }: { label: string; value: number | null; color: string }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginLeft: 'auto' }}>{value}g</span>
    </div>
  )
}

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
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Nog geen maaltijdplan beschikbaar. Je coach stelt dit voor je in.</p>
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

  const dayTypes: ('TD' | 'RD' | 'LOW')[] = ['TD', 'RD', 'LOW']

  return (
    <div>
      <Link href="/client" style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
        ← Terug
      </Link>

      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '4px' }}>{plan.name}</h1>
      {plan.water_target && (
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '24px' }}>Waterdoelstelling: {plan.water_target}</p>
      )}
      {!plan.water_target && <div style={{ marginBottom: '24px' }} />}

      {/* Macro targets overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '28px' }}>
        {dayTypes.map(dt => {
          const key = dt.toLowerCase() as 'td' | 'rd' | 'low'
          const kcal = (plan as any)[`cals_${key}`] as number | null
          if (!kcal) return null
          return (
            <div key={dt} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: DAY_COLORS[dt] }} />
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{DAY_LABELS[dt]}</p>
              </div>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', marginBottom: '10px' }}>{kcal} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-dim)' }}>kcal</span></p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <MacroRow label="Eiwitten" value={(plan as any)[`pro_${key}`]} color="#004aad" />
                <MacroRow label="Koolhyd." value={(plan as any)[`cho_${key}`]} color="#8B5CF6" />
                <MacroRow label="Vetten" value={(plan as any)[`fat_${key}`]} color="#EF4444" />
              </div>
            </div>
          )
        })}
      </div>

      {plan.notes && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', marginBottom: '28px' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Notities van je coach</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{plan.notes}</p>
        </div>
      )}

      {/* Meals per day type */}
      {dayTypes.map(dt => {
        const dayItems = items.filter(i => i.day_type === dt)
        if (dayItems.length === 0) return null

        const grouped = dayItems.reduce<Record<number, MealPlanItem[]>>((acc, item) => {
          if (!acc[item.meal_number]) acc[item.meal_number] = []
          acc[item.meal_number].push(item)
          return acc
        }, {})

        const dayTotals = dayItems.reduce(
          (acc, i) => ({ kcal: acc.kcal + (i.calories ?? 0), pro: acc.pro + (i.protein_g ?? 0), cho: acc.cho + (i.carbs_g ?? 0), fat: acc.fat + (i.fat_g ?? 0) }),
          { kcal: 0, pro: 0, cho: 0, fat: 0 }
        )

        return (
          <div key={dt} style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: DAY_COLORS[dt] }} />
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{DAY_LABELS[dt]}</h2>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {dayTotals.kcal} kcal · E {dayTotals.pro.toFixed(0)}g · KH {dayTotals.cho.toFixed(0)}g · V {dayTotals.fat.toFixed(0)}g
              </span>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              {Object.entries(grouped).map(([mealNum, mealItems]) => {
                const mealTotals = mealItems.reduce(
                  (acc, i) => ({ kcal: acc.kcal + (i.calories ?? 0), pro: acc.pro + (i.protein_g ?? 0), cho: acc.cho + (i.carbs_g ?? 0), fat: acc.fat + (i.fat_g ?? 0) }),
                  { kcal: 0, pro: 0, cho: 0, fat: 0 }
                )
                return (
                  <div key={mealNum} style={{ borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px 8px', background: 'var(--surface-2)' }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {mealItems[0]?.meal_name ?? `Maaltijd ${mealNum}`}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {mealTotals.kcal} kcal · E {mealTotals.pro.toFixed(0)} · KH {mealTotals.cho.toFixed(0)} · V {mealTotals.fat.toFixed(0)}
                      </span>
                    </div>
                    {mealItems.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid var(--surface-2)' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{item.food_item}</span>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{item.quantity}{item.unit}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', minWidth: '52px', textAlign: 'right' }}>{item.calories} kcal</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
