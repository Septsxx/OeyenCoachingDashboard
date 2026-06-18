'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import ModalWrapper from '@/components/ModalWrapper'
import { LABEL, BTN_PRIMARY, BTN_GHOST, GRID2 } from '@/lib/ui'

function calcBF(biceps: number, triceps: number, subscapular: number, suprailiac: number, age: number): number {
  const sum = biceps + triceps + subscapular + suprailiac
  const density = 1.1631 - 0.0632 * Math.log(sum)
  return +(((4.95 / density) - 4.5) * 100).toFixed(2)
}

export default function SkinfoldModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [age, setAge] = useState('')
  const [biceps, setBiceps] = useState('')
  const [triceps, setTriceps] = useState('')
  const [subscapular, setSubscapular] = useState('')
  const [suprailiac, setSuprailiac] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const allFilled = biceps && triceps && subscapular && suprailiac && age
  const bf = allFilled ? calcBF(+biceps, +triceps, +subscapular, +suprailiac, +age) : null
  const sum = allFilled ? +biceps + +triceps + +subscapular + +suprailiac : null

  async function handleSave() {
    if (!allFilled) return
    setLoading(true)
    await supabase.from('skinfold_measurements').insert({
      client_id: clientId,
      measured_at: date,
      age_at_measurement: +age,
      biceps_mm: +biceps, triceps_mm: +triceps,
      subscapular_mm: +subscapular, suprailiac_mm: +suprailiac,
      bf_pct: bf,
      notes: notes || null,
    })
    router.refresh()
    onClose()
  }

  const fields: [string, string, React.Dispatch<React.SetStateAction<string>>][] = [
    ['Biceps (mm)', biceps, setBiceps],
    ['Triceps (mm)', triceps, setTriceps],
    ['Subscapulair (mm)', subscapular, setSubscapular],
    ['Suprailiacaal (mm)', suprailiac, setSuprailiac],
  ]

  return (
    <ModalWrapper title="Huidplooimeting" onClose={onClose}>
      <div style={GRID2}>
        <div style={{ marginBottom: '12px' }}>
          <label style={LABEL}>Datum</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={LABEL}>Leeftijd</label>
          <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="32" />
        </div>
        {fields.map(([label, value, setter]) => (
          <div key={label} style={{ marginBottom: '12px' }}>
            <label style={LABEL}>{label}</label>
            <input type="number" step="0.5" value={value} onChange={e => setter(e.target.value)} placeholder="0.0" />
          </div>
        ))}
      </div>

      {bf !== null && sum !== null && (
        <div style={{ background: 'var(--surface-2)', borderRadius: '8px', padding: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Som: {sum.toFixed(1)} mm</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>BF%: {bf}%</span>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label style={LABEL}>Notities</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optioneel" />
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={BTN_GHOST}>Annuleren</button>
        <button onClick={handleSave} disabled={!allFilled || loading} style={{ ...BTN_PRIMARY, opacity: (!allFilled || loading) ? 0.5 : 1, cursor: !allFilled ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Opslaan...' : 'Meting opslaan'}
        </button>
      </div>
    </ModalWrapper>
  )
}
