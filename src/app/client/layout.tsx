'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Home, Activity, Pill, Utensils, Dumbbell, Ruler, Sun, Moon, LogOut } from 'lucide-react'

const NAV = [
  { href: '/client', label: 'Home', Icon: Home },
  { href: '/client/tijdlijn', label: 'Tijdlijn', Icon: Activity },
  { href: '/client/supps', label: 'Supps', Icon: Pill },
  { href: '/client/maaltijdplan', label: 'Voeding', Icon: Utensils },
  { href: '/client/training', label: 'Training', Icon: Dumbbell },
  { href: '/client/metingen', label: 'Meting', Icon: Ruler },
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
        padding: '0 20px',
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
          src="/img/Oeyen-Coaching-Logo-Coach.png"
          alt="Oeyen Coaching"
          style={{ height: '38px', width: 'auto', borderRadius: '4px' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Licht thema' : 'Donker thema'}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--text-dim)', cursor: 'pointer',
              width: '34px', height: '34px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '8px',
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={logout}
            title="Uitloggen"
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--text-dim)', cursor: 'pointer',
              width: '34px', height: '34px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '8px',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 16px' }}>
        {children}
      </main>

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
        {NAV.map(({ href, label, Icon }) => {
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
              fontSize: '0.58rem',
              fontWeight: active ? 600 : 400,
              letterSpacing: '0.3px',
            }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: active ? 'rgba(0, 74, 173, 0.1)' : 'transparent',
                borderRadius: '10px',
                padding: '5px 10px',
                transition: 'background 0.2s',
              }}>
                <Icon size={18} strokeWidth={active ? 2.2 : 1.7} />
              </span>
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
