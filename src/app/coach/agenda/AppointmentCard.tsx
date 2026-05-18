'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Trash2, X, Check } from 'lucide-react'
import type { Appointment, Client } from '@/lib/types'

type AppointmentWithClient = Appointment & { clients: { full_name: string } | null }

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  coaching: { label: 'Coaching',  color: '#004aad', bg: 'rgba(0,74,173,0.12)' },
  intake:   { label: 'Intake',    color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  checkin:  { label: 'Check-in',  color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  other:    { label: 'Overig',    color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
}

const S = {
  label: { display: 'block', fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-dim)', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: '6px' },
}

export default function AppointmentCard({
  appointment: a,
  clients,
  dim,
}: {
  appointment: AppointmentWithClient
  clients: Pick<Client, 'id' | 'full_name'>[]
  dim: boolean
}) {
  const router = useRouter()
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    client_id: a.client_id ?? '',
    title: a.title,
    appointment_date: a.appointment_date,
    appointment_time: a.appointment_time ?? '',
    duration_minutes: a.duration_minutes?.toString() ?? '',
    type: a.type,
    location: a.location ?? '',
    notes: a.notes ?? '',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('appointments').update({
      client_id: form.client_id || null,
      title: form.title,
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time || null,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      type: form.type,
      location: form.location || null,
      notes: form.notes || null,
    }).eq('id', a.id)
    setLoading(false)
    setEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('appointments').delete().eq('id', a.id)
    router.refresh()
  }

  const type = TYPE_LABELS[a.type] ?? TYPE_LABELS.other
  const time = a.appointment_time ? a.appointment_time.slice(0, 5) : null

  if (editing) {
    return (
      <form onSubmit={handleSave} style={{
        background: 'var(--surface)', border: '1px solid var(--border-2)',
        borderRadius: '10px', padding: '18px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={S.label}>Klant</label>
              <select value={form.client_id} onChange={e => set('client_id', e.target.value)}>
                <option value="">Geen specifieke klant</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Titel *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={S.label}>Datum *</label>
              <input type="date" value={form.appointment_date} onChange={e => set('appointment_date', e.target.value)} required />
            </div>
            <div>
              <label style={S.label}>Tijdstip</label>
              <input type="time" value={form.appointment_time} onChange={e => set('appointment_time', e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Duur (min)</label>
              <input type="number" min={5} step={5} value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} placeholder="60" />
            </div>
            <div>
              <label style={S.label}>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="coaching">Coaching</option>
                <option value="intake">Intake</option>
                <option value="checkin">Check-in</option>
                <option value="other">Overig</option>
              </select>
            </div>
          </div>

          <div>
            <label style={S.label}>Locatie</label>
            <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Bv. Online / Kantoor Antwerpen" />
          </div>

          <div>
            <label style={S.label}>Notities</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="..." />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '14px' }}>
          <button type="button" onClick={() => setEditing(false)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-2)',
            background: 'transparent', color: 'var(--text-dim)', fontSize: '0.82rem', cursor: 'pointer',
          }}>
            <X size={13} /> Annuleren
          </button>
          <button type="submit" disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: '#004aad', color: '#ffffff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}>
            <Check size={13} /> {loading ? 'Opslaan...' : 'Wijzigingen opslaan'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '16px',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '14px 18px',
      opacity: dim ? 0.6 : 1,
    }}>
      {/* Time */}
      <div style={{ width: '44px', flexShrink: 0, textAlign: 'center' }}>
        {time ? (
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{time}</span>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>—</span>
        )}
        {a.duration_minutes && (
          <p style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginTop: '2px' }}>{a.duration_minutes} min</p>
        )}
      </div>

      <div style={{ width: '1px', height: '36px', background: 'var(--border)', flexShrink: 0 }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{a.title}</span>
          <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '99px', background: type.bg, color: type.color, fontWeight: 600, flexShrink: 0 }}>
            {type.label}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {a.clients?.full_name && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{a.clients.full_name}</span>
          )}
          {a.location && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>· {a.location}</span>
          )}
        </div>
        {a.notes && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <button
          onClick={() => setEditing(true)}
          title="Bewerken"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: '6px', borderRadius: '6px', display: 'flex' }}
        >
          <Pencil size={14} />
        </button>
        {deleting ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Verwijderen?</span>
            <button
              onClick={handleDelete}
              style={{ background: '#EF4444', border: 'none', cursor: 'pointer', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}
            >
              Ja
            </button>
            <button
              onClick={() => setDeleting(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: '4px', borderRadius: '6px', fontSize: '0.72rem' }}
            >
              Nee
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDeleting(true)}
            title="Verwijderen"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: '6px', borderRadius: '6px', display: 'flex' }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
