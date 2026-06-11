'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import type { Client, Payment, DailyLog, SkinfoldMeasurement, WeeklyCheckin, MealPlan, TrainingSchema, TrainingExercise, WeeklyTimeline, PhaseKey, Supplement } from '@/lib/types'
import { PACKAGES, DEFAULT_PHASE_LABELS, PHASE_COLORS } from '@/lib/types'
import { getPaymentStatus } from '@/lib/payment-utils'
import { CHART_TOOLTIP, formatDate, formatDateShort } from '@/lib/ui'
import PaymentModal from './PaymentModal'
import SkinfoldModal from './SkinfoldModal'
import CheckinResponseModal from './CheckinResponseModal'
import MealPlanEditor from './MealPlanEditor'
import WorkoutPlanEditor from './WorkoutPlanEditor'
import ProfileEditModal from './ProfileEditModal'

const thStyle: React.CSSProperties = {
  padding: '8px 12px', textAlign: 'left', color: '#ffffff', fontWeight: 600,
  fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap',
}

function InlineNumberCell({ value, onSave, placeholder, format }: {
  value: number | null
  onSave: (v: number | null) => void
  placeholder?: string
  format?: (v: number) => string
}) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')
  if (editing) return (
    <input
      type="number" autoFocus value={input}
      onChange={e => setInput(e.target.value)}
      onBlur={() => { onSave(input === '' ? null : Number(input)); setEditing(false) }}
      onKeyDown={e => { if (e.key === 'Enter') { onSave(input === '' ? null : Number(input)); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
      style={{ width: '80px', border: 'none', borderBottom: '2px solid #004aad', background: 'transparent', color: 'var(--text)', fontSize: '0.78rem', outline: 'none', padding: '2px 0' }}
    />
  )
  return (
    <button onClick={() => { setInput(value != null ? String(value) : ''); setEditing(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: value != null ? 'var(--text)' : 'var(--text-faint)', fontSize: '0.78rem', textAlign: 'right', width: '100%' }}>
      {value != null ? (format ? format(value) : value) : (placeholder ?? '—')}
    </button>
  )
}

function InlineTextCell({ value, onSave, placeholder }: {
  value: string | null
  onSave: (v: string) => void
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')
  if (editing) return (
    <input
      type="text" autoFocus value={input}
      onChange={e => setInput(e.target.value)}
      onBlur={() => { onSave(input); setEditing(false) }}
      onKeyDown={e => { if (e.key === 'Enter') { onSave(input); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
      style={{ width: '100%', minWidth: '80px', border: 'none', borderBottom: '2px solid #004aad', background: 'transparent', color: 'var(--text)', fontSize: '0.78rem', outline: 'none', padding: '2px 0' }}
    />
  )
  return (
    <button onClick={() => { setInput(value ?? ''); setEditing(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: value ? 'var(--text)' : 'var(--text-faint)', fontSize: '0.78rem', textAlign: 'left', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
      {value || placeholder || '—'}
    </button>
  )
}

function AccountSection({ client }: { client: Client }) {
  const [email, setEmail] = useState(client.email ?? '')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/coach/clients/create-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: client.id, email, password }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setError(json.error ?? 'Onbekende fout'); return }
    setDone(true)
    router.refresh()
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
      <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '14px' }}>Portaal account</p>

      {client.user_id ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Account actief</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>— {client.email}</span>
        </div>
      ) : done ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem', color: '#22C55E' }}>Account aangemaakt voor {email}</span>
        </div>
      ) : (
        <form onSubmit={handleCreate}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
            Nog geen account. Stel een e-mailadres en wachtwoord in voor de klant.
          </p>
          <div className="cols-2" style={{ marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>E-mailadres</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="klant@email.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '5px' }}>Wachtwoord</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="Min. 8 tekens" style={{ paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '0.8rem' }}>{showPw ? '🙈' : '👁'}</button>
              </div>
            </div>
          </div>
          {error && <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginBottom: '10px' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ background: '#111', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '0.82rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Aanmaken...' : 'Account aanmaken'}
          </button>
        </form>
      )}
    </div>
  )
}

const TABS = [
  { id: 'overview', label: 'Overzicht' },
  { id: 'tijdlijn', label: 'Tijdlijn' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'body', label: 'Lichaamssamenstelling' },
  { id: 'checkin', label: 'Check-ins' },
  { id: 'mealplan', label: 'Voedingsplan' },
  { id: 'training', label: 'Trainingsschema' },
  { id: 'supplementen', label: 'Supplementen' },
  { id: 'payments', label: 'Betalingen' },
  { id: 'profile', label: 'Profiel' },
]

export default function ClientDetailTabs({
  client, payments, logs, skinfolds, checkins, mealPlan, trainingSchemas, timeline: initialTimeline, phaseLabels: initialPhaseLabels, initialTab, supplements: initialSupplements,
}: {
  client: Client
  payments: Payment[]
  logs: DailyLog[]
  skinfolds: SkinfoldMeasurement[]
  checkins: WeeklyCheckin[]
  mealPlan: MealPlan | null
  trainingSchemas: (TrainingSchema & { exercises: TrainingExercise[] })[]
  timeline: WeeklyTimeline[]
  phaseLabels: Partial<Record<PhaseKey, string>>
  initialTab: string
  supplements: Supplement[]
}) {
  const [tab, setTab] = useState(initialTab)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSkinfoldModal, setShowSkinfoldModal] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [checkinToAnswer, setCheckinToAnswer] = useState<WeeklyCheckin | null>(null)
  const [stepGoal, setStepGoal] = useState<number | null>(client.step_goal)
  const [prevStepGoal, setPrevStepGoal] = useState<number | null>(client.prev_step_goal)
  const [editingStepGoal, setEditingStepGoal] = useState(false)
  const [stepGoalInput, setStepGoalInput] = useState(client.step_goal != null ? String(client.step_goal) : '')
  const [timelineMap, setTimelineMap] = useState<Map<number, WeeklyTimeline>>(() => {
    const m = new Map<number, WeeklyTimeline>()
    initialTimeline.forEach(t => m.set(t.week_number, t))
    return m
  })

  const [supplements, setSupplements] = useState<Supplement[]>(initialSupplements)
  const [addingSupp, setAddingSupp] = useState(false)
  const [newSupp, setNewSupp] = useState({ name: '', dose: '', timing: '', notes: '' })

  const [phaseLabels, setPhaseLabels] = useState<Partial<Record<PhaseKey, string>>>(initialPhaseLabels)
  const [editingLabels, setEditingLabels] = useState(false)
  const [labelDrafts, setLabelDrafts] = useState<Record<PhaseKey, string>>({ ...DEFAULT_PHASE_LABELS, ...initialPhaseLabels })

  const phaseLabel = (key: PhaseKey) => phaseLabels[key] ?? DEFAULT_PHASE_LABELS[key]

  async function addSupplement() {
    if (!newSupp.name.trim()) return
    const res = await fetch('/api/coach/clients/supplements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: client.id, name: newSupp.name.trim(), dose: newSupp.dose.trim() || null, timing: newSupp.timing.trim() || null, notes: newSupp.notes.trim() || null, sort_order: supplements.length }),
    })
    const data = await res.json()
    if (data.id) {
      setSupplements(prev => [...prev, data])
      setNewSupp({ name: '', dose: '', timing: '', notes: '' })
      setAddingSupp(false)
    }
  }

  async function updateSupplement(id: string, field: string, value: string | null) {
    setSupplements(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
    await fetch('/api/coach/clients/supplements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: value }),
    })
  }

  async function deleteSupplement(id: string) {
    setSupplements(prev => prev.filter(s => s.id !== id))
    await fetch('/api/coach/clients/supplements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  async function savePhaseLabels() {
    setPhaseLabels(labelDrafts)
    setEditingLabels(false)
    await fetch('/api/coach/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase_labels: labelDrafts }),
    })
  }

  async function saveTimelineField(weekNumber: number, field: string, value: unknown) {
    setTimelineMap(prev => {
      const next = new Map(prev)
      const existing = next.get(weekNumber)
      next.set(weekNumber, { ...(existing ?? { id: '', client_id: client.id, week_number: weekNumber, phase: null, energy_balance: null, calories_td: null, calories_ntd: null, cardio_target: null, steps_target: null, notes: null, created_at: '', updated_at: '' }), [field]: value })
      return next
    })
    await fetch('/api/coach/clients/timeline', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: client.id, weekNumber, [field]: value }),
    })
  }

  const timelineRows = (() => {
    const byWeek = new Map<number, { dates: string[], weights: number[], steps: number[], cardio: number[] }>()
    logs.forEach(l => {
      const w = l.week_number ?? 0
      if (!byWeek.has(w)) byWeek.set(w, { dates: [], weights: [], steps: [], cardio: [] })
      const d = byWeek.get(w)!
      d.dates.push(l.log_date)
      if (l.weight_kg) d.weights.push(l.weight_kg)
      if (l.steps) d.steps.push(l.steps)
      if (l.cardio_minutes) d.cardio.push(l.cardio_minutes)
    })
    const sorted = Array.from(byWeek.entries()).sort((a, b) => a[0] - b[0])
    return sorted.map(([weekNum, d], i) => {
      const avgBw = d.weights.length ? +(d.weights.reduce((a, b) => a + b) / d.weights.length).toFixed(1) : null
      const prevWeek = i > 0 ? sorted[i - 1][1] : null
      const prevAvgBw = prevWeek && prevWeek.weights.length ? +(prevWeek.weights.reduce((a, b) => a + b) / prevWeek.weights.length).toFixed(1) : null
      const bwDelta = avgBw !== null && prevAvgBw !== null ? +(avgBw - prevAvgBw).toFixed(1) : null
      const weekStart = d.dates.length ? [...d.dates].sort()[0] : null
      const avgSteps = d.steps.length ? Math.round(d.steps.reduce((a, b) => a + b) / d.steps.length) : null
      const totalCardio = d.cardio.length ? d.cardio.reduce((a, b) => a + b) : null
      return { weekNum, weekStart, avgBw, bwDelta, avgSteps, totalCardio }
    })
  })()

  async function saveStepGoal(raw: string) {
    const num = raw === '' ? null : parseInt(raw, 10)
    if (raw !== '' && isNaN(num as number)) return
    const newPrev = num !== stepGoal ? stepGoal : prevStepGoal
    if (num !== stepGoal) setPrevStepGoal(stepGoal)
    setStepGoal(num)
    setEditingStepGoal(false)
    await fetch('/api/coach/clients/step-goal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: client.id, stepGoal: num, prevStepGoal: newPrev }),
    })
  }

  const latestPayment = payments[0] ?? null
  const paymentStatus = getPaymentStatus(latestPayment)
  const currentWeight = logs.find(l => l.weight_kg)?.weight_kg ?? null

  const weightData = [...logs].reverse()
    .filter(l => l.weight_kg)
    .map(l => ({ date: formatDateShort(l.log_date), weight: l.weight_kg }))
    .slice(-60)

  const activityData = (() => {
    const byWeek = new Map<number, { steps: number[], cardio: number[], adh: number[], mot: number[], sleep: number[] }>()
    logs.forEach(l => {
      const w = l.week_number ?? 0
      if (!byWeek.has(w)) byWeek.set(w, { steps: [], cardio: [], adh: [], mot: [], sleep: [] })
      const d = byWeek.get(w)!
      if (l.steps) d.steps.push(l.steps)
      if (l.cardio_minutes) d.cardio.push(l.cardio_minutes)
      if (l.nutrition_adherence) d.adh.push(l.nutrition_adherence)
      if (l.motivation_score) d.mot.push(l.motivation_score)
      if (l.sleep_quality) d.sleep.push(l.sleep_quality)
    })
    return Array.from(byWeek.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([w, d]) => ({
        week: `W${w}`,
        steps: d.steps.length ? Math.round(d.steps.reduce((a, b) => a + b) / d.steps.length) : null,
        cardio: d.cardio.length ? d.cardio.reduce((a, b) => a + b) : null,
        adh: d.adh.length ? +(d.adh.reduce((a, b) => a + b) / d.adh.length).toFixed(1) : null,
        mot: d.mot.length ? +(d.mot.reduce((a, b) => a + b) / d.mot.length).toFixed(1) : null,
        sleep: d.sleep.length ? +(d.sleep.reduce((a, b) => a + b) / d.sleep.length).toFixed(1) : null,
      }))
      .slice(-20)
  })()

  const bfData = skinfolds.map(s => ({ date: formatDateShort(s.measured_at), bf: s.bf_pct, sum: s.sum_mm }))

  return (
    <>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--surface-2)', paddingBottom: '0' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.82rem', fontWeight: tab === t.id ? 600 : 400,
            color: tab === t.id ? '#004aad' : 'var(--text-faint)',
            borderBottom: tab === t.id ? '2px solid #004aad' : '2px solid transparent',
            marginBottom: '-1px',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Startgewicht', value: client.start_weight_kg ? `${client.start_weight_kg} kg` : '—' },
              { label: 'Huidig gewicht', value: currentWeight ? `${currentWeight} kg` : '—' },
              { label: 'Huidig BF%', value: skinfolds.length ? `${skinfolds[skinfolds.length - 1].bf_pct}%` : '—' },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{kpi.label}</p>
                <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)' }}>{kpi.value}</p>
              </div>
            ))}
            {/* Stappendoel — bewerkbaar */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Stappendoel/dag</p>
              {editingStepGoal ? (
                <input
                  type="number"
                  value={stepGoalInput}
                  autoFocus
                  min={0}
                  max={99999}
                  onChange={e => setStepGoalInput(e.target.value)}
                  onBlur={() => saveStepGoal(stepGoalInput)}
                  onKeyDown={e => { if (e.key === 'Enter') saveStepGoal(stepGoalInput); if (e.key === 'Escape') setEditingStepGoal(false) }}
                  style={{ fontSize: '1.4rem', fontWeight: 700, width: '100%', border: 'none', borderBottom: '2px solid #004aad', background: 'transparent', color: 'var(--text)', outline: 'none', padding: '0' }}
                />
              ) : (
                <button
                  onClick={() => { setStepGoalInput(stepGoal != null ? String(stepGoal) : ''); setEditingStepGoal(true) }}
                  title="Klik om aan te passen"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' }}
                >
                  <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)' }}>
                    {stepGoal != null ? stepGoal.toLocaleString('nl-BE') : <span style={{ color: 'var(--text-faint)', fontSize: '1rem' }}>Instellen</span>}
                  </p>
                  {prevStepGoal != null && (
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '4px' }}>
                      Vorig doel: {prevStepGoal.toLocaleString('nl-BE')}
                    </p>
                  )}
                </button>
              )}
            </div>
            {/* Betaling */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Betaling</p>
              <p style={{ fontSize: '1.6rem', fontWeight: 700, color: paymentStatus.color }}>{paymentStatus.label}</p>
              {latestPayment && paymentStatus.days !== null && paymentStatus.days >= 0 && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '4px' }}>{formatDate(latestPayment.expiry_date)}</p>
              )}
            </div>
          </div>

          {weightData.length > 1 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '16px' }}>Gewichtsverloop</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weightData}>
                  <CartesianGrid stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip {...CHART_TOOLTIP} formatter={(v: any) => [`${v} kg`, 'Gewicht']} />
                  <Line type="monotone" dataKey="weight" stroke="#888" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {client.short_term_goal && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Kortetermijndoel</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{client.short_term_goal}</p>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Langetermijndoel</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{client.long_term_goal ?? '—'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TIJDLIJN ── */}
      {tab === 'tijdlijn' && (
        <div>
          {/* Label editor */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            {editingLabels ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '320px' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>Fasenamen aanpassen</p>
                {(Object.keys(DEFAULT_PHASE_LABELS) as PhaseKey[]).map(key => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: PHASE_COLORS[key].border, flexShrink: 0 }} />
                    <input
                      value={labelDrafts[key]}
                      onChange={e => setLabelDrafts(d => ({ ...d, [key]: e.target.value }))}
                      style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 8px', fontSize: '0.78rem', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none' }}
                    />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={savePhaseLabels} style={{ background: '#004aad', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Opslaan</button>
                  <button onClick={() => { setEditingLabels(false); setLabelDrafts({ ...DEFAULT_PHASE_LABELS, ...phaseLabels }) }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 14px', fontSize: '0.78rem', cursor: 'pointer', color: 'var(--text-muted)' }}>Annuleren</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setEditingLabels(true)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px 14px', fontSize: '0.78rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                Fases aanpassen
              </button>
            )}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: '#004aad' }}>
                    <th rowSpan={2} style={thStyle}>WEEK</th>
                    <th rowSpan={2} style={thStyle}>DATUM</th>
                    <th rowSpan={2} style={thStyle}>FASE</th>
                    <th rowSpan={2} style={thStyle}>ENERGY<br />BALANCE</th>
                    <th rowSpan={2} style={thStyle}>GEM. GEW.</th>
                    <th rowSpan={2} style={{ ...thStyle, color: 'rgba(255,255,255,0.7)' }}>Δ</th>
                    <th colSpan={2} style={{ ...thStyle, borderBottom: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>EXPENDITURE</th>
                    <th rowSpan={2} style={thStyle}>NOTITIES</th>
                  </tr>
                  <tr style={{ background: '#004aad' }}>
                    <th style={thStyle}>CARDIO</th>
                    <th style={thStyle}>STAPPEN</th>
                  </tr>
                </thead>
                <tbody>
                  {timelineRows.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-faint)' }}>Nog geen logs beschikbaar</td></tr>
                  ) : timelineRows.map(row => {
                    const meta = timelineMap.get(row.weekNum)
                    const phase = meta?.phase ?? null
                    const eb = meta?.energy_balance ?? null
                    const colors = phase ? PHASE_COLORS[phase] : null
                    const deltaColor = row.bwDelta === null ? 'var(--text-faint)' : row.bwDelta < 0 ? '#16a34a' : row.bwDelta > 0 ? '#dc2626' : 'var(--text-muted)'
                    return (
                      <tr key={row.weekNum} style={{ borderBottom: '1px solid var(--surface-2)' }}>
                        <td style={{ padding: '8px 14px', fontWeight: 700, color: '#004aad', textAlign: 'center', whiteSpace: 'nowrap' }}>{row.weekNum}</td>
                        <td style={{ padding: '8px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {row.weekStart ? formatDateShort(row.weekStart) : '—'}
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <select
                            value={phase ?? ''}
                            onChange={e => saveTimelineField(row.weekNum, 'phase', e.target.value || null)}
                            style={{ background: colors ? colors.bg : 'var(--surface-2)', color: colors ? colors.text : 'var(--text-faint)', border: `1px solid ${colors ? colors.border : 'var(--border)'}`, borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', width: '100%', minWidth: '130px' }}
                          >
                            <option value="">—</option>
                            {(Object.keys(DEFAULT_PHASE_LABELS) as PhaseKey[]).map(key => (
                              <option key={key} value={key}>{phaseLabel(key)}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <select
                            value={eb ?? ''}
                            onChange={e => saveTimelineField(row.weekNum, 'energy_balance', e.target.value || null)}
                            style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', width: '100%', minWidth: '110px' }}
                          >
                            <option value="">—</option>
                            <option value="deficit">Deficit</option>
                            <option value="surplus">Surplus</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        </td>
                        <td style={{ padding: '8px 14px', fontWeight: 600, textAlign: 'right' }}>{row.avgBw ?? '—'}</td>
                        <td style={{ padding: '8px 14px', textAlign: 'right', color: deltaColor, fontWeight: 500 }}>
                          {row.bwDelta === null ? '-' : row.bwDelta > 0 ? `+${row.bwDelta}` : row.bwDelta}
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <InlineTextCell value={meta?.cardio_target ?? null} placeholder={row.totalCardio ? `${row.totalCardio}m` : '/'} onSave={v => saveTimelineField(row.weekNum, 'cardio_target', v || null)} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <InlineNumberCell value={meta?.steps_target ?? null} placeholder={row.avgSteps ? row.avgSteps.toLocaleString('nl-BE') : undefined} onSave={v => saveTimelineField(row.weekNum, 'steps_target', v)} format={v => v.toLocaleString('nl-BE')} />
                        </td>
                        <td style={{ padding: '6px 8px', minWidth: '160px' }}>
                          <InlineTextCell value={meta?.notes ?? null} placeholder="—" onSave={v => saveTimelineField(row.weekNum, 'notes', v || null)} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TRACKING ── */}
      {tab === 'tracking' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '16px' }}>Gem. stappen/dag (per week)</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={activityData.filter(d => d.steps)}>
                  <CartesianGrid stroke="var(--border)" />
                  <XAxis dataKey="week" tick={{ fill: 'var(--text-dim)', fontSize: 9 }} />
                  <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 9 }} tickFormatter={v => `${Math.round(v/1000)}k`} />
                  <Tooltip {...CHART_TOOLTIP} formatter={(v: any) => [`${v.toLocaleString()}`, 'Stappen']} />
                  <Bar dataKey="steps" fill="#888" radius={[2,2,0,0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '16px' }}>Cardio min/week</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={activityData.filter(d => d.cardio)}>
                  <CartesianGrid stroke="var(--border)" />
                  <XAxis dataKey="week" tick={{ fill: 'var(--text-dim)', fontSize: 9 }} />
                  <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 9 }} />
                  <Tooltip {...CHART_TOOLTIP} formatter={(v: any) => [`${v} min`, 'Cardio']} />
                  <Bar dataKey="cardio" fill="#888" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '16px' }}>Voedingsadherentie (1–5)</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={activityData.filter(d => d.adh)}>
                  <CartesianGrid stroke="var(--border)" />
                  <XAxis dataKey="week" tick={{ fill: 'var(--text-dim)', fontSize: 9 }} />
                  <YAxis domain={[0, 5]} tick={{ fill: 'var(--text-dim)', fontSize: 9 }} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Line type="monotone" dataKey="adh" stroke="#22C55E" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '16px' }}>Trainingsmotivatie & slaap (1–5)</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={activityData}>
                  <CartesianGrid stroke="var(--border)" />
                  <XAxis dataKey="week" tick={{ fill: 'var(--text-dim)', fontSize: 9 }} />
                  <YAxis domain={[0, 5]} tick={{ fill: 'var(--text-dim)', fontSize: 9 }} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Line type="monotone" dataKey="mot" stroke="#F97316" strokeWidth={2} dot={false} name="Motivatie" />
                  <Line type="monotone" dataKey="sleep" stroke="#004aad" strokeWidth={2} dot={false} name="Slaap" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Log table */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-2)' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Dagelijkse logs</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    {['Datum', 'Gewicht', 'Water', 'Stappen', 'Cardio', 'Voeding', 'Motivatie', 'Slaap'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: 'var(--text-faint)', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 50).map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--surface-2)' }}>
                      <td style={{ padding: '9px 14px', color: 'var(--text-muted)' }}>{formatDate(l.log_date)}</td>
                      <td style={{ padding: '9px 14px' }}>{l.weight_kg ? `${l.weight_kg} kg` : '—'}</td>
                      <td style={{ padding: '9px 14px', color: 'var(--text-dim)' }}>{l.water_liters ? `${l.water_liters}L` : '—'}</td>
                      <td style={{ padding: '9px 14px', color: 'var(--text-dim)' }}>{l.steps?.toLocaleString() ?? '—'}</td>
                      <td style={{ padding: '9px 14px', color: 'var(--text-dim)' }}>{l.cardio_minutes ? `${l.cardio_minutes}m` : '—'}</td>
                      <td style={{ padding: '9px 14px' }}>{l.nutrition_adherence ? `${l.nutrition_adherence}/5` : '—'}</td>
                      <td style={{ padding: '9px 14px' }}>{l.motivation_score ? `${l.motivation_score}/5` : '—'}</td>
                      <td style={{ padding: '9px 14px', color: 'var(--text-dim)' }}>{l.sleep_quality ? `${l.sleep_quality}/5` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── BODY / SKINFOLDS ── */}
      {tab === 'body' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setShowSkinfoldModal(true)} style={{
              background: '#004aad', color: '#ffffff', padding: '8px 18px', borderRadius: '8px',
              border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            }}>
              + Nieuwe meting
            </button>
          </div>

          {bfData.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '16px' }}>BF% verloop</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={bfData}>
                      <CartesianGrid stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-dim)', fontSize: 9 }} />
                      <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 9 }} />
                      <Tooltip {...CHART_TOOLTIP} formatter={(v: any) => [`${v}%`, 'BF%']} />
                      <Line type="monotone" dataKey="bf" stroke="#888" strokeWidth={2.5} dot={{ r: 3, fill: '#888' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '16px' }}>Huidplooisom (mm)</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={bfData}>
                      <CartesianGrid stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-dim)', fontSize: 9 }} />
                      <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 9 }} />
                      <Tooltip {...CHART_TOOLTIP} formatter={(v: any) => [`${v} mm`, 'Som']} />
                      <Bar dataKey="sum" fill="#888" radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)' }}>
                      {['Datum', 'Biceps', 'Triceps', 'Subscapulair', 'Suprailiacaal', 'Som (mm)', 'BF%'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-faint)', fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...skinfolds].reverse().map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--surface-2)' }}>
                        <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{formatDate(s.measured_at)}</td>
                        <td style={{ padding: '10px 16px' }}>{s.biceps_mm}</td>
                        <td style={{ padding: '10px 16px' }}>{s.triceps_mm}</td>
                        <td style={{ padding: '10px 16px' }}>{s.subscapular_mm}</td>
                        <td style={{ padding: '10px 16px' }}>{s.suprailiac_mm}</td>
                        <td style={{ padding: '10px 16px' }}>{s.sum_mm}</td>
                        <td style={{ padding: '10px 16px', fontWeight: 700 }}>{s.bf_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-faint)' }}>
              <p>Nog geen huidplooimeting</p>
              <button onClick={() => setShowSkinfoldModal(true)} style={{ marginTop: '12px', background: '#004aad', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem' }}>
                Eerste meting toevoegen
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── CHECK-INS ── */}
      {tab === 'checkin' && (
        <div>
          {checkins.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-faint)' }}>
              <p>Nog geen check-ins van deze klant</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {checkins.map(c => (
                <div key={c.id} style={{ background: 'var(--surface)', border: `1px solid ${c.coach_response ? 'var(--border)' : 'var(--border-2)'}`, borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Week {c.week_number}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>{formatDate(c.checkin_date)}</p>
                    </div>
                    {!c.coach_response ? (
                      <button onClick={() => setCheckinToAnswer(c)} style={{
                        background: '#004aad', color: '#ffffff', border: 'none', padding: '6px 14px',
                        borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                      }}>
                        Beantwoorden
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#22C55E' }}>Beantwoord</span>
                    )}
                  </div>
                  <div className="cols-2" style={{ gap: '12px', fontSize: '0.82rem' }}>
                    {[
                      ['Gym prestaties', c.gym_performance],
                      ['Herstel', c.recovery],
                      ['Stress', c.stress_notes],
                      ['Algemene notities', c.general_notes],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <div key={label as string}>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label as string}</p>
                        <p style={{ color: 'var(--text-muted)' }}>{value as string}</p>
                      </div>
                    ))}
                  </div>
                  {c.coach_response && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Coach respons</p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{c.coach_response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MEAL PLAN ── */}
      {tab === 'mealplan' && (
        <MealPlanEditor clientId={client.id} initialPlan={mealPlan} />
      )}

      {/* ── TRAINING ── */}
      {tab === 'training' && (
        <WorkoutPlanEditor clientId={client.id} initialSchemas={trainingSchemas} />
      )}

      {/* ── SUPPLEMENTEN ── */}
      {tab === 'supplementen' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setAddingSupp(true)} style={{
              background: '#004aad', color: '#ffffff', padding: '8px 18px', borderRadius: '8px',
              border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            }}>
              + Supplement toevoegen
            </button>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#004aad' }}>
                    {['SUPPLEMENT', 'DOSIS', 'WANNEER?', 'NOTITIES / VOORDELEN', ''].map(h => (
                      <th key={h} style={{ ...thStyle, textAlign: h === '' ? 'center' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {supplements.length === 0 && !addingSupp ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-faint)' }}>
                        Nog geen supplementen toegevoegd
                      </td>
                    </tr>
                  ) : (
                    supplements.map((s, i) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--surface-2)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                        <td style={{ padding: '6px 10px', minWidth: '160px' }}>
                          <InlineTextCell value={s.name} onSave={v => updateSupplement(s.id, 'name', v || null)} />
                        </td>
                        <td style={{ padding: '6px 10px', minWidth: '80px' }}>
                          <InlineTextCell value={s.dose} placeholder="—" onSave={v => updateSupplement(s.id, 'dose', v || null)} />
                        </td>
                        <td style={{ padding: '6px 10px', minWidth: '100px' }}>
                          <InlineTextCell value={s.timing} placeholder="—" onSave={v => updateSupplement(s.id, 'timing', v || null)} />
                        </td>
                        <td style={{ padding: '6px 10px', minWidth: '200px' }}>
                          <InlineTextCell value={s.notes} placeholder="—" onSave={v => updateSupplement(s.id, 'notes', v || null)} />
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                          <button
                            onClick={() => deleteSupplement(s.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: '1rem', lineHeight: 1, padding: '2px 6px' }}
                            title="Verwijderen"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {addingSupp && (
                    <tr style={{ borderBottom: '1px solid var(--surface-2)', background: 'var(--surface-2)' }}>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          autoFocus
                          value={newSupp.name}
                          onChange={e => setNewSupp(p => ({ ...p, name: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') addSupplement(); if (e.key === 'Escape') setAddingSupp(false) }}
                          placeholder="Naam supplement"
                          style={{ width: '100%', border: 'none', borderBottom: '2px solid #004aad', background: 'transparent', color: 'var(--text)', fontSize: '0.82rem', outline: 'none', padding: '2px 0' }}
                        />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          value={newSupp.dose}
                          onChange={e => setNewSupp(p => ({ ...p, dose: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') addSupplement(); if (e.key === 'Escape') setAddingSupp(false) }}
                          placeholder="bv. 10gr"
                          style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: '0.82rem', outline: 'none', padding: '2px 0' }}
                        />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          value={newSupp.timing}
                          onChange={e => setNewSupp(p => ({ ...p, timing: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') addSupplement(); if (e.key === 'Escape') setAddingSupp(false) }}
                          placeholder="bv. Intra, 's morgens"
                          style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: '0.82rem', outline: 'none', padding: '2px 0' }}
                        />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          value={newSupp.notes}
                          onChange={e => setNewSupp(p => ({ ...p, notes: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') addSupplement(); if (e.key === 'Escape') setAddingSupp(false) }}
                          placeholder="Notities / voordelen"
                          style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: '0.82rem', outline: 'none', padding: '2px 0' }}
                        />
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button onClick={addSupplement} style={{ background: '#004aad', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>✓</button>
                          <button onClick={() => setAddingSupp(false)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENTS ── */}
      {tab === 'payments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setShowPaymentModal(true)} style={{
              background: '#004aad', color: '#ffffff', padding: '8px 18px', borderRadius: '8px',
              border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            }}>
              + Betaling toevoegen
            </button>
          </div>

          {payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-faint)' }}>
              <p>Nog geen betalingen geregistreerd</p>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    {['Pakket', 'Bedrag', 'Betaaldatum', 'Vervaldatum', 'Status', 'Notities'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-faint)', fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => {
                    const ps = getPaymentStatus(p)
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--surface-2)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>{PACKAGES[p.package].label}</td>
                        <td style={{ padding: '12px 16px' }}>€{p.amount}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{formatDate(p.payment_date)}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{formatDate(p.expiry_date)}</td>
                        <td style={{ padding: '12px 16px', color: ps.color, fontWeight: 600 }}>{ps.label}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-faint)' }}>{p.notes ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PROFILE ── */}
      {tab === 'profile' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setShowProfileEdit(true)} style={{
              background: '#004aad', color: '#ffffff', padding: '8px 18px', borderRadius: '8px',
              border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            }}>
              Profiel bewerken
            </button>
          </div>

          {/* Account sectie */}
          <AccountSection client={client} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            ['Naam', client.full_name],
            ['E-mail', client.email],
            ['Telefoon', client.phone],
            ['Geboortedatum', client.dob],
            ['Geslacht', client.gender],
            ['Lengte', client.height_cm ? `${client.height_cm} cm` : null],
            ['Startgewicht', client.start_weight_kg ? `${client.start_weight_kg} kg` : null],
            ['Activiteitsniveau', client.activity_level],
            ['Trainingsdagen/week', client.training_days_per_week?.toString()],
            ['Kortetermijndoel', client.short_term_goal],
            ['Langetermijndoel', client.long_term_goal],
            ['Medische info', client.medical_conditions],
            ['Blessures', client.injuries],
            ['Medicatie', client.medications],
            ['Huidig eetpatroon', client.current_diet],
            ['Voedselallergieën', client.food_allergies],
            ['Coach notities', client.notes],
          ].map(([label, value]) => value ? (
            <div key={label as string} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>{label as string}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{value as string}</p>
            </div>
          ) : null)}
          </div>
        </div>
      )}

      {/* Modals */}
      {showPaymentModal && (
        <PaymentModal clientId={client.id} onClose={() => setShowPaymentModal(false)} />
      )}
      {showSkinfoldModal && (
        <SkinfoldModal clientId={client.id} onClose={() => setShowSkinfoldModal(false)} />
      )}
      {checkinToAnswer && (
        <CheckinResponseModal checkin={checkinToAnswer} onClose={() => setCheckinToAnswer(null)} />
      )}
      {showProfileEdit && (
        <ProfileEditModal client={client} onClose={() => setShowProfileEdit(false)} />
      )}
    </>
  )
}
