'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProgressBar } from '@/components/base/progress-indicators/progress-indicators'

const S = {
  page: { minHeight: '100vh', background: '#F5F5F3', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '32px 16px' },
  card: { width: '100%', maxWidth: '640px' },
  logo: { marginBottom: '32px', textAlign: 'center' as const },
  section: { background: '#FFFFFF', border: '1px solid #E5E5E3', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize: '0.7rem', fontWeight: 700, color: '#999', textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: '16px' },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#555', textTransform: 'uppercase' as const, letterSpacing: '0.6px', marginBottom: '6px' },
}

export default function IntakePage() {
  const supabase = createClient()
  const [step, setStep] = useState<'form' | 'done'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formStartTime] = useState(() => Date.now())
  const [honeypot, setHoneypot] = useState('')
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', dob: '', gender: '',
    height_cm: '', start_weight_kg: '',
    short_term_goal: '', long_term_goal: '', motivation: '', coaching_experience: '',
    medical_conditions: '', injuries: '', medications: '', surgeon_clearance: false,
    current_diet: '', meal_frequency: '', food_allergies: '',
    alcohol_frequency: '', sleep_hours: '', stress_level: '',
    activity_level: '', training_days_per_week: '', training_experience: '',
  })

  function set(key: string, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const TRACKED_FIELDS = ['full_name', 'email', 'phone', 'dob', 'gender', 'height_cm', 'start_weight_kg', 'short_term_goal', 'long_term_goal', 'motivation', 'coaching_experience', 'medical_conditions', 'injuries', 'current_diet', 'meal_frequency', 'alcohol_frequency', 'sleep_hours', 'stress_level', 'activity_level', 'training_days_per_week', 'training_experience']
  const filledCount = TRACKED_FIELDS.filter(k => String((form as Record<string, unknown>)[k] ?? '').trim() !== '').length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (honeypot) return // bot trap: bots fill hidden fields
    if (Date.now() - formStartTime < 4000) { setError('Formulier te snel ingevuld. Probeer opnieuw.'); return }
    setLoading(true)
    setError('')
    const { data: inserted, error } = await supabase.from('clients').insert({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || null,
      dob: form.dob || null,
      gender: form.gender || null,
      height_cm: form.height_cm ? +form.height_cm : null,
      start_weight_kg: form.start_weight_kg ? +form.start_weight_kg : null,
      short_term_goal: form.short_term_goal || null,
      long_term_goal: form.long_term_goal || null,
      motivation: form.motivation || null,
      coaching_experience: form.coaching_experience || null,
      medical_conditions: form.medical_conditions || null,
      injuries: form.injuries || null,
      medications: form.medications || null,
      surgeon_clearance: form.surgeon_clearance,
      current_diet: form.current_diet || null,
      meal_frequency: form.meal_frequency ? +form.meal_frequency : null,
      food_allergies: form.food_allergies || null,
      alcohol_frequency: form.alcohol_frequency || null,
      sleep_hours: form.sleep_hours ? +form.sleep_hours : null,
      stress_level: form.stress_level ? +form.stress_level : null,
      activity_level: form.activity_level || null,
      training_days_per_week: form.training_days_per_week ? +form.training_days_per_week : null,
      training_experience: form.training_experience || null,
      intake_completed: true,
    }).select('id').single()
    if (error) {
      const msg = error.message.includes('clients_email_key')
        ? 'Dit e-mailadres is al geregistreerd. Neem contact op met je coach als je een probleem hebt met je account.'
        : error.message
      setError(msg); setLoading(false); return
    }

    // Auto-create login account and send invite email
    if (inserted?.id) {
      await fetch('/api/intake-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, clientId: inserted.id }),
      })
    }

    setStep('done')
  }

  if (step === 'done') {
    return (
      <div style={S.page} data-theme="light">
        <div style={S.card}>

          {/* Logo */}
          <div style={S.logo}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '3px', color: '#111' }}>OEYEN</div>
            <div style={{ fontSize: '0.55rem', letterSpacing: '5px', color: '#999', marginTop: '2px' }}>COACHING</div>
          </div>

          {/* Success badge */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#111', color: '#fff', fontSize: '1.6rem', marginBottom: '20px',
            }}>✓</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111', marginBottom: '10px' }}>Welkom bij Oeyen Coaching!</h1>
            <p style={{ color: '#777', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: '420px', margin: '0 auto' }}>
              Je intake is ontvangen. Check je inbox, je ontvangt zo meteen een e-mail om je account in te stellen.
            </p>
          </div>

          {/* Wat nu? */}
          <div style={{ background: '#fff', border: '1px solid #E5E5E3', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#999', textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: '18px' }}>Wat nu?</p>
            {[
              { step: '1', title: 'Check je e-mail', desc: 'Je ontvangt een uitnodigingsmail om je wachtwoord in te stellen.' },
              { step: '2', title: 'Stel je wachtwoord in', desc: 'Klik op de link in de mail en kies een wachtwoord voor je account.' },
              { step: '3', title: 'Jouw portaal is klaar', desc: 'Bekijk je schema\'s, log je dagelijkse voortgang en check in bij je coach.' },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ display: 'flex', gap: '16px', marginBottom: '18px', alignItems: 'flex-start' }}>
                <div style={{
                  flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%',
                  background: '#F5F5F3', border: '1px solid #E5E5E3',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 700, color: '#111',
                }}>{step}</div>
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111', margin: '0 0 3px' }}>{title}</p>
                  <p style={{ fontSize: '0.8rem', color: '#888', margin: 0, lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Wat zit er in het portaal */}
          <div style={{ background: '#fff', border: '1px solid #E5E5E3', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#999', textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: '16px' }}>Wat vind je in je portaal?</p>
            <div className="cols-2" style={{ gap: '10px' }}>
              {[
                { icon: '📋', label: 'Voedingsschema' },
                { icon: '🏋️', label: 'Trainingsschema' },
                { icon: '📊', label: 'Dagelijkse logs' },
                { icon: '📈', label: 'Voortgang & metingen' },
              ].map(({ icon, label }) => (
                <div key={label} style={{
                  background: '#F5F5F3', borderRadius: '10px', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#333' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#bbb', marginTop: '28px', marginBottom: '8px' }}>
            Vragen? Contacteer Dimitri via{' '}
            <a href="mailto:info@oeyen-coaching.be" style={{ color: '#999', textDecoration: 'none' }}>info@oeyen-coaching.be</a>
          </p>

        </div>
      </div>
    )
  }

  return (
    <div style={S.page} data-theme="light">
      <div style={S.card}>
        <div style={S.logo}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '3px', color: '#111' }}>OEYEN</div>
          <div style={{ fontSize: '0.55rem', letterSpacing: '5px', color: '#999', marginTop: '2px' }}>COACHING</div>
        </div>

        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px', textAlign: 'center', color: '#111' }}>Intake formulier</h1>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '24px', textAlign: 'center', lineHeight: 1.6 }}>
          Vul dit formulier zo volledig mogelijk in. Alle info blijft strikt vertrouwelijk.
        </p>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F5F5F3', padding: '10px 0', marginBottom: '16px' }}>
          <ProgressBar min={0} max={TRACKED_FIELDS.length} value={filledCount} label="Voortgang" />
        </div>

        <form onSubmit={handleSubmit}>
          {/* Honeypot: bots fill this, humans don't see it */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
          />
          {/* Persoonlijke info */}
          <div style={S.section}>
            <p style={S.sectionTitle}>Persoonlijke informatie</p>
            <div className="cols-2">
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
                </select>
              </div>
              <div className="cols-2">
                <div style={S.field}>
                  <label style={S.label}>Lengte (cm)</label>
                  <input type="number" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} placeholder="175" />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Gewicht (kg)</label>
                  <input type="number" step="0.1" value={form.start_weight_kg} onChange={e => set('start_weight_kg', e.target.value)} placeholder="75" />
                </div>
              </div>
            </div>
          </div>

          {/* Doelstellingen */}
          <div style={S.section}>
            <p style={S.sectionTitle}>Doelstellingen & motivatie</p>
            <div style={S.field}>
              <label style={S.label}>Wat is je kortetermijndoel? (3–6 maanden)</label>
              <textarea value={form.short_term_goal} onChange={e => set('short_term_goal', e.target.value)} rows={2} placeholder="Bv. 5 kg verliezen, meer energie..." />
            </div>
            <div style={S.field}>
              <label style={S.label}>Wat is je langetermijndoel?</label>
              <textarea value={form.long_term_goal} onChange={e => set('long_term_goal', e.target.value)} rows={2} placeholder="Bv. Competitions, levensstijlverandering..." />
            </div>
            <div style={S.field}>
              <label style={S.label}>Waarom wil je met coaching starten?</label>
              <textarea value={form.motivation} onChange={e => set('motivation', e.target.value)} rows={3} placeholder="Vertel ons meer..." />
            </div>
            <div style={S.field}>
              <label style={S.label}>Heb je al eerder met een coach gewerkt?</label>
              <select value={form.coaching_experience} onChange={e => set('coaching_experience', e.target.value)}>
                <option value="">Kies...</option>
                <option value="nee">Nee, eerste keer</option>
                <option value="ja_positief">Ja, positieve ervaring</option>
                <option value="ja_negatief">Ja, niet wat ik verwachtte</option>
              </select>
            </div>
          </div>

          {/* Medisch */}
          <div style={S.section}>
            <p style={S.sectionTitle}>Gezondheid & medisch</p>
            <div style={S.field}>
              <label style={S.label}>Medische aandoeningen (bv. diabetes, hypertensie...)</label>
              <textarea value={form.medical_conditions} onChange={e => set('medical_conditions', e.target.value)} rows={2} placeholder="Geen of beschrijf hier..." />
            </div>
            <div style={S.field}>
              <label style={S.label}>Blessures of pijnen die training beïnvloeden</label>
              <textarea value={form.injuries} onChange={e => set('injuries', e.target.value)} rows={2} placeholder="Geen of beschrijf hier..." />
            </div>
            <div style={S.field}>
              <label style={S.label}>Medicatie</label>
              <input value={form.medications} onChange={e => set('medications', e.target.value)} placeholder="Geen of beschrijf hier..." />
            </div>
            <div style={S.field}>
              <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.surgeon_clearance} onChange={e => set('surgeon_clearance', e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                Ik heb toestemming van mijn arts om te sporten
              </label>
            </div>
          </div>

          {/* Voeding */}
          <div style={S.section}>
            <p style={S.sectionTitle}>Voeding & levensstijl</p>
            <div style={S.field}>
              <label style={S.label}>Huidig eetpatroon / dieet</label>
              <textarea value={form.current_diet} onChange={e => set('current_diet', e.target.value)} rows={2} placeholder="Bv. geen restricties, vegetarisch..." />
            </div>
            <div className="cols-2">
              <div style={S.field}>
                <label style={S.label}>Aantal maaltijden/dag</label>
                <input type="number" min={1} max={8} value={form.meal_frequency} onChange={e => set('meal_frequency', e.target.value)} placeholder="3" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Voedselallergieën</label>
                <input value={form.food_allergies} onChange={e => set('food_allergies', e.target.value)} placeholder="Geen of noem ze..." />
              </div>
              <div style={S.field}>
                <label style={S.label}>Alcohol (hoe vaak?)</label>
                <select value={form.alcohol_frequency} onChange={e => set('alcohol_frequency', e.target.value)}>
                  <option value="">Kies...</option>
                  <option value="nooit">Nooit</option>
                  <option value="zelden">Zelden (1x/maand)</option>
                  <option value="soms">Soms (1–2x/week)</option>
                  <option value="regelmatig">Regelmatig (3+/week)</option>
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Slaap (uur/nacht)</label>
                <input type="number" min={4} max={12} step={0.5} value={form.sleep_hours} onChange={e => set('sleep_hours', e.target.value)} placeholder="7.5" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Stressniveau (1–10)</label>
                <input type="number" min={1} max={10} value={form.stress_level} onChange={e => set('stress_level', e.target.value)} placeholder="5" />
              </div>
            </div>
          </div>

          {/* Training */}
          <div style={S.section}>
            <p style={S.sectionTitle}>Training</p>
            <div className="cols-2">
              <div style={S.field}>
                <label style={S.label}>Activiteitsniveau</label>
                <select value={form.activity_level} onChange={e => set('activity_level', e.target.value)}>
                  <option value="">Kies...</option>
                  <option value="sedentair">Sedentair (bureauwerk)</option>
                  <option value="licht actief">Licht actief</option>
                  <option value="matig actief">Matig actief</option>
                  <option value="zeer actief">Zeer actief</option>
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Trainingsdagen/week</label>
                <input type="number" min={0} max={7} value={form.training_days_per_week} onChange={e => set('training_days_per_week', e.target.value)} placeholder="4" />
              </div>
            </div>
            <div style={S.field}>
              <label style={S.label}>Trainingsachtergrond / ervaring</label>
              <textarea value={form.training_experience} onChange={e => set('training_experience', e.target.value)} rows={3} placeholder="Bv. 2 jaar fitnesservaring, nooit gesport..." />
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#EF4444', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px', borderRadius: '10px', background: '#111', color: '#FFF',
            border: 'none', fontSize: '0.9rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, marginBottom: '32px',
          }}>
            {loading ? 'Verzenden...' : 'Intake insturen'}
          </button>
        </form>
      </div>
    </div>
  )
}
