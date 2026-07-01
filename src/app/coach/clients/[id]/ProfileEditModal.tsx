'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Client } from '@/lib/types'
import { BTN_GHOST, BTN_PRIMARY, LABEL } from '@/lib/ui'
import ModalWrapper from '@/components/ModalWrapper'

export default function ProfileEditModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState(client.full_name ?? '')
  const [email, setEmail] = useState(client.email ?? '')
  const [phone, setPhone] = useState(client.phone ?? '')
  const [dob, setDob] = useState(client.dob ?? '')
  const [gender, setGender] = useState(client.gender ?? '')
  const [currentDiet, setCurrentDiet] = useState(client.current_diet ?? '')
  const [foodAllergies, setFoodAllergies] = useState(client.food_allergies ?? '')
  const [trainingDays, setTrainingDays] = useState(client.training_days_per_week?.toString() ?? '')
  const [startWeight, setStartWeight] = useState(client.start_weight_kg?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!fullName.trim()) { setError('Naam is verplicht'); return }
    setLoading(true)
    setError(null)
    const { error: dbErr } = await supabase.from('clients').update({
      full_name: fullName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      dob: dob || null,
      gender: gender || null,
      current_diet: currentDiet.trim() || null,
      food_allergies: foodAllergies.trim() || null,
      training_days_per_week: trainingDays ? parseInt(trainingDays, 10) : null,
      start_weight_kg: startWeight ? parseFloat(startWeight) : null,
      updated_at: new Date().toISOString(),
    }).eq('id', client.id)
    setLoading(false)
    if (dbErr) { setError('Opslaan mislukt. Probeer opnieuw.'); return }
    router.refresh()
    onClose()
  }

  const field = (label: string, input: React.ReactNode) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={LABEL}>{label}</label>
      {input}
    </div>
  )

  return (
    <ModalWrapper title="Profiel bewerken" onClose={onClose} width={560}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        {field('Naam', (
          <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Volledige naam" />
        ))}
        {field('E-mail', (
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@voorbeeld.be" />
        ))}
        {field('Telefoon', (
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+32 …" />
        ))}
        {field('Geboortedatum', (
          <input type="date" value={dob} onChange={e => setDob(e.target.value)} />
        ))}
        {field('Geslacht', (
          <select value={gender} onChange={e => setGender(e.target.value)}>
            <option value="">— Selecteer —</option>
            <option value="man">Man</option>
            <option value="vrouw">Vrouw</option>
            <option value="anders">Anders</option>
          </select>
        ))}
        {field('Trainingsdagen / week', (
          <input
            type="number" min={0} max={7} value={trainingDays}
            onChange={e => setTrainingDays(e.target.value)}
            placeholder="bv. 4"
          />
        ))}
        {field('Startgewicht (kg)', (
          <input
            type="number" step="0.1" min={0} value={startWeight}
            onChange={e => setStartWeight(e.target.value)}
            placeholder="bv. 82.5"
          />
        ))}
      </div>

      {field('Huidig eetpatroon', (
        <input value={currentDiet} onChange={e => setCurrentDiet(e.target.value)} placeholder="bv. Mixed, Vegetarisch, …" />
      ))}
      {field('Voedselallergieën', (
        <input value={foodAllergies} onChange={e => setFoodAllergies(e.target.value)} placeholder="bv. Lactose, Gluten, …" />
      ))}

      {error && (
        <p style={{ color: '#EF4444', fontSize: '0.8rem', marginBottom: '12px' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button onClick={onClose} style={BTN_GHOST}>Annuleren</button>
        <button onClick={handleSave} disabled={loading} style={{ ...BTN_PRIMARY, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>
    </ModalWrapper>
  )
}
