'use client'
import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Appointment, Client } from '@/lib/types'

type ApptWithClient = Appointment & { clients: { full_name: string } | null }

const TYPE_COLOR: Record<string, string> = {
  coaching: '#004aad',
  intake:   '#8B5CF6',
  checkin:  '#22C55E',
  other:    '#6B7280',
}

const TYPE_LABEL: Record<string, string> = {
  coaching: 'Coaching',
  intake:   'Intake',
  checkin:  'Check-in',
  other:    'Overig',
}

const DAY_HEADERS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

const BTN = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  cursor: 'pointer',
  color: 'var(--text-dim)',
  padding: '4px 8px',
  display: 'flex',
  alignItems: 'center',
} as const

export default function CalendarView({
  appointments,
}: {
  appointments: ApptWithClient[]
}) {
  const [current, setCurrent] = useState(() => new Date())
  const [selected, setSelected] = useState<string | null>(null)

  const monthStart = startOfMonth(current)
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(current) })
  const startDow = (getDay(monthStart) + 6) % 7 // Mon=0 … Sun=6

  const apptMap = new Map<string, ApptWithClient[]>()
  for (const a of appointments) {
    const list = apptMap.get(a.appointment_date) ?? []
    list.push(a)
    apptMap.set(a.appointment_date, list)
  }

  const selectedAppts = selected ? (apptMap.get(selected) ?? []) : []

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '22px',
      marginBottom: '36px',
    }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <button onClick={() => { setCurrent(subMonths(current, 1)); setSelected(null) }} style={BTN}>
          <ChevronLeft size={15} />
        </button>
        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)', textTransform: 'capitalize' }}>
          {format(current, 'MMMM yyyy', { locale: nl })}
        </span>
        <button onClick={() => { setCurrent(addMonths(current, 1)); setSelected(null) }} style={BTN}>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '4px' }}>
        {DAY_HEADERS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-faint)', letterSpacing: '0.5px', paddingBottom: '6px' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {Array.from({ length: startDow }).map((_, i) => <div key={`pad-${i}`} />)}

        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const appts = apptMap.get(dateStr) ?? []
          const today = isToday(day)
          const isSelected = selected === dateStr
          const hasAppts = appts.length > 0

          return (
            <button
              key={dateStr}
              onClick={() => setSelected(isSelected ? null : dateStr)}
              style={{
                borderRadius: '8px',
                padding: '6px 2px 8px',
                minHeight: '56px',
                border: isSelected
                  ? '1.5px solid var(--text)'
                  : today
                  ? '1.5px solid #004aad'
                  : '1px solid transparent',
                background: isSelected
                  ? 'var(--surface-2)'
                  : today
                  ? 'rgba(0,74,173,0.07)'
                  : hasAppts
                  ? 'var(--surface-2)'
                  : 'transparent',
                cursor: hasAppts || today ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span style={{
                fontSize: '0.78rem',
                fontWeight: today ? 700 : 400,
                color: today ? '#004aad' : 'var(--text-dim)',
                lineHeight: 1,
              }}>
                {format(day, 'd')}
              </span>

              {/* Colored dots */}
              {appts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', justifyContent: 'center', maxWidth: '36px' }}>
                  {appts.slice(0, 4).map(a => (
                    <div key={a.id} style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: TYPE_COLOR[a.type] ?? TYPE_COLOR.other,
                      flexShrink: 0,
                    }} />
                  ))}
                  {appts.length > 4 && (
                    <span style={{ fontSize: '0.52rem', color: 'var(--text-faint)', lineHeight: 1, alignSelf: 'center' }}>
                      +{appts.length - 4}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '14px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
        {Object.entries(TYPE_COLOR).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>{TYPE_LABEL[type]}</span>
          </div>
        ))}
      </div>

      {/* Selected day detail */}
      {selected && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            {format(parseISO(selected), 'EEEE d MMMM', { locale: nl })}
            {selectedAppts.length === 0 && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '8px', color: 'var(--text-faint)' }}>— geen afspraken</span>}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedAppts
              .sort((a, b) => (a.appointment_time ?? '').localeCompare(b.appointment_time ?? ''))
              .map(a => {
                const color = TYPE_COLOR[a.type] ?? TYPE_COLOR.other
                const label = TYPE_LABEL[a.type] ?? 'Overig'
                const time = a.appointment_time ? a.appointment_time.slice(0, 5) : null
                return (
                  <div key={a.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    background: 'var(--surface-2)', borderRadius: '8px', padding: '10px 14px',
                  }}>
                    <div style={{ width: '3px', height: '32px', borderRadius: '2px', background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{a.title}</span>
                        <span style={{ fontSize: '0.62rem', color, fontWeight: 600 }}>{label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                        {time && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{time}{a.duration_minutes ? ` · ${a.duration_minutes} min` : ''}</span>}
                        {a.clients?.full_name && <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>{a.clients.full_name}</span>}
                        {a.location && <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>· {a.location}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
