'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const S = {
  page: { padding: '32px', maxWidth: '720px' },
  back: { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.82rem', marginBottom: '24px' } as React.CSSProperties,
  title: { fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' },
  subtitle: { color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '32px' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '20px' },
  sectionTitle: { fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: '16px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  label: { display: 'block', fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-dim)', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: '6px' },
  field: { marginBottom: '16px' },
}

export default function NewClientPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', dob: '',
    gender: '', height_cm: '', start_weight_kg: '',
    short_term_goal: '', long_term_goal: '', motivation: '',
    medical_conditions: '', injuries: '', notes: '',
    training_days_per_week: '', activity_level: '',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: inserted, error } = await supabase.from('clients').insert({
      ...form,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      start_weight_kg: form.start_weight_kg ? Number(form.start_weight_kg) : null,
      training_days_per_week: form.training_days_per_week ? Number(form.training_days_per_week) : null,
      dob: form.dob || null,
      gender: form.gender || null,
      activity_level: form.activity_level || null,
      intake_completed: true,
    }).select('id').single()
    if (error) { setError(error.message); setLoading(false); return }

    const res = await fetch('/api/invite-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, clientId: inserted.id }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(`Klant aangemaakt maar uitnodigingsmail mislukt: ${body.error}`)
      setLoading(false)
      return
    }

    router.push('/coach/clients')
  }

  return (
    <div style={S.page}>
      <Link href="/coach/clients" style={S.back}><ArrowLeft size={14} /> Terug</Link>
      <h1 style={S.title}>Nieuwe klant toevoegen</h1>
      <p style={S.subtitle}>Vul de basisgegevens in. De klant kan later zijn profiel aanvullen via de intake.</p>

      <form onSubmit={handleSubmit}>
        <div style={S.card}>
          <p style={S.sectionTitle}>Persoonlijke info</p>
          <div style={S.grid2}>
            <div style={S.field}>
              <label style={S.label}>Volledige naam *</label>
              <input value={form.full_name} onChange={e => set('full_name', e.target.value)} required placeholder="Jan Janssen" />
            </div>
            <div style={S.field}>
              <label style={S.label}>E-mailadres *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="jan@email.com" />
            </div>
            <div style={S.field}>
              <label style={S.label}>Telefoon</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+32 4xx xxx xxx" />
            </div>
            <div style={S.field}>
              <label style={S.label}>Geboortedatum</label>
              <input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Geslacht</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Kies...</option>
                <option value="man">Man</option>
                <option value="vrouw">Vrouw</option>
                <option value="anders">Anders</option>
              </select>
            </div>
            <div style={S.grid2}>
              <div style={S.field}>
                <label style={S.label}>Lengte (cm)</label>
                <input type="number" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} placeholder="175" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Startgewicht (kg)</label>
                <input type="number" step="0.1" value={form.start_weight_kg} onChange={e => set('start_weight_kg', e.target.value)} placeholder="75.0" />
              </div>
            </div>
          </div>
        </div>

        <div style={S.card}>
          <p style={S.sectionTitle}>Doelstellingen</p>
          <div style={S.field}>
            <label style={S.label}>Kortetermijndoel</label>
            <textarea value={form.short_term_goal} onChange={e => set('short_term_goal', e.target.value)} rows={2} placeholder="Bv. -5kg in 3 maanden" />
          </div>
          <div style={S.field}>
            <label style={S.label}>Langetermijndoel</label>
            <textarea value={form.long_term_goal} onChange={e => set('long_term_goal', e.target.value)} rows={2} placeholder="Bv. competitieshape" />
          </div>
        </div>

        <div style={S.card}>
          <p style={S.sectionTitle}>Medisch & training</p>
          <div style={S.field}>
            <label style={S.label}>Medische aandoeningen / blessures</label>
            <textarea value={form.injuries} onChange={e => set('injuries', e.target.value)} rows={2} placeholder="Bv. knieblessure 2023" />
          </div>
          <div style={S.grid2}>
            <div style={S.field}>
              <label style={S.label}>Trainingsdagen/week</label>
              <input type="number" min={1} max={7} value={form.training_days_per_week} onChange={e => set('training_days_per_week', e.target.value)} placeholder="4" />
            </div>
            <div style={S.field}>
              <label style={S.label}>Activiteitsniveau</label>
              <select value={form.activity_level} onChange={e => set('activity_level', e.target.value)}>
                <option value="">Kies...</option>
                <option value="sedentair">Sedentair</option>
                <option value="licht actief">Licht actief</option>
                <option value="matig actief">Matig actief</option>
                <option value="zeer actief">Zeer actief</option>
              </select>
            </div>
          </div>
        </div>

        <div style={S.card}>
          <p style={S.sectionTitle}>Coach notities</p>
          <div style={S.field}>
            <label style={S.label}>Interne notities (niet zichtbaar voor client)</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="..." />
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#EF4444', fontSize: '0.82rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Link href="/coach/clients" style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-2)', color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.875rem' }}>
            Annuleren
          </Link>
          <button type="submit" disabled={loading} style={{
            padding: '10px 24px', borderRadius: '8px', background: '#004aad', color: '#ffffff',
            border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
          }}>
            {loading ? 'Opslaan...' : 'Klant toevoegen'}
          </button>
        </div>
      </form>
    </div>
  )
}
