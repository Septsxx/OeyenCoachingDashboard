'use client'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const params = useSearchParams()
  const urlError = params.get('error')
  const [error, setError] = useState(
    urlError === 'no_profile' ? 'Dit account heeft geen gekoppeld klantprofiel. Neem contact op met je coach.' :
    urlError === 'auth' ? 'Authenticatie mislukt. Probeer opnieuw.' : ''
  )
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      window.location.href = profile?.role === 'coach' ? '/coach' : '/client'
    } catch (err: any) {
      setError(err?.message ?? 'Onbekende fout. Probeer opnieuw.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
          E-mailadres
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="naam@email.com"
          required
        />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
          Wachtwoord
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
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
        {loading ? 'Inloggen...' : 'Inloggen'}
      </button>
    </form>
  )
}

export default function LoginPage() {
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
            Welkom terug
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '28px' }}>
            Log in op je account
          </p>

          <Suspense fallback={<div style={{ color: '#666', fontSize: '0.85rem' }}>Laden...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
