'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BodyMeasurement } from '@/lib/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type DailyLogPoint = { log_date: string; weight_kg: number | null; steps: number | null }
type SkinfoldPoint = { measured_at: string; bf_pct: number | null }
type Measurement = BodyMeasurement

const CIRC_FIELDS: { key: keyof Measurement; label: string; unit: string; step: string }[] = [
  { key: 'waist_cm', label: 'Taille', unit: 'cm', step: '0.5' },
  { key: 'hips_cm', label: 'Heupen', unit: 'cm', step: '0.5' },
  { key: 'chest_cm', label: 'Borst', unit: 'cm', step: '0.5' },
  { key: 'arm_cm', label: 'Arm', unit: 'cm', step: '0.5' },
  { key: 'thigh_cm', label: 'Dij', unit: 'cm', step: '0.5' },
]

const CHART_COLORS: Record<string, string> = {
  waist_cm: '#F97316',
  hips_cm: '#8B5CF6',
  chest_cm: '#22C55E',
  arm_cm: '#F59E0B',
  thigh_cm: '#EC4899',
}

const TOOLTIP_STYLE = {
  contentStyle: { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.78rem' },
  labelStyle: { color: 'var(--text-dim)' },
  itemStyle: { color: 'var(--text)' },
}

type FormState = {
  measured_date: string
  waist_cm: string
  hips_cm: string
  chest_cm: string
  arm_cm: string
  thigh_cm: string
  notes: string
}

function emptyForm(): FormState {
  return {
    measured_date: new Date().toISOString().slice(0, 10),
    waist_cm: '', hips_cm: '', chest_cm: '', arm_cm: '', thigh_cm: '', notes: '',
  }
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--surface-2)' }}>
        <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>{title}</p>
      </div>
      <div style={{ padding: '16px' }}>{children}</div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <p style={{ fontSize: '0.82rem', color: 'var(--text-faint)', textAlign: 'center', padding: '16px 0' }}>{text}</p>
  )
}

function WeightSection({ logs }: { logs: DailyLogPoint[] }) {
  const weightLogs = logs.filter(l => l.weight_kg != null)
  if (weightLogs.length < 2) return (
    <SectionCard title="Gewichtsverloop">
      <EmptyState text="Vul je gewicht in bij de dagelijkse log om je verloop te zien." />
    </SectionCard>
  )

  const values = weightLogs.map(l => l.weight_kg as number)
  const latest = values[values.length - 1]
  const first = values[0]
  const delta = latest - first
  const min = Math.min(...values)
  const max = Math.max(...values)

  const chartData = weightLogs.map(l => ({ date: l.log_date, weight: l.weight_kg }))

  return (
    <SectionCard title="Gewichtsverloop">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{weightLogs.length} metingen</span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>{latest} kg</span>
          {delta !== 0 && (
            <span style={{ fontSize: '0.78rem', marginLeft: '8px', color: delta < 0 ? '#22C55E' : '#F97316', fontWeight: 600 }}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg
            </span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis dataKey="date" hide />
          <YAxis domain={[min * 0.985, max * 1.015]} hide />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(v: any) => [`${v} kg`, 'Gewicht']}
            labelFormatter={formatDateShort}
          />
          <Line type="monotone" dataKey="weight" stroke="#004aad" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#004aad' }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </SectionCard>
  )
}

function StepsSection({ logs }: { logs: DailyLogPoint[] }) {
  const stepsLogs = logs.filter(l => l.steps != null)
  if (stepsLogs.length === 0) return (
    <SectionCard title="Gemiddelde stappen per dag">
      <EmptyState text="Vul je stappen in bij de dagelijkse log om je gemiddelde te zien." />
    </SectionCard>
  )

  const values = stepsLogs.map(l => l.steps as number)
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)

  const last7 = stepsLogs.slice(-7)
  const avg7 = last7.length > 0
    ? Math.round(last7.map(l => l.steps as number).reduce((a, b) => a + b, 0) / last7.length)
    : null

  const chartData = stepsLogs.map(l => ({ date: l.log_date, steps: l.steps }))
  const min = Math.min(...values)
  const max = Math.max(...values)

  return (
    <SectionCard title="Gemiddelde stappen per dag">
      <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>Afgelopen 7 dagen</p>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: avg7 && avg7 >= 8000 ? '#22C55E' : avg7 && avg7 >= 5000 ? '#F59E0B' : '#F97316' }}>
            {avg7 != null ? avg7.toLocaleString('nl-BE') : '—'}
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>Gemiddeld totaal</p>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>{avg.toLocaleString('nl-BE')}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>Aantal logs</p>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>{stepsLogs.length}</p>
        </div>
      </div>
      {stepsLogs.length >= 2 && (
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis domain={[Math.max(0, min * 0.9), max * 1.1]} hide />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(v: any) => [v.toLocaleString('nl-BE'), 'Stappen']}
              labelFormatter={formatDateShort}
            />
            <Line type="monotone" dataKey="steps" stroke="#22C55E" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#22C55E' }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  )
}

