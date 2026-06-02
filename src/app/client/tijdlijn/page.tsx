import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { DailyLog, WeeklyTimeline, PhaseKey } from '@/lib/types'
import { DEFAULT_PHASE_LABELS, PHASE_COLORS } from '@/lib/types'
import { formatDateShort } from '@/lib/ui'

export const dynamic = 'force-dynamic'

const thStyle: React.CSSProperties = {
  padding: '8px 12px', textAlign: 'left', color: '#ffffff', fontWeight: 600,
  fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap',
}

export default async function TijdlijnPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clientRow } = await supabase
    .from('clients')
    .select('id, coach_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!clientRow) redirect('/login?error=no_profile')

  const [
    { data: timelineRaw },
    { data: logsRaw },
    { data: coachSettings },
  ] = await Promise.all([
    supabase.from('weekly_timeline').select('*').eq('client_id', clientRow.id).order('week_number') as unknown as Promise<{ data: WeeklyTimeline[] | null }>,
    supabase.from('daily_logs').select('log_date, week_number, weight_kg, steps, cardio_minutes').eq('client_id', clientRow.id).order('log_date') as unknown as Promise<{ data: Pick<DailyLog, 'log_date' | 'week_number' | 'weight_kg' | 'steps' | 'cardio_minutes'>[] | null }>,
    clientRow.coach_id
      ? supabase.from('coach_settings').select('phase_labels').eq('coach_id', clientRow.coach_id).single()
      : Promise.resolve({ data: null }),
  ])

  const phaseLabels: Partial<Record<PhaseKey, string>> = coachSettings?.phase_labels ?? {}
  const phaseLabel = (key: PhaseKey) => phaseLabels[key] ?? DEFAULT_PHASE_LABELS[key]

  const timelineMap = new Map<number, WeeklyTimeline>()
  timelineRaw?.forEach(t => timelineMap.set(t.week_number, t))

  const logs = logsRaw ?? []
  const byWeek = new Map<number, { dates: string[]; weights: number[]; steps: number[]; cardio: number[] }>()
  logs.forEach(l => {
    const w = l.week_number ?? 0
    if (!byWeek.has(w)) byWeek.set(w, { dates: [], weights: [], steps: [], cardio: [] })
    const d = byWeek.get(w)!
    d.dates.push(l.log_date)
    if (l.weight_kg) d.weights.push(l.weight_kg)
    if (l.steps) d.steps.push(l.steps)
    if (l.cardio_minutes) d.cardio.push(l.cardio_minutes)
  })

  const allWeeks = new Set<number>([
    ...Array.from(byWeek.keys()),
    ...Array.from(timelineMap.keys()),
  ])
  const sorted = Array.from(allWeeks).sort((a, b) => a - b)

  const rows = sorted.map((weekNum, i) => {
    const d = byWeek.get(weekNum)
    const avgBw = d && d.weights.length ? +(d.weights.reduce((a, b) => a + b) / d.weights.length).toFixed(1) : null
    const prevWeekNum = i > 0 ? sorted[i - 1] : null
    const prevD = prevWeekNum != null ? byWeek.get(prevWeekNum) : null
    const prevAvgBw = prevD && prevD.weights.length ? +(prevD.weights.reduce((a, b) => a + b) / prevD.weights.length).toFixed(1) : null
    const bwDelta = avgBw !== null && prevAvgBw !== null ? +(avgBw - prevAvgBw).toFixed(1) : null
    const weekStart = d && d.dates.length ? [...d.dates].sort()[0] : null
    const avgSteps = d && d.steps.length ? Math.round(d.steps.reduce((a, b) => a + b) / d.steps.length) : null
    const totalCardio = d && d.cardio.length ? d.cardio.reduce((a, b) => a + b) : null
    const meta = timelineMap.get(weekNum)
    return { weekNum, weekStart, avgBw, bwDelta, avgSteps, totalCardio, meta }
  })

  return (
    <div>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '4px' }}>Tijdlijn</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: '24px' }}>Overzicht van jouw coaching traject per week</p>

      {rows.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.9rem' }}>
          Nog geen tijdlijndata beschikbaar
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: '#004aad' }}>
                  <th rowSpan={2} style={thStyle}>WEEK</th>
                  <th rowSpan={2} style={thStyle}>DATUM</th>
                  <th rowSpan={2} style={thStyle}>FASE</th>
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
                {rows.map(row => {
                  const phase = row.meta?.phase ?? null
                  const colors = phase ? PHASE_COLORS[phase] : null
                  const deltaColor = row.bwDelta === null ? 'var(--text-faint)' : row.bwDelta < 0 ? '#16a34a' : row.bwDelta > 0 ? '#dc2626' : 'var(--text-muted)'
                  return (
                    <tr key={row.weekNum} style={{ borderBottom: '1px solid var(--surface-2)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#004aad', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {row.weekNum}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {row.weekStart ? formatDateShort(row.weekStart) : '—'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {phase && colors ? (
                          <span style={{ display: 'inline-block', background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {phaseLabel(phase)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-faint)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>
                        {row.avgBw ?? '—'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: deltaColor, fontWeight: 500 }}>
                        {row.bwDelta === null ? '—' : row.bwDelta > 0 ? `+${row.bwDelta}` : row.bwDelta}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-dim)', textAlign: 'right' }}>
                        {row.meta?.cardio_target ?? (row.totalCardio ? `${row.totalCardio}m` : '—')}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-dim)', textAlign: 'right' }}>
                        {row.meta?.steps_target
                          ? row.meta.steps_target.toLocaleString('nl-BE')
                          : row.avgSteps
                            ? row.avgSteps.toLocaleString('nl-BE')
                            : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-dim)', maxWidth: '200px' }}>
                        {row.meta?.notes ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
