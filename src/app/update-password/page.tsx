'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Wachtwoorden komen niet overeen.')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      setTimeout(() => { window.location.href = '/login' }, 2500)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            letterSpacing: '4px',
            textTransform: 'uppercase',
            color: '#FFFFFF',
            marginBottom: '4px',
          }}>
            OEYEN
          </div>
          <div style={{
            fontSize: '0.65rem',
            letterSpacing: '6px',
            textTransform: 'uppercase',
            color: '#666',
          }}>
            COACHING
          </div>
        </div>

        <div style={{
          background: '#111111',
          border: '1px solid #222',
          borderRadius: '16px',
          padding: '36px',
        }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#FFF' }}>
            Nieuw wachtwoord instellen
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '28px' }}>
            Kies een nieuw wachtwoord voor je account.
          </p>

          {done ? (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '14px', fontSize: '0.85rem', color: '#22C55E' }}>
              Wachtwoord succesvol gewijzigd! Je wordt doorgestuurd naar de loginpagina...
            </div>
          ) : (
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                  Nieuw wachtwoord
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                  Bevestig wachtwoord
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.8rem', color: '#EF4444' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading ? '#333' : '#FFFFFF',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {loading ? 'Opslaan...' : 'Wachtwoord opslaan'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
