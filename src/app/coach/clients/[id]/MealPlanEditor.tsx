'use client'
import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { MealPlan, MealPlanItem, Food } from '@/lib/types'
import { LABEL, BTN_PRIMARY, BTN_GHOST } from '@/lib/ui'
import { Plus, Trash2, Search, Pencil } from 'lucide-react'

type MacroDay = 'td' | 'rd' | 'low'
const DAY_LABELS: Record<MacroDay, string> = { td: 'Trainingsdag (TD)', rd: 'Rustdag (RD)', low: 'Lowdag (LOW)' }
const MEAL_NAMES = ['Ontbijt', 'Pre-workout', 'Post-workout', 'Maaltijd 2', 'Snack', 'Maaltijd 3', 'Maaltijd 4', 'Maaltijd 5']

function MacroSection({ day, plan, onChange }: {
  day: MacroDay
  plan: Partial<MealPlan>
  onChange: (field: string, value: string) => void
}) {
  const fields: [string, string][] = [
    [`cals_${day}`, 'Calorieën (kcal)'],
    [`pro_${day}`, 'Eiwitten (g)'],
    [`cho_${day}`, 'Koolhydraten (g)'],
    [`fat_${day}`, 'Vetten (g)'],
  ]
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '16px' }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
        {DAY_LABELS[day]}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {fields.map(([key, label]) => (
          <div key={key}>
            <label style={LABEL}>{label}</label>
            <input
              type="number"
              value={(plan as any)[key] ?? ''}
              onChange={e => onChange(key, e.target.value)}
              placeholder="—"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Meal builder types ----
type ItemDraft = {
  food: Food
  quantity: number
  meal_number: number
  meal_name: string
}

function calcMacros(food: Food, qty: number) {
  const f = qty / 100
  return {
    kcal: Math.round(food.calories_per_100g * f),
    pro: +(food.protein_per_100g * f).toFixed(1),
    cho: +(food.carbs_per_100g * f).toFixed(1),
    fat: +(food.fat_per_100g * f).toFixed(1),
  }
}

function FoodSearchDropdown({ foods, onSelect }: { foods: Food[]; onSelect: (f: Food) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() =>
    !q ? [] : foods.filter(f => f.name.toLowerCase().includes(q.toLowerCase()) || (f.brand ?? '').toLowerCase().includes(q.toLowerCase())).slice(0, 8),
    [q, foods]
  )

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Zoek ingrediënt..."
          style={{ paddingLeft: '28px', fontSize: '0.82rem' }}
        />
      </div>
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', zIndex: 50, maxHeight: '220px', overflowY: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {results.map(food => (
            <div
              key={food.id}
              onMouseDown={() => { onSelect(food); setQ(''); setOpen(false) }}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
            >
              <p style={{ fontSize: '0.82rem', fontWeight: 500 }}>{food.name}{food.brand ? ` — ${food.brand}` : ''}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                {food.calories_per_100g} kcal · E {food.protein_per_100g}g · KH {food.carbs_per_100g}g · V {food.fat_per_100g}g / 100g
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type MacroTargets = { kcal: number | null; pro: number | null; cho: number | null; fat: number | null }

function MacroBar({ label, actual, target, color }: { label: string; actual: number; target: number | null; color: string }) {
  if (!target) return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{label}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color }}>{actual.toFixed(label === 'Kcal' ? 0 : 1)}</span>
      </div>
      <div style={{ height: '4px', background: 'var(--border)', borderRadius: '99px' }}>
        <div style={{ height: '100%', width: '30%', background: color, borderRadius: '99px' }} />
      </div>
    </div>
  )
  const pct = Math.min((actual / target) * 100, 100)
  const over = actual > target
  const remaining = target - actual
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{label}</span>
        <span style={{ fontSize: '0.72rem', color: over ? '#EF4444' : 'var(--text-dim)' }}>
          <span style={{ fontWeight: 700, color }}>{actual.toFixed(label === 'Kcal' ? 0 : 1)}</span>
          {' '}/{' '}{target}{' '}
          <span style={{ color: over ? '#EF4444' : '#22C55E' }}>
            ({over ? '+' : ''}{remaining.toFixed(label === 'Kcal' ? 0 : 1)})
          </span>
        </span>
      </div>
      <div style={{ height: '4px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: over ? '#EF4444' : color, borderRadius: '99px', transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

function MealBuilder({ mealPlanId, dayType, foods, initialItems, targets }: {
  mealPlanId: string
  dayType: 'TD' | 'RD' | 'LOW'
  foods: Food[]
  initialItems: MealPlanItem[]
  targets: MacroTargets
}) {
  const supabase = createClient()
  const router = useRouter()
  const [items, setItems] = useState<MealPlanItem[]>(initialItems)
  const [pendingFood, setPendingFood] = useState<Food | null>(null)
  const [pendingQty, setPendingQty] = useState(100)
  const [pendingMeal, setPendingMeal] = useState(1)
  const [saving, setSaving] = useState(false)

  const grouped = useMemo(() => {
    const map = new Map<number, MealPlanItem[]>()
    for (const item of items) {
      const list = map.get(item.meal_number) ?? []
      list.push(item)
      map.set(item.meal_number, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b)
  }, [items])

  const totals = useMemo(() => {
    return items.reduce((acc, it) => ({
      kcal: acc.kcal + (it.calories ?? 0),
      pro: acc.pro + (it.protein_g ?? 0),
      cho: acc.cho + (it.carbs_g ?? 0),
      fat: acc.fat + (it.fat_g ?? 0),
    }), { kcal: 0, pro: 0, cho: 0, fat: 0 })
  }, [items])

  async function handleAdd() {
    if (!pendingFood) return
    setSaving(true)
    const m = calcMacros(pendingFood, pendingQty)
    const mealName = MEAL_NAMES[pendingMeal - 1] ?? `Maaltijd ${pendingMeal}`
    const payload = {
      meal_plan_id: mealPlanId,
      day_type: dayType,
      meal_number: pendingMeal,
      meal_name: mealName,
      food_item: pendingFood.name,
      food_id: pendingFood.id,
      quantity: pendingQty,
      unit: pendingFood.unit,
      calories: m.kcal,
      protein_g: m.pro,
      carbs_g: m.cho,
      fat_g: m.fat,
      sort_order: items.filter(i => i.meal_number === pendingMeal).length,
    }
    const { data } = await supabase.from('meal_plan_items').insert(payload).select().single()
    if (data) setItems(prev => [...prev, data as MealPlanItem])
    setPendingFood(null)
    setPendingQty(100)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('meal_plan_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    setEditingId(null)
  }

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState(100)
  const [editMeal, setEditMeal] = useState(1)

  function startEdit(item: MealPlanItem) {
    setEditingId(item.id)
    setEditQty(item.quantity ?? 100)
    setEditMeal(item.meal_number)
  }

  async function handleSaveEdit(item: MealPlanItem) {
    const food = foods.find(f => f.id === item.food_id)
    const m = food ? calcMacros(food, editQty) : { kcal: item.calories ?? 0, pro: item.protein_g ?? 0, cho: item.carbs_g ?? 0, fat: item.fat_g ?? 0 }
    const mealName = MEAL_NAMES[editMeal - 1] ?? `Maaltijd ${editMeal}`
    const update = { quantity: editQty, meal_number: editMeal, meal_name: mealName, calories: m.kcal, protein_g: m.pro, carbs_g: m.cho, fat_g: m.fat }
    await supabase.from('meal_plan_items').update(update).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...update } : i))
    setEditingId(null)
  }

  return (
    <div>
      {/* Day totals vs targets */}
      <div style={{ padding: '14px 16px', background: 'var(--surface-2)', borderRadius: '10px', marginBottom: '20px' }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
          Dag totaal {targets.kcal ? '(huidig / doel)' : '— stel macro doelen in voor progressie'}
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <MacroBar label="Kcal" actual={totals.kcal} target={targets.kcal} color="#F59E0B" />
          <MacroBar label="Eiwitten" actual={totals.pro} target={targets.pro} color="#004aad" />
          <MacroBar label="Koolhyd." actual={totals.cho} target={targets.cho} color="#8B5CF6" />
          <MacroBar label="Vetten" actual={totals.fat} target={targets.fat} color="#EF4444" />
        </div>
      </div>

      {/* Grouped meals */}
      {grouped.map(([mealNum, mealItems]) => {
        const mealTotals = mealItems.reduce((acc, it) => ({
          kcal: acc.kcal + (it.calories ?? 0),
          pro: acc.pro + (it.protein_g ?? 0),
          cho: acc.cho + (it.carbs_g ?? 0),
          fat: acc.fat + (it.fat_g ?? 0),
        }), { kcal: 0, pro: 0, cho: 0, fat: 0 })
        return (
          <div key={mealNum} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                {mealItems[0]?.meal_name ?? `Maaltijd ${mealNum}`}
              </p>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                {mealTotals.kcal} kcal · E {mealTotals.pro.toFixed(1)} · KH {mealTotals.cho.toFixed(1)} · V {mealTotals.fat.toFixed(1)}
              </span>
            </div>
            {mealItems.map(item => (
              editingId === item.id ? (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                  <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 500 }}>{item.food_item}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number" min="1" value={editQty}
                      onChange={e => setEditQty(+e.target.value)}
                      style={{ width: '72px', fontSize: '0.82rem', padding: '4px 8px' }}
                      autoFocus
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{item.unit}</span>
                  </div>
                  <select value={editMeal} onChange={e => setEditMeal(+e.target.value)} style={{ fontSize: '0.78rem', padding: '4px 8px' }}>
                    {MEAL_NAMES.map((name, i) => <option key={i} value={i + 1}>{name}</option>)}
                  </select>
                  <button onClick={() => handleSaveEdit(item)} style={{ ...BTN_PRIMARY, padding: '4px 10px', fontSize: '0.75rem' }}>OK</button>
                  <button onClick={() => setEditingId(null)} style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: '0.75rem' }}>×</button>
                  <button onClick={() => handleDelete(item.id)} style={{ ...BTN_GHOST, padding: '4px', lineHeight: 0, color: '#EF4444' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ) : (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ flex: 1, fontSize: '0.82rem' }}>{item.food_item}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', minWidth: '60px', textAlign: 'right' }}>{item.quantity}{item.unit}</span>
                  <span style={{ fontSize: '0.78rem', minWidth: '50px', textAlign: 'right' }}>{item.calories} kcal</span>
                  <button onClick={() => startEdit(item)} style={{ ...BTN_GHOST, padding: '3px', lineHeight: 0 }}>
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} style={{ ...BTN_GHOST, padding: '3px', lineHeight: 0, color: '#EF4444' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            ))}
          </div>
        )
      })}

      {/* Add food row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', padding: '12px', background: 'var(--surface-2)', borderRadius: '10px', flexWrap: 'wrap' }}>
        <div style={{ flex: '2', minWidth: '180px' }}>
          <label style={LABEL}>Ingrediënt</label>
          {pendingFood ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.82rem' }}>
              <span style={{ flex: 1 }}>{pendingFood.name}</span>
              <button onClick={() => setPendingFood(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 0, lineHeight: 0 }}>×</button>
            </div>
          ) : (
            <FoodSearchDropdown foods={foods} onSelect={f => { setPendingFood(f); setPendingQty(f.serving_size_g ?? 100) }} />
          )}
        </div>
        <div style={{ minWidth: '90px' }}>
          <label style={LABEL}>Hoeveelheid (g)</label>
          <input type="number" min="1" value={pendingQty} onChange={e => setPendingQty(+e.target.value)} />
        </div>
        <div style={{ minWidth: '130px' }}>
          <label style={LABEL}>Maaltijd</label>
          <select value={pendingMeal} onChange={e => setPendingMeal(+e.target.value)}>
            {MEAL_NAMES.map((name, i) => (
              <option key={i} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>
        {pendingFood && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', minWidth: '120px' }}>
            {calcMacros(pendingFood, pendingQty).kcal} kcal<br />
            E {calcMacros(pendingFood, pendingQty).pro}g · KH {calcMacros(pendingFood, pendingQty).cho}g · V {calcMacros(pendingFood, pendingQty).fat}g
          </div>
        )}
        <button
          onClick={handleAdd}
          disabled={!pendingFood || saving}
          style={{ ...BTN_PRIMARY, display: 'flex', alignItems: 'center', gap: '6px', opacity: (!pendingFood || saving) ? 0.5 : 1 }}
        >
          <Plus size={14} /> Voeg toe
        </button>
      </div>
    </div>
  )
}

export default function MealPlanEditor({ clientId, initialPlan }: { clientId: string; initialPlan: MealPlan | null }) {
  const router = useRouter()
  const supabase = createClient()
  const [plan, setPlan] = useState<Partial<MealPlan>>(initialPlan ?? {})
  const [notes, setNotes] = useState(initialPlan?.notes ?? '')
  const [water, setWater] = useState(initialPlan?.water_target ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<'targets' | 'meals'>('targets')
  const [dayType, setDayType] = useState<'TD' | 'RD' | 'LOW'>('TD')
  const [foods, setFoods] = useState<Food[]>([])
  const [mealItems, setMealItems] = useState<MealPlanItem[]>([])
  const [planId, setPlanId] = useState<string | null>(initialPlan?.id ?? null)

  useEffect(() => {
    supabase.from('foods').select('*').eq('is_active', true).order('name')
      .then(({ data }) => setFoods((data ?? []) as Food[]))
  }, [])

  useEffect(() => {
    if (!planId) return
    supabase.from('meal_plan_items').select('*').eq('meal_plan_id', planId).order('meal_number').order('sort_order')
      .then(({ data }) => setMealItems((data ?? []) as MealPlanItem[]))
  }, [planId])

  function update(field: string, value: string) {
    setPlan(prev => ({ ...prev, [field]: value === '' ? null : +value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...plan, client_id: clientId, name: 'Voedingsplan', is_active: true, notes: notes || null, water_target: water || null }
    if (planId) {
      await supabase.from('meal_plans').update(payload).eq('id', planId)
    } else {
      const { data } = await supabase.from('meal_plans').insert(payload).select().single()
      if (data) setPlanId((data as MealPlan).id)
    }
    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  const itemsForDay = mealItems.filter(i => i.day_type === dayType)

  const dayTargets: MacroTargets = useMemo(() => {
    const k = dayType.toLowerCase() as 'td' | 'rd' | 'low'
    return {
      kcal: (plan as any)[`cals_${k}`] ?? null,
      pro: (plan as any)[`pro_${k}`] ?? null,
      cho: (plan as any)[`cho_${k}`] ?? null,
      fat: (plan as any)[`fat_${k}`] ?? null,
    }
  }, [plan, dayType])

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {([['targets', 'Macro doelstellingen'], ['meals', 'Maaltijden samenstellen']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '8px 14px',
            fontSize: '0.82rem',
            fontWeight: tab === key ? 600 : 400,
            color: tab === key ? '#004aad' : 'var(--text-dim)',
            background: 'none',
            border: 'none',
            borderBottom: tab === key ? '2px solid #004aad' : '2px solid transparent',
            cursor: 'pointer',
            marginBottom: '-1px',
          }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'targets' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {(['td', 'rd', 'low'] as MacroDay[]).map(day => (
              <MacroSection key={day} day={day} plan={plan} onChange={update} />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={LABEL}>Waterdoelstelling</label>
              <input value={water} onChange={e => { setWater(e.target.value); setSaved(false) }} placeholder="Bv. 2.5L" />
            </div>
            <div>
              <label style={LABEL}>Notities</label>
              <input value={notes} onChange={e => { setNotes(e.target.value); setSaved(false) }} placeholder="Optionele opmerkingen" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
            {saved && <span style={{ fontSize: '0.78rem', color: '#22C55E' }}>Opgeslagen</span>}
            <button onClick={handleSave} disabled={saving} style={{ ...BTN_PRIMARY, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Opslaan...' : planId ? 'Wijzigingen opslaan' : 'Plan aanmaken'}
            </button>
          </div>
        </>
      )}

      {tab === 'meals' && (
        <>
          {!planId ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              Sla eerst de macro doelstellingen op om maaltijden te kunnen samenstellen.
              <br />
              <button onClick={() => setTab('targets')} style={{ ...BTN_PRIMARY, marginTop: '12px' }}>
                Naar macro doelstellingen
              </button>
            </div>
          ) : foods.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              Voeg eerst voedingsmiddelen toe via <strong>Voeding</strong> in de zijbalk.
            </div>
          ) : (
            <>
              {/* Day type tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {(['TD', 'RD', 'LOW'] as const).map(dt => (
                  <button key={dt} onClick={() => setDayType(dt)} style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: dayType === dt ? 600 : 400,
                    background: dayType === dt ? '#004aad' : 'var(--surface-2)',
                    color: dayType === dt ? '#ffffff' : 'var(--text-dim)',
                    border: 'none',
                    cursor: 'pointer',
                  }}>
                    {dt === 'TD' ? 'Trainingsdag' : dt === 'RD' ? 'Rustdag' : 'Low dag'}
                  </button>
                ))}
              </div>
              <MealBuilder
                key={`${planId}-${dayType}`}
                mealPlanId={planId}
                dayType={dayType}
                foods={foods}
                initialItems={itemsForDay}
                targets={dayTargets}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
