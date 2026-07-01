'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import ModalWrapper from '@/components/ModalWrapper'
import { LABEL, BTN_PRIMARY, BTN_GHOST, GRID2 } from '@/lib/ui'

const DW_COEFFICIENTS = {
  man: [
    { max: 19, c: 1.1620, m: 0.0630 },
    { max: 29, c: 1.1631, m: 0.0632 },
    { max: 39, c: 1.1422, m: 0.0544 },
    { max: 49, c: 1.1620, m: 0.0700 },
    { max: Infinity, c: 1.1715, m: 0.0779 },
  ],
  vrouw: [
    { max: 19, c: 1.1549, m: 0.0678 },
    { max: 29, c: 1.1599, m: 0.0717 },
    { max: 39, c: 1.1423, m: 0.0632 },
    { max: 49, c: 1.1333, m: 0.0612 },
    { max: Infinity, c: 1.1339, m: 0.0645 },
  ],
}

function calcBF(biceps: number, triceps: number, subscapular: number, suprailiac: number, age: number, gender?: string | null): number {
  const sum = biceps + triceps + subscapular + suprailiac
  const table = gender === 'vrouw' ? DW_COEFFICIENTS.vrouw : DW_COEFFICIENTS.man
  const { c, m } = table.find(row => age <= row.max) ?? table[table.length - 1]
  const density = c - m * Math.log10(sum)
  return +(((4.95 / density) - 4.5) * 100).toFixed(2)
}

export default function SkinfoldModal({ clientId, gender, onClose }: { clientId: string; gender?: string | null; onClose: () => void }) {
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
  const bf = allFilled ? calcBF(+biceps, +triceps, +subscapular, +suprailiac, +age, gender) : null
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
