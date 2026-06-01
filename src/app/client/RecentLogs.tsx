'use client'
import { useState } from 'react'
import type { DailyLog } from '@/lib/types'
import { formatDate } from '@/lib/ui'

const INITIAL = 3

export default function RecentLogs({ logs }: { logs: DailyLog[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? logs : logs.slice(0, INITIAL)
  const hasMore = logs.length > INITIAL

  if (logs.length === 0) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Recente logs</p>
        </div>
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-faint)', marginBottom: '12px' }}>Nog geen logs bijgehouden.</p>
          <a href="/client/log" style={{ fontSize: '0.82rem', color: '#004aad', textDecoration: 'none', fontWeight: 600 }}>Begin met je eerste daglog →</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Recente logs</p>
      </div>

      {visible.map(l => (
        <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid var(--surface-2)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatDate(l.log_date)}</span>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem' }}>
            {l.weight_kg && <span style={{ color: 'var(--text)' }}>{l.weight_kg} kg</span>}
            {l.steps && <span style={{ color: 'var(--text-dim)' }}>{l.steps.toLocaleString()} stappen</span>}
            {l.nutrition_adherence && <span style={{ color: 'var(--text-dim)' }}>Voeding {l.nutrition_adherence}/5</span>}
          </div>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            width: '100%',
            padding: '11px 20px',
            background: 'none',
            border: 'none',
            borderTop: expanded ? '1px solid var(--surface-2)' : 'none',
            color: 'var(--text-dim)',
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span style={{
            display: 'inline-block',
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            fontSize: '0.65rem',
          }}>▼</span>
          {expanded ? 'Minder tonen' : `${logs.length - INITIAL} meer tonen`}
        </button>
      )}
    </div>
  )
}
