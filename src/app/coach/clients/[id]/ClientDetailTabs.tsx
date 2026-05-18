'use client'
import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import type { Client, Payment, DailyLog, SkinfoldMeasurement, WeeklyCheckin, MealPlan, TrainingSchema, TrainingExercise } from '@/lib/types'
import { PACKAGES } from '@/lib/types'
import { getPaymentStatus } from '@/lib/payment-utils'
import { CHART_TOOLTIP, formatDate, formatDateShort } from '@/lib/ui'
import PaymentModal from './PaymentModal'
import SkinfoldModal from './SkinfoldModal'
import CheckinResponseModal from './CheckinResponseModal'
import MealPlanEditor from './MealPlanEditor'
import WorkoutPlanEditor from './WorkoutPlanEditor'

const TABS = [
  { id: 'overview', label: 'Overzicht' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'body', label: 'Lichaamssamenstelling' },
  { id: 'checkin', label: 'Check-ins' },
  { id: 'mealplan', label: 'Voedingsplan' },
  { id: 'training', label: 'Trainingsschema' },
  { id: 'payments', label: 'Betalingen' },
  { id: 'profile', label: 'Profiel' },
]

export default function ClientDetailTabs({
  client, payments, logs, skinfolds, checkins, mealPlan, trainingSchemas, initialTab,
}: {
  client: Client
  payments: Payment[]
  logs: DailyLog[]
  skinfolds: SkinfoldMeasurement[]
  checkins: WeeklyCheckin[]
  mealPlan: MealPlan | null
  trainingSchemas: (TrainingSchema & { exercises: TrainingExercise[] })[]
  initialTab: string
}) {
  const [tab, setTab] = useState(initialTab)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSkinfoldModal, setShowSkinfoldModal] = useState(false)
  const [checkinToAnswer, setCheckinToAnswer] = useState<WeeklyCheckin | null>(null)

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Huidig gewicht', value: currentWeight ? `${currentWeight} kg` : '—' },
              { label: 'Startgewicht', value: client.start_weight_kg ? `${client.start_weight_kg} kg` : '—' },
              { label: 'Huidig BF%', value: skinfolds.length ? `${skinfolds[skinfolds.length - 1].bf_pct}%` : '—' },
              { label: 'Betaling', value: paymentStatus.label, color: paymentStatus.color },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{kpi.label}</p>
                <p style={{ fontSize: '1.6rem', fontWeight: 700, color: kpi.color ?? 'var(--text)' }}>{kpi.value}</p>
              </div>
            ))}
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.82rem' }}>
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
    </>
  )
}
