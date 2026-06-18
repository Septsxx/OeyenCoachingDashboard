'use client'
import { X } from 'lucide-react'

export default function ModalWrapper({
  title,
  onClose,
  children,
  width = 440,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  width?: number
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: '2px' }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
