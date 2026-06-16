'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type F = {
  first_name: string; last_name: string; email: string; phone: string; dob: string; gender: string
  height_cm: string; start_weight_kg: string
  short_term_goal: string; long_term_goal: string; motivation: string; coaching_experience: string
  medical_conditions: string; injuries: string; medications: string; surgeon_clearance: boolean
  current_diet: string; meal_frequency: string; food_allergies: string
  alcohol_frequency: string; sleep_hours: string; stress_level: string
  activity_level: string; training_days_per_week: string; training_experience: string
}

const INIT: F = {
  first_name: '', last_name: '', email: '', phone: '', dob: '', gender: '',
  height_cm: '', start_weight_kg: '',
  short_term_goal: '', long_term_goal: '', motivation: '', coaching_experience: '',
  medical_conditions: '', injuries: '', medications: '', surgeon_clearance: false,
  current_diet: '', meal_frequency: '', food_allergies: '',
  alcohol_frequency: '', sleep_hours: '', stress_level: '',
  activity_level: '', training_days_per_week: '', training_experience: '',
}

const SECS = [
  { label: 'OVER JOU',    steps: ['Welkom', 'Naam & contact', 'Persoonlijk', 'Lichaam'] },
  { label: 'DOELEN',      steps: ['Kortetermijn', 'Langetermijn', 'Motivatie', 'Coachervaring'] },
  { label: 'GEZONDHEID',  steps: ['Gezondheid', 'Medicatie'] },
  { label: 'LEVENSSTIJL', steps: ['Voeding', 'Maaltijden', 'Slaap', 'Stress'] },
  { label: 'TRAINING',    steps: ['Activiteit', 'Achtergrond'] },
]
const N = SECS.reduce((a, s) => a + s.steps.length, 0) // 16

const SEC_STARTS = SECS.reduce((acc: number[], sec, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + SECS[i - 1].steps.length)
  return acc
}, [])

const STEP_META = [
  { title: 'Welkom bij Oeyen Coaching!',   sub: 'Dit formulier duurt ongeveer 5 minuten en is 100% vertrouwelijk.' },
  { title: 'Wie ben jij?',                 sub: 'Vul je naam en contactgegevens in.' },
  { title: 'Iets meer over jou',           sub: 'Geboortedatum en geslacht.' },
  { title: 'Jouw lichaam',                 sub: 'Lengte en huidig gewicht.' },
  { title: 'Wat wil je bereiken?',         sub: 'Denk aan de komende 3 tot 6 maanden.' },
  { title: 'Jouw grotere doel',            sub: 'Wat wil je op lange termijn bereiken?' },
  { title: 'Waarom coaching?',             sub: 'Vertel ons waarom je wil starten met Oeyen Coaching.' },
  { title: 'Heb je al een coach gehad?',   sub: 'Selecteer de optie die het best past.' },
  { title: 'Jouw gezondheid',              sub: 'Zijn er zaken die je training kunnen beïnvloeden?' },
  { title: 'Medicatie & toestemming',      sub: 'Vul eventuele medicatie in.' },
  { title: 'Hoe eet jij?',                 sub: 'Vertel ons over jouw eetpatroon en eventuele allergieën.' },
  { title: 'Maaltijden & alcohol',         sub: 'Hoe zit jouw dagelijkse eetritme eruit?' },
  { title: 'Hoe slaap je?',               sub: 'Slaap is essentieel voor je resultaten.' },
  { title: 'Jouw stressniveau',            sub: 'Hoe gestressd voel jij je gemiddeld?' },
  { title: 'Hoe actief ben je?',           sub: 'Geef je huidige activiteitsniveau en trainingsfrequentie aan.' },
  { title: 'Jouw trainingsachtergrond',    sub: 'Vertel ons over je ervaring.' },
]

// ─── UI ATOMS ────────────────────────────────────────────────────────────────
function FL({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#444', marginBottom: '10px' }}>
      {children}
    </label>
  )
}

