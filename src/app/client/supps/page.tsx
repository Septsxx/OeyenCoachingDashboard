'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Supplement } from '@/lib/types'

export default function SuppsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      let clientId: string | null = null
      const { data: byUserId } = await supabase.from('clients').select('id').eq('user_id', user.id).maybeSingle()
      if (byUserId) {
        clientId = byUserId.id
      } else if (user.email) {
        const { data: byEmail } = await supabase.from('clients').select('id').eq('email', user.email).maybeSingle()
        if (byEmail) {
          await supabase.from('clients').update({ user_id: user.id }).eq('id', byEmail.id)
          clientId = byEmail.id
        }
      }
      if (!clientId) { router.push('/login'); return }
      const { data } = await supabase.from('supplements').select('*').eq('client_id', clientId).order('sort_order')
      setSupplements(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem' }}>Laden...</p>

  return (
    <div>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '4px' }}>Supplementen</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '28px' }}>Jouw aanbevolen supplementenschema</p>

      {supplements.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--text-faint)' }}>
          <p>Nog geen supplementen ingesteld door je coach</p>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#004aad' }}>
                  {['Supplement', 'Dosis', 'Wanneer?', 'Notities'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#ffffff', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {supplements.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--surface-2)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '12px 14px', color: '#004aad', fontWeight: 600 }}>{s.dose ?? '—'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{s.timing ?? '—'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-dim)' }}>{s.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
