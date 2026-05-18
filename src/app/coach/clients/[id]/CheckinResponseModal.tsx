'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { WeeklyCheckin } from '@/lib/types'
import ModalWrapper from '@/components/ModalWrapper'
import { LABEL, BTN_PRIMARY, BTN_GHOST } from '@/lib/ui'

export default function CheckinResponseModal({ checkin, onClose }: { checkin: WeeklyCheckin; onClose: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const [response, setResponse] = useState(checkin.coach_response ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!response.trim()) return
    setLoading(true)
    await supabase
      .from('weekly_checkins')
      .update({ coach_response: response, coach_responded_at: new Date().toISOString() })
      .eq('id', checkin.id)
    router.refresh()
    onClose()
  }

  const fields: [string, string | null][] = [
    ['Gym prestaties', checkin.gym_performance],
    ['Herstel', checkin.recovery],
    ['Stress', checkin.stress_notes],
    ['Algemene notities', checkin.general_notes],
  ]

  return (
    <ModalWrapper title={`Check-in beantwoorden — Week ${checkin.week_number}`} onClose={onClose} width={520}>
      <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {fields.filter(([, v]) => v).map(([label, value]) => (
          <div key={label} style={{ background: 'var(--surface-2)', borderRadius: '8px', padding: '12px' }}>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={LABEL}>Jouw respons</label>
        <textarea
          value={response}
          onChange={e => setResponse(e.target.value)}
          rows={5}
          placeholder="Schrijf hier je feedback voor de klant..."
          style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={BTN_GHOST}>Annuleren</button>
        <button
          onClick={handleSave}
          disabled={!response.trim() || loading}
          style={{ ...BTN_PRIMARY, opacity: (!response.trim() || loading) ? 0.5 : 1, cursor: !response.trim() ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Opslaan...' : 'Respons opslaan'}
        </button>
      </div>
    </ModalWrapper>
  )
}