function TI(p: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...p} style={{
      width: '100%', padding: '13px 16px', borderRadius: '12px',
      border: '1.5px solid #E5E5E5', background: '#FAFAFA',
      fontSize: '0.95rem', color: '#111', outline: 'none',
      fontFamily: 'inherit', transition: 'border-color 0.15s',
      ...(p.style ?? {}),
    }} />
  )
}

function TA(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...p} style={{
      width: '100%', padding: '13px 16px', borderRadius: '12px',
      border: '1.5px solid #E5E5E5', background: '#FAFAFA',
      fontSize: '0.95rem', color: '#111', outline: 'none',
      resize: 'none', fontFamily: 'inherit', lineHeight: 1.65,
      ...(p.style ?? {}),
    }} />
  )
}

function Cards({ opts, val, set, cols = 2 }: {
  opts: [string, string][]
  val: string; set: (v: string) => void; cols?: number
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '10px' }}>
      {opts.map(([v, l]) => {
        const on = val === v
        return (
          <button key={v} type="button" onClick={() => set(v)} style={{
            padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
            border: on ? '2px solid #004aad' : '1.5px solid #E5E5E5',
            background: on ? 'rgba(0,74,173,0.06)' : '#fff',
            display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.13s',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              border: on ? '5px solid #004aad' : '1.5px solid #CCC',
              transition: 'all 0.13s',
            }} />
            <span style={{ fontSize: '0.88rem', fontWeight: on ? 600 : 400, color: on ? '#004aad' : '#333' }}>
              {l}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function Scale({ val, set, lo, hi, min = 1, max = 10 }: {
  val: string; set: (v: string) => void
  lo?: string; hi?: string; min?: number; max?: number
}) {
  return (
    <div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => {
          const on = val === String(n)
          return (
            <button key={n} type="button" onClick={() => set(String(n))} style={{
              flex: 1, padding: '12px 0', borderRadius: '8px', cursor: 'pointer',
              border: on ? '2px solid #004aad' : '1.5px solid #E5E5E5',
              background: on ? '#004aad' : '#fff', color: on ? '#fff' : '#555',
              fontWeight: on ? 700 : 400, fontSize: '0.85rem',
              transition: 'all 0.13s', lineHeight: 1,
            }}>{n}</button>
          )
        })}
      </div>
      {(lo || hi) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <span style={{ fontSize: '0.72rem', color: '#999' }}>{lo}</span>
          <span style={{ fontSize: '0.72rem', color: '#999' }}>{hi}</span>
        </div>
      )}
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function IntakePage() {
  const supabase = createClient()
  const [screen, setScreen] = useState<'form' | 'done'>('form')
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [stepError, setStepError] = useState('')
  const [formStartTime] = useState(() => Date.now())
  const [honeypot, setHoneypot] = useState('')
  const [form, setForm] = useState<F>(INIT)

  function set(k: keyof F, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function validate(): string {
    if (step === 1) {
      if (!form.first_name.trim()) return 'Vul je voornaam in.'
      if (!form.last_name.trim()) return 'Vul je achternaam in.'
      if (!form.email.trim()) return 'Vul je e-mailadres in.'
    }
    return ''
  }

  async function goNext() {
    const err = validate()
    if (err) { setStepError(err); return }
    setStepError('')
    if (step < N - 1) { setStep(s => s + 1); return }
    // Last step → submit
    if (honeypot) return
    if (Date.now() - formStartTime < 4000) { setSubmitError('Formulier te snel ingevuld. Probeer opnieuw.'); return }
    setLoading(true)
    setSubmitError('')
    const { error } = await supabase.from('clients').insert({
      full_name: `${form.first_name.trim()} ${form.last_name.trim()}`, email: form.email, phone: form.phone || null,
      dob: form.dob || null, gender: form.gender || null,
      height_cm: form.height_cm ? +form.height_cm : null,
      start_weight_kg: form.start_weight_kg ? +form.start_weight_kg : null,
      short_term_goal: form.short_term_goal || null, long_term_goal: form.long_term_goal || null,
      motivation: form.motivation || null, coaching_experience: form.coaching_experience || null,
      medical_conditions: form.medical_conditions || null, injuries: form.injuries || null,
      medications: form.medications || null, surgeon_clearance: form.surgeon_clearance,
      current_diet: form.current_diet || null,
      meal_frequency: form.meal_frequency ? +form.meal_frequency : null,
      food_allergies: form.food_allergies || null, alcohol_frequency: form.alcohol_frequency || null,
      sleep_hours: form.sleep_hours ? +form.sleep_hours : null,
      stress_level: form.stress_level ? +form.stress_level : null,
      activity_level: form.activity_level || null,
      training_days_per_week: form.training_days_per_week ? +form.training_days_per_week : null,
      training_experience: form.training_experience || null,
      intake_completed: true,
    })
    if (error) {
      const msg = error.message.includes('clients_email_key')
        ? 'Dit e-mailadres is al geregistreerd. Neem contact op met je coach als je een probleem hebt.'
        : error.message
      setSubmitError(msg); setLoading(false); return
    }
    setScreen('done')
  }

  function goPrev() {
    setStepError('')
    setStep(s => Math.max(0, s - 1))
  }

  // ─── STEP CONTENT ──────────────────────────────────────────────────────────
  function renderContent() {
    switch (step) {
      case 0:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { icon: '🎯', t: 'Gepersonaliseerd programma', d: 'Jouw antwoorden zijn de basis voor een schema volledig op maat.' },
              { icon: '🔒', t: '100% vertrouwelijk', d: 'Alleen jij en Dimitri hebben toegang tot jouw gegevens.' },
              { icon: '⚡', t: 'Klaar in 5 minuten', d: 'Beantwoord de vragen stap voor stap in jouw eigen tempo.' },
            ].map(({ icon, t, d }) => (
              <div key={t} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '18px 20px', borderRadius: '14px', background: '#F5F8FF', border: '1px solid rgba(0,74,173,0.12)' }}>
                <span style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 700, color: '#111' }}>{t}</p>
                  <p style={{ margin: 0, fontSize: '0.83rem', color: '#666', lineHeight: 1.55 }}>{d}</p>
                </div>
              </div>
            ))}
          </div>
        )
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div><FL>Voornaam *</FL><TI value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Jan" /></div>
              <div><FL>Achternaam *</FL><TI value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Janssen" /></div>
            </div>
            <div><FL>E-mailadres *</FL><TI type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jan@email.com" /></div>
            <div><FL>Telefoonnummer</FL><TI value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+32 4xx xxx xxx" /></div>
          </div>
        )
      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div><FL>Geboortedatum</FL><TI type="date" value={form.dob} onChange={e => set('dob', e.target.value)} /></div>
            <div>
              <FL>Geslacht</FL>
              <Cards opts={[['man', 'Man'], ['vrouw', 'Vrouw']]} val={form.gender} set={v => set('gender', v)} />
            </div>
          </div>
        )
      case 3:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div><FL>Lengte (cm)</FL><TI type="number" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} placeholder="175" /></div>
            <div><FL>Gewicht (kg)</FL><TI type="number" step="0.1" value={form.start_weight_kg} onChange={e => set('start_weight_kg', e.target.value)} placeholder="75" /></div>
          </div>
        )
      case 4:
        return (
          <div><FL>Jouw kortetermijndoel</FL><TA rows={5} value={form.short_term_goal} onChange={e => set('short_term_goal', e.target.value)} placeholder="Bv. 5 kg verliezen, meer energie hebben, strakker lichaam..." /></div>
        )
      case 5:
        return (
          <div><FL>Langetermijndoel</FL><TA rows={5} value={form.long_term_goal} onChange={e => set('long_term_goal', e.target.value)} placeholder="Bv. competition, levensstijlverandering, gezond blijven..." /></div>
        )
      case 6:
        return (
          <div><FL>Jouw motivatie</FL><TA rows={6} value={form.motivation} onChange={e => set('motivation', e.target.value)} placeholder="Vertel vrijuit..." /></div>
        )
      case 7:
        return (
          <Cards cols={1} opts={[
            ['nee', 'Nee, dit is de eerste keer'],
            ['ja_positief', 'Ja, een positieve ervaring'],
            ['ja_negatief', 'Ja, niet wat ik verwachtte'],
          ]} val={form.coaching_experience} set={v => set('coaching_experience', v)} />
        )
      case 8:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div><FL>Medische aandoeningen (diabetes, hypertensie...)</FL><TA rows={3} value={form.medical_conditions} onChange={e => set('medical_conditions', e.target.value)} placeholder="Geen of beschrijf hier..." /></div>
            <div><FL>Blessures of pijnen die training beïnvloeden</FL><TA rows={3} value={form.injuries} onChange={e => set('injuries', e.target.value)} placeholder="Geen of beschrijf hier..." /></div>
          </div>
        )
      case 9:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div><FL>Medicatie</FL><TI value={form.medications} onChange={e => set('medications', e.target.value)} placeholder="Geen of beschrijf hier..." /></div>
            <button type="button" onClick={() => set('surgeon_clearance', !form.surgeon_clearance)} style={{
              display: 'flex', gap: '14px', alignItems: 'center', padding: '18px',
              borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
              border: form.surgeon_clearance ? '2px solid #004aad' : '1.5px solid #E5E5E5',
              background: form.surgeon_clearance ? 'rgba(0,74,173,0.06)' : '#fff', transition: 'all 0.13s',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '6px', flexShrink: 0,
                background: form.surgeon_clearance ? '#004aad' : '#fff',
                border: form.surgeon_clearance ? '2px solid #004aad' : '1.5px solid #D0D0D0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.13s',
              }}>
                {form.surgeon_clearance && <span style={{ color: '#fff', fontSize: '13px', lineHeight: 1, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#333', lineHeight: 1.4 }}>
                Ik heb toestemming van mijn arts om te sporten
              </span>
            </button>
          </div>
        )
      case 10:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <FL>Huidig eetpatroon</FL>
              <Cards cols={2} opts={[
                ['geen_restricties', 'Geen restricties'],
                ['vegetarisch', 'Vegetarisch'],
                ['veganistisch', 'Veganistisch'],
                ['keto', 'Keto / Low Carb'],
                ['andere', 'Andere'],
              ]} val={form.current_diet} set={v => set('current_diet', v)} />
            </div>
            <div><FL>Voedselallergieën of intoleranties</FL><TI value={form.food_allergies} onChange={e => set('food_allergies', e.target.value)} placeholder="Geen of noem ze..." /></div>
          </div>
        )
      case 11:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <FL>Aantal maaltijden per dag</FL>
              <Cards cols={3} opts={[['2', '2 maaltijden'], ['3', '3 maaltijden'], ['4', '4 maaltijden'], ['5', '5 maaltijden'], ['6', '6+ maaltijden']]} val={form.meal_frequency} set={v => set('meal_frequency', v)} />
            </div>
            <div>
              <FL>Hoe vaak drink jij alcohol?</FL>
              <Cards cols={1} opts={[
                ['nooit', 'Nooit'],
                ['zelden', 'Zelden (1x/maand)'],
                ['soms', 'Soms (1–2x/week)'],
                ['regelmatig', 'Regelmatig (3+/week)'],
              ]} val={form.alcohol_frequency} set={v => set('alcohol_frequency', v)} />
            </div>
          </div>
        )
      case 12:
        return (
          <div>
            <FL>Hoeveel uur slaap je gemiddeld?</FL>
            <Cards cols={2} opts={[
              ['4.5', 'Minder dan 5 uur'],
              ['5.5', '5–6 uur'],
              ['6.5', '6–7 uur'],
              ['7.5', '7–8 uur'],
              ['8.5', '8–9 uur'],
              ['9.5', 'Meer dan 9 uur'],
            ]} val={form.sleep_hours} set={v => set('sleep_hours', v)} />
          </div>
        )
      case 13:
        return (
          <div>
            <FL>Stressniveau (1 = geen stress · 10 = heel erg gestresst)</FL>
            <Scale val={form.stress_level} set={v => set('stress_level', v)} lo="Geen stress" hi="Heel erg gestresst" />
          </div>
        )
      case 14:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <FL>Activiteitsniveau</FL>
              <Cards cols={1} opts={[
                ['sedentair', 'Sedentair – voornamelijk bureauwerk'],
                ['licht actief', 'Licht actief – korte wandelingen'],
                ['matig actief', 'Matig actief – regelmatig sport'],
                ['zeer actief', 'Zeer actief – dagelijks intensief'],
              ]} val={form.activity_level} set={v => set('activity_level', v)} />
            </div>
            <div>
              <FL>Hoeveel dagen per week train je?</FL>
              <Scale val={form.training_days_per_week} set={v => set('training_days_per_week', v)} lo="Nooit" hi="Elke dag" min={1} max={7} />
            </div>
          </div>
        )
      case 15:
        return (
          <div><FL>Trainingsachtergrond & ervaring</FL><TA rows={6} value={form.training_experience} onChange={e => set('training_experience', e.target.value)} placeholder="Bv. 2 jaar fitnesservaring, nooit gesport, ex-atleet..." /></div>
        )
      default:
        return null
    }
  }

  const pct = Math.round((step / (N - 1)) * 100)
  const meta = STEP_META[step]

  // ─── SUCCESS SCREEN ────────────────────────────────────────────────────────
  if (screen === 'done') {
    return (
      <div style={{ minHeight: '100dvh', background: '#F4F6FB', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 16px' }} data-theme="light">
        <div style={{ width: '100%', maxWidth: '560px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 72, height: 72, borderRadius: '50%', background: '#004aad', color: '#fff',
              fontSize: '1.8rem', marginBottom: '24px',
            }}>✓</div>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#111', margin: '0 0 10px', letterSpacing: '-0.5px' }}>Welkom bij Oeyen Coaching!</h1>
            <p style={{ color: '#777', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: '400px', margin: '0 auto' }}>
              Je intake is ontvangen. Dimitri neemt binnenkort contact met je op om je toegang tot het portaal in te stellen.
            </p>
          </div>

          <div style={{ background: '#fff', border: '1px solid #EAEAEA', borderRadius: '16px', padding: '28px', marginBottom: '16px' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 20px' }}>Wat nu?</p>
            {[
              { n: '1', t: 'Intake ontvangen', d: 'Dimitri bekijkt je intake en stelt je persoonlijk programma op.' },
              { n: '2', t: 'Account instellen', d: 'Je ontvangt van Dimitri je inloggegevens voor het portaal.' },
              { n: '3', t: 'Jouw portaal is klaar', d: "Bekijk je schema's, log je dagelijkse voortgang en check in bij je coach." },
            ].map(({ n, t, d }) => (
              <div key={n} style={{ display: 'flex', gap: '16px', marginBottom: '18px', alignItems: 'flex-start' }}>
                <div style={{
                  flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
                  background: '#004aad', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                }}>{n}</div>
                <div>
                  <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111', margin: '0 0 3px' }}>{t}</p>
                  <p style={{ fontSize: '0.82rem', color: '#888', margin: 0, lineHeight: 1.5 }}>{d}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid #EAEAEA', borderRadius: '16px', padding: '28px' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 16px' }}>Wat vind je in je portaal?</p>
            <div className="cols-2" style={{ gap: '10px' }}>
              {[
                { icon: '📋', label: 'Voedingsschema' },
                { icon: '🏋️', label: 'Trainingsschema' },
                { icon: '📊', label: 'Dagelijkse logs' },
                { icon: '📈', label: 'Voortgang & metingen' },
              ].map(({ icon, label }) => (
                <div key={label} style={{ background: '#F4F6FB', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#333' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#bbb', marginTop: '28px' }}>
            Vragen? Contacteer Dimitri via{' '}
            <a href="mailto:info@oeyen-coaching.be" style={{ color: '#004aad', textDecoration: 'none' }}>info@oeyen-coaching.be</a>
          </p>
        </div>
      </div>
    )
  }

  // ─── WIZARD ────────────────────────────────────────────────────────────────
  return (
    <div className="intake-layout" data-theme="light">

      {/* ── SIDEBAR ── */}
      <aside className="intake-sidebar-panel" style={{
        background: 'linear-gradient(160deg, #004aad 0%, #00338f 100%)',
        padding: '36px 24px', display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100dvh',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '3px', color: '#fff' }}>OEYEN</div>
          <div style={{ fontSize: '0.48rem', letterSpacing: '5px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>COACHING</div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Jouw intake</p>
          <p style={{ margin: '5px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.45 }}>
            Dit is het makkelijkste deel van je training.
          </p>
        </div>

        {/* Step list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '22px', overflowY: 'auto' }}>
          {SECS.map((sec, si) => {
            const start = SEC_STARTS[si]
            return (
              <div key={si}>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '1.8px', margin: '0 0 8px', textTransform: 'uppercase' }}>
                  {sec.label}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {sec.steps.map((name, i) => {
                    const flatI = start + i
                    const done = flatI < step
                    const active = flatI === step
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '8px',
                        background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                        transition: 'background 0.15s',
                      }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          background: done ? 'rgba(255,255,255,0.95)' : active ? '#fff' : 'rgba(255,255,255,0.12)',
                          border: done || active ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: done ? '11px' : '0.68rem', fontWeight: 700,
                          color: done || active ? '#004aad' : 'rgba(255,255,255,0.35)',
                          transition: 'all 0.15s',
                        }}>
                          {done ? '✓' : flatI + 1}
                        </div>
                        <span style={{
                          fontSize: '0.82rem',
                          color: active ? '#fff' : done ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)',
                          fontWeight: active ? 600 : 400,
                          transition: 'color 0.15s',
                        }}>
                          {name}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Progress */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>VOORTGANG</span>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{pct}%</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.18)', borderRadius: '99px' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: '99px', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      </aside>

      {/* ── MAIN PANEL ── */}
      <main style={{ background: '#fff', display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>

        {/* Mobile progress bar */}
        <div className="intake-mobile-bar" style={{
          padding: '14px 20px', borderBottom: '1px solid #F0F0F0',
          alignItems: 'center', gap: '14px', background: '#fff',
        }}>
          <div style={{ flex: 1, height: 4, background: '#F0F0F0', borderRadius: '99px' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#004aad', borderRadius: '99px', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: '#999', whiteSpace: 'nowrap' }}>Stap {step + 1} van {N}</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '52px 56px 32px', maxWidth: '640px' }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.72rem', fontWeight: 700, color: '#004aad', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            {SECS.find((_, si) => SEC_STARTS[si] <= step && (si === SECS.length - 1 || SEC_STARTS[si + 1] > step))?.label}
          </p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111', margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            {meta.title}
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#888', margin: '0 0 40px', lineHeight: 1.55 }}>
            {meta.sub}
          </p>

          {/* honeypot */}
          <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)}
            tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }} />

          {renderContent()}

          {stepError && (
            <p style={{ color: '#EF4444', fontSize: '0.83rem', marginTop: '14px', fontWeight: 500 }}>{stepError}</p>
          )}
          {submitError && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '12px 16px', marginTop: '16px', color: '#EF4444', fontSize: '0.83rem' }}>
              {submitError}
            </div>
          )}
        </div>

        {/* Navigation footer */}
        <div style={{
          padding: '20px 56px', borderTop: '1px solid #F2F2F2',
          display: 'flex', alignItems: 'center', gap: '16px', background: '#fff',
        }}>
          {step > 0 ? (
            <button type="button" onClick={goPrev} style={{
              padding: '12px 22px', borderRadius: '10px', border: '1.5px solid #E5E5E5',
              background: '#fff', color: '#555', fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              ← Vorige
            </button>
          ) : <div />}
          <span style={{ flex: 1, textAlign: 'center', fontSize: '0.82rem', color: '#BCBCBC' }}>
            Stap {step + 1} van {N}
          </span>
          <button type="button" onClick={goNext} disabled={loading} style={{
            padding: '13px 28px', borderRadius: '10px', border: 'none',
            background: '#004aad', color: '#fff', fontSize: '0.92rem', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1,
            display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.15s',
          }}>
            {loading ? 'Verzenden...' : step === N - 1 ? 'Intake insturen' : 'Volgende →'}
          </button>
        </div>
      </main>
    </div>
  )
}
