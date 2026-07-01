'use client'
import { useState } from 'react'
import type { MealPlan, MealPlanItem } from '@/lib/types'

const DAY_LABELS: Record<string, string> = { TD: 'Trainingsdag', RD: 'Rustdag', LOW: 'Low dag' }
const DAY_COLORS: Record<string, string> = { TD: '#004aad', RD: '#22C55E', LOW: '#F59E0B' }

function formatQty(quantity: number, unit: string) {
  if (unit === 'stuk') return `${quantity} stuk${quantity === 1 ? '' : 's'}`
  return `${quantity}${unit}`
}

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

export default function MaaltijdplanTabs({ plan, items }: { plan: MealPlan; items: MealPlanItem[] }) {
  const allDayTypes: ('TD' | 'RD' | 'LOW')[] = ['TD', 'RD', 'LOW']
  const availableDayTypes = allDayTypes.filter(dt => items.some(i => i.day_type === dt))
  const [activeTab, setActiveTab] = useState<'TD' | 'RD' | 'LOW'>(availableDayTypes[0] ?? 'TD')

  if (availableDayTypes.length === 0) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.82rem' }}>Nog geen maaltijden ingegeven door je coach.</p>
      </div>
    )
  }

  const key = activeTab.toLowerCase() as 'td' | 'rd' | 'low'
  const kcal = (plan as any)[`cals_${key}`] as number | null
  const dayItems = items.filter(i => i.day_type === activeTab)

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
    <div>
      {/* Tab switcher */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px', gap: '4px' }}>
        {availableDayTypes.map(dt => {
          const active = dt === activeTab
          return (
            <button
              key={dt}
              onClick={() => setActiveTab(dt)}
              style={{
                padding: '10px 16px',
                fontSize: '0.82rem',
                fontWeight: active ? 600 : 400,
                color: active ? DAY_COLORS[dt] : 'var(--text-faint)',
                background: 'none',
                border: 'none',
                borderBottom: active ? `2px solid ${DAY_COLORS[dt]}` : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-1px',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s',
              }}
            >
              {DAY_LABELS[dt]}
            </button>
          )
        })}
      </div>

      {/* Macro summary for active day */}
      {kcal && (
        <div style={{ background: 'var(--surface)', border: `1px solid var(--border)`, borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
          <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
            {kcal} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-dim)' }}>kcal doelstelling</span>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <MacroRow label="Eiwitten" value={(plan as any)[`pro_${key}`]} color="#004aad" />
            <MacroRow label="Koolhydraten" value={(plan as any)[`cho_${key}`]} color="#8B5CF6" />
            <MacroRow label="Vetten" value={(plan as any)[`fat_${key}`]} color="#EF4444" />
          </div>
        </div>
      )}

      {/* Totals from meal items */}
      {dayItems.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Plan: {dayTotals.kcal} kcal · E {dayTotals.pro.toFixed(0)}g · KH {dayTotals.cho.toFixed(0)}g · V {dayTotals.fat.toFixed(0)}g
          </span>
        </div>
      )}

      {/* Meals */}
      {dayItems.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.82rem' }}>Geen maaltijden voor {DAY_LABELS[activeTab].toLowerCase()}.</p>
        </div>
      ) : (
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
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{formatQty(item.quantity ?? 0, item.unit)}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', minWidth: '52px', textAlign: 'right' }}>{item.calories} kcal</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
