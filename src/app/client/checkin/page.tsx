'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, getISOWeek } from 'date-fns'
import { LABEL, BTN_PRIMARY } from '@/lib/ui'

export default function CheckinPage() {
  const supabase = createClient()
  const router = useRouter()
  const [clientId, setClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    gym_performance: '',
    recovery: '',
    training_weeks_on_split: '',
    weeks_since_deload: '',
    stress_notes: '',
    general_notes: '',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  useEffect(() => {
    async function load() {
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
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId || !form.general_notes.trim()) return
    setLoading(true)
    await supabase.from('weekly_checkins').insert({
      client_id: clientId,
      week_number: getISOWeek(new Date()),
      checkin_date: format(new Date(), 'yyyy-MM-dd'),
      gym_performance: form.gym_performance || null,
      recovery: form.recovery || null,
      training_weeks_on_split: form.training_weeks_on_split || null,
      weeks_since_deload: form.weeks_since_deload || null,
      stress_notes: form.stress_notes || null,
      general_notes: form.general_notes,
    })
    setLoading(false)
    setSaved(true)
    setTimeout(() => { window.location.href = '/client' }, 1500)
  }

  const textFields: [string, string, string][] = [
    ['gym_performance', 'Hoe waren je gym prestaties deze week?', 'Bv. PR op deadlift, energieniveau goed...'],
    ['recovery', 'Hoe was je herstel?', 'Bv. spierpijn, vermoeid, fris gevoel...'],
    ['stress_notes', 'Stressniveau & omstandigheden', 'Bv. drukke werkweek, weinig slaap...'],
    ['general_notes', 'Algemene notities & vragen voor de coach *', 'Vertel alles wat relevant is...'],
  ]

  return (
    <div>
      <Link href="/client" style={{ fontSize: '0.82rem', color: '#555', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
        ← Terug
      </Link>

      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '4px' }}>Wekelijkse check-in</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '28px' }}>Week {getISOWeek(new Date())} · {format(new Date(), 'dd/MM/yyyy')}</p>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {textFields.map(([key, label, placeholder]) => (
            <div key={key}>
              <label style={LABEL}>{label}</label>
              <textarea
                value={(form as any)[key]}
                onChange={e => set(key, e.target.value)}
                rows={3}
                placeholder={placeholder}
                required={key === 'general_notes'}
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>
          ))}
        </div>

        {/* Training context */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>Trainingscontext</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={LABEL}>Weken op huidig schema</label>
              <input
                type="number"
                min="0"
                value={form.training_weeks_on_split}
                onChange={e => set('training_weeks_on_split', e.target.value)}
                placeholder="Bv. 4"
              />
            </div>
            <div>
              <label style={LABEL}>Weken sinds laatste deload</label>
              <input
                type="number"
                min="0"
                value={form.weeks_since_deload}
                onChange={e => set('weeks_since_deload', e.target.value)}
                placeholder="Bv. 8"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || saved || !form.general_notes.trim()}
          style={{
            ...BTN_PRIMARY,
            width: '100%',
            padding: '14px',
            fontSize: '0.9rem',
            opacity: (loading || saved || !form.general_notes.trim()) ? 0.6 : 1,
            cursor: !form.general_notes.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {saved ? 'Verstuurd ✓' : loading ? 'Versturen...' : 'Check-in versturen'}
        </button>
      </form>
    </div>
  )
}
