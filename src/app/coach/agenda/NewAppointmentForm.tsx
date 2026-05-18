'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'
import type { Client } from '@/lib/types'

const TODAY = new Date().toISOString().slice(0, 10)

const EMPTY = {
  client_id: '',
  title: '',
  appointment_date: TODAY,
  appointment_time: '',
  duration_minutes: '60',
  type: 'coaching',
  location: '',
  notes: '',
}

const S = {
  label: { display: 'block', fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-dim)', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: '6px' },
  field: { marginBottom: '0' },
  grid: (cols: string) => ({ display: 'grid', gridTemplateColumns: cols, gap: '12px' }),
}

export default function NewAppointmentForm({ clients }: { clients: Pick<Client, 'id' | 'full_name'>[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function cancel() {
    setOpen(false)
    setForm({ ...EMPTY })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('appointments').insert({
      client_id: form.client_id || null,
      title: form.title,
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time || null,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      type: form.type,
      location: form.location || null,
      notes: form.notes || null,
    })
    setLoading(false)
    if (error) { alert(error.message); return }
    cancel()
    router.refresh()
  }

  return (
    <div style={{ marginBottom: '28px' }}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 18px', borderRadius: '8px',
          background: '#004aad', color: '#ffffff',
          border: 'none', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
        }}>
          <Plus size={15} /> Nieuwe afspraak
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{
          background: 'var(--surface)', border: '1px solid var(--border-2)',
          borderRadius: '12px', padding: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>Nieuwe afspraak</p>
            <button type="button" onClick={cancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={S.grid('1fr 1fr')}>
              <div style={S.field}>
                <label style={S.label}>Klant</label>
                <select value={form.client_id} onChange={e => set('client_id', e.target.value)}>
                  <option value="">Geen specifieke klant</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Titel *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Bv. Coaching sessie" />
              </div>
            </div>

            <div style={S.grid('1fr 1fr 1fr 1fr')}>
              <div style={S.field}>
                <label style={S.label}>Datum *</label>
                <input type="date" value={form.appointment_date} onChange={e => set('appointment_date', e.target.value)} required />
              </div>
              <div style={S.field}>
                <label style={S.label}>Tijdstip</label>
                <input type="time" value={form.appointment_time} onChange={e => set('appointment_time', e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Duur (min)</label>
                <input type="number" min={5} step={5} value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} placeholder="60" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Type</label>
                <select value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="coaching">Coaching</option>
                  <option value="intake">Intake</option>
                  <option value="checkin">Check-in</option>
                  <option value="other">Overig</option>
                </select>
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Locatie</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Bv. Online / Kantoor Antwerpen" />
            </div>

            <div style={S.field}>
              <label style={S.label}>Notities</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="..." />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" onClick={cancel} style={{
              padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border-2)',
              background: 'transparent', color: 'var(--text-dim)', fontSize: '0.85rem', cursor: 'pointer',
            }}>
              Annuleren
            </button>
            <button type="submit" disabled={loading} style={{
              padding: '9px 20px', borderRadius: '8px', border: 'none',
              background: '#004aad', color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            }}>
              {loading ? 'Opslaan...' : 'Afspraak opslaan'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
