'use client'
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, LayoutDashboard, LogOut, CreditCard, ClipboardList, Sun, Moon, Calendar, Salad, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

const NAV = [
  { href: '/coach', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/coach/clients', label: 'Klanten', icon: Users },
  { href: '/coach/payments', label: 'Financiën', icon: CreditCard },
  { href: '/coach/checkins', label: 'Check-ins', icon: ClipboardList },
  { href: '/coach/agenda', label: 'Agenda', icon: Calendar },
  { href: '/coach/voeding', label: 'Voeding', icon: Salad },
]

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved as 'dark' | 'light')
      document.documentElement.setAttribute('data-theme', saved)
    }
  }, [])

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [pathname])

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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Mobile top header */}
      {isMobile && (
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '52px',
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', zIndex: 30,
        }}>
          <img
            src="/img/oeyen-coaching.png"
            alt="Oeyen Coaching"
            style={{ height: '38px', width: 'auto', filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)', mixBlendMode: theme === 'dark' ? 'screen' : 'multiply' }}
          />
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', padding: '6px' }}
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>
      )}

      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 38 }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        background: 'var(--bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        ...(isMobile ? {
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 40,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        } : {
          position: 'sticky',
          top: 0,
          height: '100vh',
        }),
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img
            src="/img/oeyen-coaching.png"
            alt="Oeyen Coaching"
            style={{ height: '60px', width: 'auto', filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)', mixBlendMode: theme === 'dark' ? 'screen' : 'multiply' }}
          />
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex', padding: '4px', marginLeft: '8px' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/coach' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '4px',
                fontSize: '0.85rem',
                fontWeight: active ? 600 : 400,
                color: active ? '#004aad' : 'var(--text-dim)',
                background: active ? 'rgba(0,74,173,0.1)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}>
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer: theme toggle + logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button onClick={toggleTheme} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            width: '100%',
            fontSize: '0.85rem',
            color: 'var(--text-dim)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Licht thema' : 'Donker thema'}
          </button>
          <button onClick={logout} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            width: '100%',
            fontSize: '0.85rem',
            color: 'var(--text-dim)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}>
            <LogOut size={16} />
            Uitloggen
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', ...(isMobile ? { paddingTop: '52px' } : {}) }}>
        {children}
      </main>
    </div>
  )
}
