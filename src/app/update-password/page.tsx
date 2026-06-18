'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const searchParams = useSearchParams()
  const isNewAccount = searchParams.get('welkom') === '1'
  const supabase = createClient()

  useEffect(() => {
    // Verify there is an active recovery session before allowing password change
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      } else {
        window.location.href = '/login?error=auth'
      }
    })
  }, [])

  function getStrength(pw: string): { label: string; color: string; width: string } {
    if (pw.length === 0) return { label: '', color: 'transparent', width: '0%' }
    if (pw.length < 8) return { label: 'Te kort', color: '#EF4444', width: '25%' }
    const hasUpper = /[A-Z]/.test(pw)
    const hasLower = /[a-z]/.test(pw)
    const hasNumber = /[0-9]/.test(pw)
    const hasSpecial = /[^A-Za-z0-9]/.test(pw)
    const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length
    if (score <= 2) return { label: 'Zwak', color: '#F97316', width: '50%' }
    if (score === 3) return { label: 'Goed', color: '#EAB308', width: '75%' }
    return { label: 'Sterk', color: '#22C55E', width: '100%' }
  }

  const strength = getStrength(password)

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Wachtwoord moet minstens 8 tekens bevatten.')
      return
    }
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
      setTimeout(() => { window.location.href = '/client' }, 2500)
    }
  }

  if (!sessionReady) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#666', fontSize: '0.85rem' }}>Verificatie...</div>
      </div>
    )
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
            {isNewAccount ? 'Welkom! Stel je wachtwoord in' : 'Nieuw wachtwoord instellen'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '28px' }}>
            {isNewAccount
              ? 'Kies een wachtwoord om toegang te krijgen tot je coaching portaal.'
              : 'Kies een sterk wachtwoord van minstens 8 tekens.'}
          </p>

          {done ? (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '14px', fontSize: '0.85rem', color: '#22C55E' }}>
              {isNewAccount
                ? 'Account klaar! Je wordt doorgestuurd naar je portaal...'
                : 'Wachtwoord succesvol gewijzigd! Je wordt doorgestuurd...'}
            </div>
          ) : (
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                  Nieuw wachtwoord
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0',
                      color: '#666',
                      fontSize: '0.8rem',
                      lineHeight: 1,
                    }}
                    aria-label={showPassword ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
                {password.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ height: '3px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: strength.width, background: strength.color, transition: 'width 0.3s, background 0.3s' }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: strength.color, marginTop: '4px' }}>{strength.label}</div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                  Bevestig wachtwoord
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                {confirm.length > 0 && password !== confirm && (
                  <div style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: '4px' }}>Wachtwoorden komen niet overeen</div>
                )}
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