function BFSection({ skinfolds }: { skinfolds: SkinfoldPoint[] }) {
  const bfLogs = skinfolds.filter(s => s.bf_pct != null)
  if (bfLogs.length < 2) return (
    <SectionCard title="Lichaamssamenstelling: BF% verloop">
      <EmptyState text="Nog onvoldoende vetmeting data beschikbaar." />
    </SectionCard>
  )

  const values = bfLogs.map(s => s.bf_pct as number)
  const latest = values[values.length - 1]
  const first = values[0]
  const delta = latest - first
  const min = Math.min(...values)
  const max = Math.max(...values)

  const chartData = bfLogs.map(s => ({
    date: s.measured_at.slice(0, 10),
    bf: s.bf_pct,
  }))

  return (
    <SectionCard title="Lichaamssamenstelling: BF% verloop">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{bfLogs.length} metingen</span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>{latest.toFixed(1)}%</span>
          {delta !== 0 && (
            <span style={{ fontSize: '0.78rem', marginLeft: '8px', color: delta < 0 ? '#22C55E' : '#F97316', fontWeight: 600 }}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis dataKey="date" hide />
          <YAxis domain={[min * 0.95, max * 1.05]} hide />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(v: any) => [`${v.toFixed(1)}%`, 'BF%']}
            labelFormatter={formatDateShort}
          />
          <Line type="monotone" dataKey="bf" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3, fill: '#8B5CF6' }} activeDot={{ r: 4 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </SectionCard>
  )
}

function MiniCircChart({ data, dataKey, label, color, unit }: { data: any[]; dataKey: string; label: string; color: string; unit: string }) {
  const filtered = data.filter(d => d[dataKey] != null)
  if (filtered.length < 2) return null
  const values = filtered.map(d => d[dataKey] as number)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const latest = values[values.length - 1]
  const delta = latest - values[0]

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</p>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>{latest}{unit}</span>
          {delta !== 0 && (
            <span style={{ fontSize: '0.68rem', marginLeft: '4px', color: delta < 0 ? '#22C55E' : '#F97316' }}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={50}>
        <LineChart data={[...filtered].reverse()} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
          <XAxis dataKey="measured_date" hide />
          <YAxis domain={[min * 0.98, max * 1.02]} hide />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}${unit}`, label]} labelFormatter={formatDateShort} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 2, fill: color }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function MetingenClient({
  clientId,
  initialMeasurements,
  dailyLogs,
  skinfolds,
}: {
  clientId: string
  initialMeasurements: Measurement[]
  dailyLogs: DailyLogPoint[]
  skinfolds: SkinfoldPoint[]
}) {
  const supabase = createClient()
  const [measurements, setMeasurements] = useState(initialMeasurements)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function setField(key: keyof FormState, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const payload: any = {
      client_id: clientId,
      measured_date: form.measured_date,
      notes: form.notes.trim() || null,
    }
    for (const f of CIRC_FIELDS) {
      const v = parseFloat(form[f.key as keyof FormState] as string)
      payload[f.key] = isNaN(v) ? null : v
    }
    const { data, error } = await supabase
      .from('body_measurements')
      .upsert(payload, { onConflict: 'client_id,measured_date' })
      .select()
      .single()
    setSaving(false)
    if (!error && data) {
      setMeasurements(prev => {
        const without = prev.filter(m => m.measured_date !== data.measured_date)
        return [data, ...without].sort((a, b) => b.measured_date.localeCompare(a.measured_date))
      })
      setForm(emptyForm())
      setShowForm(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const hasCircCharts = CIRC_FIELDS.some(f => measurements.filter(m => m[f.key] != null).length >= 2)
  const chartData = [...measurements].reverse()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {saved && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          background: '#22C55E', color: '#fff', padding: '10px 20px', borderRadius: '99px',
          fontSize: '0.82rem', fontWeight: 600, zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
        }}>
          Meting opgeslagen
        </div>
      )}
      {/* Weight trend */}
      <WeightSection logs={dailyLogs} />

      {/* Steps */}
      <StepsSection logs={dailyLogs} />

      {/* BF% */}
      <BFSection skinfolds={skinfolds} />

      {/* Circumference measurements */}
      <SectionCard title="Lichaamsmaten">
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: '#004aad', color: '#ffffff',
              border: 'none', borderRadius: '8px', padding: '8px 16px',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              marginBottom: hasCircCharts ? '16px' : '0',
            }}
          >
            + Meting toevoegen
          </button>
        )}

        {showForm && (
          <div style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '12px' }}>Nieuwe meting</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Datum</label>
                <input type="date" value={form.measured_date} onChange={e => setField('measured_date', e.target.value)} style={inputStyle} />
              </div>
              {CIRC_FIELDS.map(f => (
                <div key={f.key as string}>
                  <label style={labelStyle}>{f.label} ({f.unit})</label>
                  <input
                    type="number" step={f.step} min="0"
                    value={form[f.key as keyof FormState] as string}
                    onChange={e => setField(f.key as keyof FormState, e.target.value)}
                    placeholder="—"
                    style={inputStyle}
                  />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Notities</label>
                <input type="text" value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Optioneel" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSave} disabled={saving || !form.measured_date}
                style={{ background: '#004aad', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Opslaan…' : 'Opslaan'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                Annuleren
              </button>
            </div>
          </div>
        )}

        {hasCircCharts && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {CIRC_FIELDS.map(f => (
              <MiniCircChart
                key={f.key as string}
                data={chartData}
                dataKey={f.key as string}
                label={f.label}
                color={CHART_COLORS[f.key as string]}
                unit={` ${f.unit}`}
              />
            ))}
          </div>
        )}

        {!hasCircCharts && !showForm && measurements.length === 0 && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-faint)', marginTop: '12px' }}>Nog geen omtrekmetingen. Voeg je eerste meting toe!</p>
        )}
      </SectionCard>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '0.85rem',
  color: 'var(--text)',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.68rem',
  color: 'var(--text-faint)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  marginBottom: '4px',
}
