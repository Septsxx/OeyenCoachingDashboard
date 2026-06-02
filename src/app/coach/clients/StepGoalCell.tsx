'use client'

import { useState, useRef } from 'react'

export function StepGoalCell({ clientId, initial }: { clientId: string; initial: number | null }) {
  const [value, setValue] = useState<string>(initial != null ? String(initial) : '')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function save(raw: string) {
    const num = raw === '' ? null : parseInt(raw, 10)
    if (isNaN(num as number) && raw !== '') return
    setSaving(true)
    await fetch('/api/coach/clients/step-goal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, stepGoal: num }),
    })
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={value}
        autoFocus
        min={0}
        max={99999}
        onChange={e => setValue(e.target.value)}
        onBlur={() => save(value)}
        onKeyDown={e => { if (e.key === 'Enter') save(value); if (e.key === 'Escape') setEditing(false) }}
        style={{
          width: '80px', fontSize: '0.82rem', padding: '3px 6px',
          border: '1px solid var(--border)', borderRadius: '6px',
          background: 'var(--surface)', color: 'var(--text)',
        }}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Klik om aan te passen"
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
        borderRadius: '4px', fontSize: '0.82rem', color: value ? 'var(--text)' : 'var(--text-faint)',
        textAlign: 'left',
      }}
    >
      {saving ? '…' : value ? `${Number(value).toLocaleString('nl-BE')}` : '—'}
    </button>
  )
}
