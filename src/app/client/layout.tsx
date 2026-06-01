'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/client', label: 'Home', icon: '⌂' },
  { href: '/client/log', label: 'Log', icon: '✎' },
  { href: '/client/checkin', label: 'Check-in', icon: '↗' },
  { href: '/client/maaltijdplan', label: 'Voeding', icon: '⊜' },
  { href: '/client/training', label: 'Training', icon: '◈' },
  { href: '/client/metingen', label: 'Meting', icon: '≡' },
]

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved as 'dark' | 'light')
      document.documentElement.setAttribute('data-theme', saved)
    }
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
    document.cookie = `theme=${next}; path=/; max-age=31536000`
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '72px' }}>
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '52px',
        position: 'sticky',
        top: 0,
        background: 'var(--bg)',
        zIndex: 10,
      }}>
        <img
          src="/img/oeyen-coaching.png"
          alt="Oeyen Coaching"
          style={{ height: '60px', width: 'auto', filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)', mixBlendMode: theme === 'dark' ? 'screen' : 'multiply' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Licht thema' : 'Donker thema'}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-2)',
              borderRadius: '6px',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button onClick={logout} style={{
            background: 'transparent', border: 'none', color: 'var(--text-dim)',
            cursor: 'pointer', fontSize: '0.82rem',
          }}>
            Uitloggen
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 16px' }}>
        {children}
      </main>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 20,
      }}>
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              textDecoration: 'none',
              color: active ? '#004aad' : 'var(--text-faint)',
              fontSize: '0.65rem',
              fontWeight: active ? 600 : 400,
              letterSpacing: '0.5px',
              borderTop: active ? '2px solid #004aad' : '2px solid transparent',
              transition: 'color 0.15s',
            }}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
