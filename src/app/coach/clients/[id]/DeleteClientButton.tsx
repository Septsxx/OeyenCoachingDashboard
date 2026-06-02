'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ModalWrapper from '@/components/ModalWrapper'
import { BTN_GHOST, BTN_PRIMARY } from '@/lib/ui'

export default function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/coach/clients/${clientId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Verwijderen mislukt. Probeer opnieuw.')
      setLoading(false)
      return
    }
    router.push('/coach/clients')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ ...BTN_GHOST, color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)', fontSize: '0.82rem' }}
      >
        Klant verwijderen
      </button>

      {open && (
        <ModalWrapper title="Klant verwijderen" onClose={() => { if (!loading) setOpen(false) }} width={420}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
            Weet je zeker dat je <strong style={{ color: 'var(--text)' }}>{clientName}</strong> wil verwijderen?
          </p>
          <p style={{ fontSize: '0.82rem', color: '#EF4444', marginBottom: '24px' }}>
            Alle gegevens (logs, betalingen, check-ins, metingen) worden permanent verwijderd.
          </p>
          {error && <p style={{ fontSize: '0.8rem', color: '#EF4444', marginBottom: '12px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => setOpen(false)} disabled={loading} style={BTN_GHOST}>
              Annuleren
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              style={{ ...BTN_PRIMARY, background: '#EF4444' }}
            >
              {loading ? 'Bezig…' : 'Definitief verwijderen'}
            </button>
          </div>
        </ModalWrapper>
      )}
    </>
  )
}
