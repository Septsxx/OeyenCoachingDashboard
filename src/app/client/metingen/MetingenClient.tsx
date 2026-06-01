'use client'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type DailyLogPoint = { log_date: string; weight_kg: number | null; steps: number | null }
type SkinfoldPoint = { measured_at: string; bf_pct: number | null }

const TOOLTIP_STYLE = {
  contentStyle: { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.78rem' },
  labelStyle: { color: 'var(--text-dim)' },
  itemStyle: { color: 'var(--text)' },
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
      <div style={{ width: '100%', height: 120, overflow: 'hidden' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis domain={[min * 0.985, max * 1.015]} hide />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(v: any) => [`${v} kg`, 'Gewicht']}
              labelFormatter={(label: any) => formatDateShort(String(label))}
            />
            <Line type="monotone" dataKey="weight" stroke="#004aad" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#004aad' }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
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
        <div style={{ width: '100%', height: 80, overflow: 'hidden' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis domain={[Math.max(0, min * 0.9), max * 1.1]} hide />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v: any) => [v.toLocaleString('nl-BE'), 'Stappen']}
                labelFormatter={(label: any) => formatDateShort(String(label))}
              />
              <Line type="monotone" dataKey="steps" stroke="#22C55E" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#22C55E' }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
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
  const chartData = bfLogs.map(s => ({ date: s.measured_at.slice(0, 10), bf: s.bf_pct }))

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
      <div style={{ width: '100%', height: 120, overflow: 'hidden' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis domain={[min * 0.95, max * 1.05]} hide />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(v: any) => [`${v.toFixed(1)}%`, 'BF%']}
              labelFormatter={(label: any) => formatDateShort(String(label))}
            />
            <Line type="monotone" dataKey="bf" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3, fill: '#8B5CF6' }} activeDot={{ r: 4 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  )
}

const supabase = createClient()

export default function MetingenClient() {
  const router = useRouter()
  const [clientId, setClientId] = useState<string | null>(null)
  const [dailyLogs, setDailyLogs] = useState<DailyLogPoint[]>([])
  const [skinfolds, setSkinfolds] = useState<SkinfoldPoint[]>([])

  useEffect(() => {
    async function loadClient() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      let id: string | null = null
      const { data: byUserId } = await supabase.from('clients').select('id').eq('user_id', user.id).maybeSingle()
      if (byUserId) {
        id = byUserId.id
      } else if (user.email) {
        const { data: byEmail } = await supabase.from('clients').select('id').eq('email', user.email).maybeSingle()
        if (byEmail) id = byEmail.id
      }
      if (!id) { router.push('/login'); return }
      setClientId(id)
    }
    loadClient()
  }, [])

  useEffect(() => {
    if (!clientId) return
    async function fetchData() {
      const [{ data: logs }, { data: skins }] = await Promise.all([
        supabase.from('daily_logs').select('log_date, weight_kg, steps').eq('client_id', clientId)
          .order('log_date', { ascending: true }).limit(180),
        supabase.from('skinfold_measurements').select('measured_at, bf_pct').eq('client_id', clientId)
          .order('measured_at', { ascending: true }).limit(52),
      ])
      setDailyLogs(logs ?? [])
      setSkinfolds(skins ?? [])
    }
    fetchData()
  }, [clientId])

  return (
    <div>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px' }}>Metingen</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <WeightSection logs={dailyLogs} />
        <StepsSection logs={dailyLogs} />
        <BFSection skinfolds={skinfolds} />
      </div>
    </div>
  )
}
