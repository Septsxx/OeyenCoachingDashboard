'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PACKAGES, type PackageType } from '@/lib/types'
import { BTN_GHOST, BTN_PRIMARY, LABEL } from '@/lib/ui'
import { addMonths, format } from 'date-fns'
import ModalWrapper from '@/components/ModalWrapper'

export default function PaymentModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const [pkg, setPkg] = useState<PackageType>('3_months')
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const pkgInfo = PACKAGES[pkg]
  const expiryDate = format(addMonths(new Date(paymentDate), pkgInfo.months), 'yyyy-MM-dd')

  async function handleSave() {
    setLoading(true)
    await supabase.from('payments').insert({
      client_id: clientId,
      package: pkg,
      amount: pkgInfo.price,
      payment_date: paymentDate,
      expiry_date: expiryDate,
      notes: notes || null,
    })
    router.refresh()
    onClose()
  }

  return (
    <ModalWrapper title="Betaling toevoegen" onClose={onClose}>
      <div style={{ marginBottom: '16px' }}>
        <label style={LABEL}>Pakket</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(Object.entries(PACKAGES) as [PackageType, typeof PACKAGES[PackageType]][]).map(([key, p]) => (
            <button key={key} onClick={() => setPkg(key)} style={{
              flex: 1, padding: '12px 8px', borderRadius: '8px', cursor: 'pointer',
              border: `1px solid ${pkg === key ? 'var(--text)' : 'var(--border-2)'}`,
              background: pkg === key ? 'var(--surface-2)' : 'transparent',
              color: pkg === key ? 'var(--text)' : 'var(--text-faint)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>€{p.price}</div>
              <div style={{ fontSize: '0.72rem', marginTop: '2px' }}>{p.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={LABEL}>Betaaldatum</label>
        <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
      </div>

      <div style={{ background: 'var(--surface-2)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
        Vervaldatum: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{expiryDate}</span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={LABEL}>Notities (optioneel)</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Bv. betaald via overschrijving" />
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={BTN_GHOST}>Annuleren</button>
        <button onClick={handleSave} disabled={loading} style={{ ...BTN_PRIMARY, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Opslaan...' : 'Betaling opslaan'}
        </button>
      </div>
    </ModalWrapper>
  )
}
