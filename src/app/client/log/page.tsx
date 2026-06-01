'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { LABEL, BTN_PRIMARY, formatDate } from '@/lib/ui'
import type { DailyLog } from '@/lib/types'

const todayStr = format(new Date(), 'yyyy-MM-dd')

function calcSleepMinutes(sleepTime: string, wakeTime: string): number | null {
  if (!sleepTime || !wakeTime) return null
  const [sh, sm] = sleepTime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  if (isNaN(sh) || isNaN(sm) || isNaN(wh) || isNaN(wm)) return null
  let diff = (wh * 60 + wm) - (sh * 60 + sm)
  if (diff < 0) diff += 24 * 60
  return diff
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '18px' }}>{title}</p>
      {children}
    </div>
  )
}

function ScoreSelect({ label, value, onChange, inline }: { label: string; value: string; onChange: (v: string) => void; inline?: boolean }) {
  return (
    <div>
      <label style={LABEL}>{label}{inline ? ' (1–5)' : ''}</label>
      {!inline && <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginBottom: '8px', marginTop: '-4px' }}>1–5</p>}
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">—</option>
        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  )
}

const emptyForm = {
  weight_kg: '', water_liters: '', rhr: '',
  nutrition_adherence: '', hunger_score: '', off_plan_meals: '', stool_count: '',
  steps: '', cardio_minutes: '', resistance_training: '',
  strength_score: '', motivation_score: '', training_notes: '',
  sleep_time: '', wake_time: '',
  sleep_quality: '', sleep_notes: '',
  energy_levels: '', stress_levels: '',
}

