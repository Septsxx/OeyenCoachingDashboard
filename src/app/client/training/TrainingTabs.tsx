'use client'
import { useState } from 'react'
import type { TrainingSchema, TrainingExercise } from '@/lib/types'

type Schema = TrainingSchema & { exercises: TrainingExercise[] }

const stickyTh = {
  position: 'sticky' as const,
  left: 0,
  background: 'var(--surface-2)',
  zIndex: 1,
  padding: '8px 12px',
  fontWeight: 600,
  fontSize: '0.68rem',
  color: 'var(--text-faint)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.4px',
  whiteSpace: 'nowrap' as const,
  borderRight: '1px solid var(--border)',
}

const stickyTd = {
  position: 'sticky' as const,
  left: 0,
  background: 'var(--surface)',
  zIndex: 1,
  padding: '10px 12px',
  fontWeight: 600,
  fontSize: '0.78rem',
  color: 'var(--text-muted)',
  borderRight: '1px solid var(--border)',
  borderBottom: '1px solid var(--surface-2)',
  whiteSpace: 'nowrap' as const,
}

const setTh = {
  padding: '8px 12px',
  textAlign: 'center' as const,
  color: '#004aad',
  fontWeight: 600,
  fontSize: '0.68rem',
  minWidth: '72px',
  whiteSpace: 'nowrap' as const,
  borderRight: '1px solid var(--surface-2)',
}

export default function TrainingTabs({
  schemas,
}: {
  schemas: Schema[]
  clientId: string
  initialLogs: unknown[]
}) {
  const [activeId, setActiveId] = useState(schemas[0]?.id ?? '')

  const schema = schemas.find(s => s.id === activeId) ?? schemas[0]
  const weeks = Array.from({ length: schema.weeks_count }, (_, i) => i + 1)

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    fontSize: '0.82rem',
    fontWeight: active ? 600 : 400,
    color: active ? '#004aad' : 'var(--text-faint)',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #004aad' : '2px solid transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  })

  return (
    <div>
      {schemas.length > 1 && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px', gap: '4px', overflowX: 'auto' }}>
          {schemas.map(s => (
            <button key={s.id} style={tabStyle(s.id === activeId)} onClick={() => setActiveId(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        {schemas.length === 1 && <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{schema.name}</h2>}
        <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginLeft: 'auto' }}>
          {schema.weeks_count} weken · {schema.exercises.length} oefeningen
        </span>
      </div>

      {schema.exercises.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.82rem' }}>
          Nog geen oefeningen in dit schema.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {schema.exercises.map(ex => (
            <div key={ex.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                  {ex.label}) {ex.name}
                </p>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{ex.sets_count} sets</span>
                  <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{ex.reps} reps</span>
                  <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{ex.tempo}</span>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)' }}>
                      <th style={stickyTh}>Week</th>
                      {Array.from({ length: ex.sets_count }, (_, i) => (
                        <th key={i} style={setTh}>Set {i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.map(w => (
                      <tr key={w}>
                        <td style={stickyTd}>{w}</td>
                        {Array.from({ length: ex.sets_count }, (_, i) => (
                          <td key={i} style={{
                            borderBottom: '1px solid var(--surface-2)',
                            borderRight: '1px solid var(--surface-2)',
                            minWidth: '72px',
                            height: '40px',
                            textAlign: 'center',
                            fontSize: '0.78rem',
                            color: 'var(--text-faint)',
                            padding: '0 6px',
                          }}>
                            —
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
