'use client'
import { useState, useEffect } from 'react'
import { Bell, BellOff, X, Check } from 'lucide-react'

const DAYS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
const HOURS = Array.from({ length: 24 }, (_, i) => ({ value: i, label: `${i.toString().padStart(2, '0')}:00` }))

interface Prefs {
  daily_enabled: boolean
  daily_hour: number
  weekly_enabled: boolean
  weekly_day: number
  weekly_hour: number
}

async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  return navigator.serviceWorker.register('/sw.js')
}

async function getPushSubscription(reg: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  const publicKeyRes = await fetch('/api/push/vapid-key')
  const { publicKey } = await publicKeyRes.json()
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export default function NotificationSettings() {
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>({
    daily_enabled: false, daily_hour: 20,
    weekly_enabled: false, weekly_day: 1, weekly_hour: 10,
  })
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission)

    fetch('/api/push/subscribe')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setPrefs({
            daily_enabled: data.daily_enabled ?? false,
            daily_hour: data.daily_hour ?? 20,
            weekly_enabled: data.weekly_enabled ?? false,
            weekly_day: data.weekly_day ?? 1,
            weekly_hour: data.weekly_hour ?? 10,
          })
          setSubscribed(true)
        }
      })
      .catch(() => {})
  }, [])

  async function save() {
    setSaving(true)
    try {
      const reg = await registerSW()
      if (!reg) { setSaving(false); return }

      if (permission !== 'granted') {
        const result = await Notification.requestPermission()
        setPermission(result)
        if (result !== 'granted') { setSaving(false); return }
      }

      const pushSub = await getPushSubscription(reg)
      if (!pushSub) { setSaving(false); return }

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: pushSub.toJSON(), ...prefs }),
      })
      setSubscribed(true)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function unsubscribe() {
    await fetch('/api/push/subscribe', { method: 'DELETE' })
    const reg = await registerSW()
    if (reg) {
      const sub = await reg.pushManager.getSubscription()
      await sub?.unsubscribe()
    }
    setSubscribed(false)
    setPrefs(p => ({ ...p, daily_enabled: false, weekly_enabled: false }))
  }

  const hasAnyEnabled = prefs.daily_enabled || prefs.weekly_enabled

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Meldingen instellen"
        style={{
          background: 'transparent', border: 'none',
          color: hasAnyEnabled ? '#004aad' : 'var(--text-dim)',
          cursor: 'pointer', width: '34px', height: '34px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '8px', position: 'relative',
        }}
      >
        {hasAnyEnabled ? <Bell size={16} /> : <BellOff size={16} />}
        {hasAnyEnabled && (
          <span style={{
            position: 'absolute', top: '5px', right: '5px',
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#004aad',
          }} />
        )}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg)', borderRadius: '20px 20px 0 0',
              padding: '24px 20px 40px', width: '100%', maxWidth: '480px',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
                Meldingen
              </h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
                <X size={20} />
              </button>
            </div>

            {permission === 'denied' && (
              <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '16px' }}>
                Meldingen zijn geblokkeerd in je browser. Ga naar je browserinstellingen om ze toe te staan.
              </p>
            )}

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>Dagelijks log</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Herinnering als je log nog niet is ingevuld</div>
                </div>
                <Toggle value={prefs.daily_enabled} onChange={v => setPrefs(p => ({ ...p, daily_enabled: v }))} />
              </div>
              {prefs.daily_enabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Tijdstip:</span>
                  <select
                    value={prefs.daily_hour}
                    onChange={e => setPrefs(p => ({ ...p, daily_hour: +e.target.value }))}
                    style={selectStyle}
                  >
                    {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>Wekelijkse check-in</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Herinnering als je check-in nog niet is ingevuld</div>
                </div>
                <Toggle value={prefs.weekly_enabled} onChange={v => setPrefs(p => ({ ...p, weekly_enabled: v }))} />
              </div>
              {prefs.weekly_enabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Op:</span>
                  <select
                    value={prefs.weekly_day}
                    onChange={e => setPrefs(p => ({ ...p, weekly_day: +e.target.value }))}
                    style={selectStyle}
                  >
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>om:</span>
                  <select
                    value={prefs.weekly_hour}
                    onChange={e => setPrefs(p => ({ ...p, weekly_hour: +e.target.value }))}
                    style={selectStyle}
                  >
                    {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={save}
                disabled={saving || permission === 'denied'}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: saved ? '#16a34a' : '#004aad', color: '#fff',
                  border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saved ? <><Check size={16} /> Opgeslagen</> : saving ? 'Bezig…' : 'Opslaan'}
              </button>
              {subscribed && (
                <button
                  onClick={unsubscribe}
                  style={{
                    padding: '12px 16px', borderRadius: '10px',
                    background: 'transparent', color: '#dc2626',
                    border: '1px solid #dc2626', cursor: 'pointer', fontSize: '0.85rem',
                  }}
                >
                  Uitschrijven
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px',
        background: value ? '#004aad' : 'var(--border)',
        border: 'none', cursor: 'pointer', position: 'relative',
        flexShrink: 0, transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: '2px',
        left: value ? '22px' : '2px',
        width: '20px', height: '20px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px', borderRadius: '8px',
  border: '1px solid var(--border)', background: 'var(--bg)',
  color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer',
}