export default function DailyLogPage() {
  const supabase = createClient()
  const router = useRouter()
  const [tab, setTab] = useState<'log' | 'recent'>('log')
  const [clientId, setClientId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [existingId, setExistingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([])

  function hasData(l: DailyLog): boolean {
    return !!(l.weight_kg || l.water_liters || l.rhr || l.nutrition_adherence ||
      l.hunger_score || l.off_plan_meals || l.stool_count || l.steps ||
      l.cardio_minutes || l.resistance_training != null || l.strength_score ||
      l.motivation_score || l.training_notes || l.sleep_time || l.wake_time ||
      l.sleep_quality || l.sleep_notes || l.energy_levels || l.stress_levels)
  }
  const [showAllLogs, setShowAllLogs] = useState(false)

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  useEffect(() => {
    async function loadClient() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      let clientId: string | null = null
      const { data: byUserId } = await supabase.from('clients').select('id').eq('user_id', user.id).maybeSingle()
      if (byUserId) {
        clientId = byUserId.id
      } else if (user.email) {
        const { data: byEmail } = await supabase.from('clients').select('id').eq('email', user.email).maybeSingle()
        if (byEmail) {
          await supabase.from('clients').update({ user_id: user.id }).eq('id', byEmail.id)
          clientId = byEmail.id
        }
      }
      if (!clientId) { router.push('/login'); return }
      setClientId(clientId)
      const { data: logs } = await supabase
        .from('daily_logs').select('*').eq('client_id', clientId)
        .order('log_date', { ascending: false }).limit(60)
      setRecentLogs(((logs as DailyLog[]) ?? []).filter(hasData))
    }
    loadClient()
  }, [])

  useEffect(() => {
    if (!clientId) return
    async function loadLog() {
      setSaved(false)
      setExistingId(null)
      setForm({ ...emptyForm })
      const { data: existing } = await supabase
        .from('daily_logs').select('*').eq('client_id', clientId).eq('log_date', selectedDate).maybeSingle()
      if (existing) {
        setExistingId(existing.id)
        setForm({
          weight_kg: existing.weight_kg?.toString() ?? '',
          water_liters: existing.water_liters?.toString() ?? '',
          rhr: existing.rhr?.toString() ?? '',
          nutrition_adherence: existing.nutrition_adherence?.toString() ?? '',
          hunger_score: existing.hunger_score?.toString() ?? '',
          off_plan_meals: existing.off_plan_meals ?? '',
          stool_count: existing.stool_count ?? '',
          steps: existing.steps?.toString() ?? '',
          cardio_minutes: existing.cardio_minutes?.toString() ?? '',
          resistance_training: existing.resistance_training === true ? 'true' : existing.resistance_training === false ? 'false' : '',
          strength_score: existing.strength_score?.toString() ?? '',
          motivation_score: existing.motivation_score?.toString() ?? '',
          training_notes: existing.training_notes ?? '',
          sleep_time: existing.sleep_time ?? '',
          wake_time: existing.wake_time ?? '',
          sleep_quality: existing.sleep_quality?.toString() ?? '',
          sleep_notes: existing.sleep_notes ?? '',
          energy_levels: existing.energy_levels?.toString() ?? '',
          stress_levels: existing.stress_levels?.toString() ?? '',
        })
      }
    }
    loadLog()
  }, [clientId, selectedDate])

  function isFormEmpty(): boolean {
    return (
      !form.weight_kg && !form.water_liters && !form.rhr &&
      !form.nutrition_adherence && !form.hunger_score && !form.off_plan_meals && !form.stool_count &&
      !form.steps && !form.cardio_minutes && !form.resistance_training &&
      !form.strength_score && !form.motivation_score && !form.training_notes &&
      !form.sleep_time && !form.wake_time && !form.sleep_quality && !form.sleep_notes &&
      !form.energy_levels && !form.stress_levels
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId) return
    if (isFormEmpty()) {
      setFormError('Vul minstens één veld in voor je de log opslaat.')
      return
    }
    setFormError(null)
    setLoading(true)
    const sleepMinutes = calcSleepMinutes(form.sleep_time, form.wake_time)
    const payload = {
      client_id: clientId,
      log_date: selectedDate,
      filled_by: 'client' as const,
      weight_kg: form.weight_kg ? +form.weight_kg : null,
      water_liters: form.water_liters ? +form.water_liters : null,
      rhr: form.rhr ? +form.rhr : null,
      nutrition_adherence: form.nutrition_adherence ? +form.nutrition_adherence : null,
      hunger_score: form.hunger_score ? +form.hunger_score : null,
      off_plan_meals: form.off_plan_meals || null,
      stool_count: form.stool_count || null,
      steps: form.steps ? +form.steps : null,
      cardio_minutes: form.cardio_minutes ? +form.cardio_minutes : null,
      resistance_training: form.resistance_training === 'true' ? true : form.resistance_training === 'false' ? false : null,
      strength_score: form.strength_score ? +form.strength_score : null,
      motivation_score: form.motivation_score ? +form.motivation_score : null,
      training_notes: form.training_notes || null,
      sleep_time: form.sleep_time || null,
      wake_time: form.wake_time || null,
      sleep_duration_minutes: sleepMinutes,
      sleep_quality: form.sleep_quality ? +form.sleep_quality : null,
      sleep_notes: form.sleep_notes || null,
      energy_levels: form.energy_levels ? +form.energy_levels : null,
      stress_levels: form.stress_levels ? +form.stress_levels : null,
    }
    if (existingId) {
      await supabase.from('daily_logs').update(payload).eq('id', existingId)
    } else {
      await supabase.from('daily_logs').insert(payload)
    }
    setLoading(false)
    setSaved(true)
    setTimeout(() => { window.location.href = '/client' }, 1200)
  }

  const sleepMinutes = calcSleepMinutes(form.sleep_time, form.wake_time)
  const sleepDisplay = sleepMinutes != null
    ? `${Math.floor(sleepMinutes / 60)}u${sleepMinutes % 60 > 0 ? ` ${sleepMinutes % 60}m` : ''}`
    : null

  const isToday = selectedDate === todayStr

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    fontSize: '0.82rem',
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--text)' : 'var(--text-faint)',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--text)' : '2px solid transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  })

  return (
    <div>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px' }}>Log</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px', gap: '4px' }}>
        <button style={tabStyle(tab === 'log')} onClick={() => setTab('log')}>Dagelijkse log</button>
        <button style={tabStyle(tab === 'recent')} onClick={() => setTab('recent')}>Recente logs</button>
      </div>

      {tab === 'recent' && (
        <div>
          {recentLogs.length === 0 ? (
            <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem', textAlign: 'center', padding: '40px 0' }}>Nog geen logs.</p>
          ) : (
            <>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                {(showAllLogs ? recentLogs : recentLogs.slice(0, 5)).map(l => (
                  <div key={l.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--surface-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{formatDate(l.log_date)} <span style={{ color: '#22C55E', fontWeight: 400 }}>✓</span></span>
                      {l.weight_kg && <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{l.weight_kg} kg</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {l.steps && <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{l.steps.toLocaleString()} stappen</span>}
                      {l.water_liters && <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{l.water_liters}L water</span>}
                      {l.nutrition_adherence && <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>Voeding {l.nutrition_adherence}/5</span>}
                      {l.sleep_quality && <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>Slaap {l.sleep_quality}/5</span>}
                      {l.energy_levels && <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>Energie {l.energy_levels}/5</span>}
                      {l.resistance_training === true && <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>Krachttraining ✓</span>}
                    </div>
                  </div>
                ))}
                {recentLogs.length > 5 && (
                  <button
                    onClick={() => setShowAllLogs(v => !v)}
                    style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-dim)', textAlign: 'center' }}
                  >
                    {showAllLogs ? 'Minder tonen ↑' : `Meer logs tonen (${recentLogs.length - 5} meer) ↓`}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'log' && <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <input
          type="date"
          value={selectedDate}
          max={todayStr}
          onChange={e => setSelectedDate(e.target.value)}
          style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
        />
        {!isToday && (
          <button
            onClick={() => setSelectedDate(todayStr)}
            style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'transparent', border: '1px solid var(--border-2)', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer' }}
          >
            Vandaag
          </button>
        )}
        {existingId && !isFormEmpty() && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>Al ingevuld ✓</span>}
      </div>

      <form onSubmit={handleSave}>

        <Section title="Biometrie">
          <div className="cols-3">
            <div>
              <label style={LABEL}>Gewicht (kg)</label>
              <input type="number" step="0.1" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} placeholder="75.0" />
            </div>
            <div>
              <label style={LABEL}>Water (liter)</label>
              <input type="number" step="0.1" value={form.water_liters} onChange={e => set('water_liters', e.target.value)} placeholder="2.5" />
            </div>
            <div>
              <label style={LABEL}>Rustpols (bpm)</label>
              <input type="number" value={form.rhr} onChange={e => set('rhr', e.target.value)} placeholder="60" />
            </div>
          </div>
        </Section>

        <Section title="Voeding">
          <div className="cols-2" style={{ marginBottom: '16px' }}>
            <ScoreSelect label="Voedingsadherentie" value={form.nutrition_adherence} onChange={v => set('nutrition_adherence', v)} />
            <ScoreSelect label="Hongergevoel" value={form.hunger_score} onChange={v => set('hunger_score', v)} />
          </div>
          <div className="cols-2" style={{ marginBottom: '16px' }}>
            <div>
              <label style={LABEL}>Stoelgang</label>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginBottom: '8px', marginTop: '-4px' }}>keer/dag</p>
              <select value={form.stool_count} onChange={e => set('stool_count', e.target.value)}>
                <option value="">—</option>
                {['1', '2', '3', '4', '5+'].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={LABEL}>Off-plan maaltijden</label>
            <textarea rows={3} value={form.off_plan_meals} onChange={e => set('off_plan_meals', e.target.value)} placeholder="Bv. pizza op vrijdag" style={{ resize: 'vertical' }} />
          </div>
        </Section>

        <Section title="Training">
          <div className="cols-2" style={{ marginBottom: '16px' }}>
            <div>
              <label style={LABEL}>Stappen</label>
              <input type="number" value={form.steps} onChange={e => set('steps', e.target.value)} placeholder="8000" />
            </div>
            <div>
              <label style={LABEL}>Cardio (minuten)</label>
              <input type="number" value={form.cardio_minutes} onChange={e => set('cardio_minutes', e.target.value)} placeholder="30" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={LABEL}>Krachttraining</label>
              <select value={form.resistance_training} onChange={e => set('resistance_training', e.target.value)}>
                <option value="">—</option>
                <option value="true">Ja</option>
                <option value="false">Nee</option>
              </select>
            </div>
            <ScoreSelect label="Krachtprestatie" inline value={form.strength_score} onChange={v => set('strength_score', v)} />
            <ScoreSelect label="Motivatie" inline value={form.motivation_score} onChange={v => set('motivation_score', v)} />
          </div>
          <div>
            <label style={LABEL}>Trainingsnotities</label>
            <input value={form.training_notes} onChange={e => set('training_notes', e.target.value)} placeholder="Bv. squats 100kg x 5" />
          </div>
        </Section>

        <Section title="Slaap">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={LABEL}>Slaaptijd</label>
              <input type="time" value={form.sleep_time} onChange={e => set('sleep_time', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Waaktijd</label>
              <input type="time" value={form.wake_time} onChange={e => set('wake_time', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Slaapduur</label>
              <input readOnly value={sleepDisplay ?? ''} placeholder="auto" style={{ color: sleepDisplay ? 'var(--text)' : 'var(--text-faint)' }} />
            </div>
            <ScoreSelect label="Slaapkwaliteit" inline value={form.sleep_quality} onChange={v => set('sleep_quality', v)} />
            <div>
              <label style={LABEL}>Slaapnotities</label>
              <input value={form.sleep_notes} onChange={e => set('sleep_notes', e.target.value)} placeholder="Bv. slecht geslapen door stress" />
            </div>
          </div>
        </Section>

        <Section title="Biofeedback">
          <div className="cols-2">
            <ScoreSelect label="Energieniveau" value={form.energy_levels} onChange={v => set('energy_levels', v)} />
            <ScoreSelect label="Stressniveau" value={form.stress_levels} onChange={v => set('stress_levels', v)} />
          </div>
        </Section>

        {formError && <p style={{ color: '#EF4444', fontSize: '0.82rem', marginBottom: '12px', textAlign: 'center' }}>{formError}</p>}
        <button type="submit" disabled={loading || saved} style={{ ...BTN_PRIMARY, width: '100%', padding: '14px', fontSize: '0.9rem', opacity: (loading || saved) ? 0.7 : 1 }}>
          {saved ? 'Opgeslagen ✓' : loading ? 'Opslaan...' : existingId ? 'Log bijwerken' : 'Log opslaan'}
        </button>
      </form>
      </div>}
    </div>
  )
}
