'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { DailyLog } from '@/lib/types'

const TOOLTIP_STYLE = {
  contentStyle: { background: 'var(--surface-2)', border: '1px solid var(--border-2)', borderRadius: '8px', fontSize: '0.78rem' },
  labelStyle: { color: 'var(--text-dim)' },
  itemStyle: { color: 'var(--text)' },
}

function MiniChart({ data, dataKey, label, color, unit }: {
  data: any[]
  dataKey: string
  label: string
  color: string
  unit: string
}) {
  const filtered = data.filter(d => d[dataKey] != null)
  if (filtered.length < 2) return null
  const values = filtered.map(d => d[dataKey] as number)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const latest = values[values.length - 1]
  const first = values[0]
  const delta = latest - first

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <p style={{ fontSize: '0.72rem', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</p>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFF' }}>{latest}{unit}</span>
          {delta !== 0 && (
            <span style={{ fontSize: '0.72rem', marginLeft: '6px', color: delta < 0 ? '#22C55E' : '#F97316' }}>
              {delta > 0 ? '+' : ''}{delta.toFixed(dataKey === 'weight_kg' ? 1 : 0)}{unit}
            </span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={70}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis dataKey="log_date" hide />
          <YAxis domain={[min * 0.99, max * 1.01]} hide />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(v: any) => [`${v}${unit}`, label]}
            labelFormatter={(l) => l}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: color }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function ClientCharts({ logs }: { logs: DailyLog[] }) {
  const hasWeight = logs.some(l => l.weight_kg != null)
  const hasSteps = logs.some(l => l.steps != null)
  const hasEnergy = logs.some(l => l.energy_levels != null)
  const hasSleep = logs.some(l => l.sleep_quality != null)

  const count = [hasWeight, hasSteps, hasEnergy, hasSleep].filter(Boolean).length
  if (count === 0) return null

  const cols = count === 1 ? '1fr' : count === 2 ? '1fr 1fr' : count === 3 ? '1fr 1fr 1fr' : '1fr 1fr'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '24px' }}>
      {hasWeight && <MiniChart data={logs} dataKey="weight_kg" label="Gewicht" color="#004aad" unit=" kg" />}
      {hasSteps && <MiniChart data={logs} dataKey="steps" label="Stappen" color="#22C55E" unit="" />}
      {hasEnergy && <MiniChart data={logs} dataKey="energy_levels" label="Energie" color="#F59E0B" unit="/5" />}
      {hasSleep && <MiniChart data={logs} dataKey="sleep_quality" label="Slaap" color="#8B5CF6" unit="/5" />}
    </div>
  )
}
