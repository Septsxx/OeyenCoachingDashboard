'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function TodoRow({ href, done, label, doneLabel, last }: {
  href: string; done: boolean | null; label: string; doneLabel: string; last: boolean
}) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '13px 16px',
      borderBottom: last ? 'none' : '1px solid var(--surface-2)',
      textDecoration: 'none',
    }}>
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
        border: done ? 'none' : '1.5px solid var(--border-2)',
        background: done ? '#22C55E' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s',
      }}>
        {done && <span style={{ color: '#fff', fontSize: '0.6rem', fontWeight: 700 }}>✓</span>}
      </div>
      <span style={{
        fontSize: '0.85rem',
        color: done ? 'var(--text-dim)' : 'var(--text)',
        textDecoration: done ? 'line-through' : 'none',
        flex: 1,
      }}>
        {done ? doneLabel : label}
      </span>
      {!done && <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>→</span>}
    </Link>
  )
}

export default function ActiesCard({ clientId }: { clientId: string }) {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const today = new Date()
  const todayStr = localDateStr(today)
  const currentWeek = isoWeek(today)

  const [logDone, setLogDone] = useState<boolean | null>(null)
  const [checkinDone, setCheckinDone] = useState<boolean | null>(null)

  useEffect(() => {
    async function fetchStatus() {
      const [{ data: log }, { data: checkin }] = await Promise.all([
        supabase.from('daily_logs').select('id').eq('client_id', clientId).eq('log_date', todayStr).eq('filled_by', 'client').maybeSingle(),
        supabase.from('weekly_checkins').select('id').eq('client_id', clientId).eq('week_number', currentWeek).maybeSingle(),
      ])
      setLogDone(!!log)
      setCheckinDone(!!checkin)
    }
    fetchStatus()
  }, [clientId])

  const allDone = logDone === true && checkinDone === true

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)' }}>Acties</p>
        {allDone && <span style={{ fontSize: '0.72rem', color: '#22C55E', fontWeight: 600 }}>Alles gedaan ✓</span>}
      </div>
      <TodoRow href="/client/log" done={logDone} label="Dagelijkse log invullen" doneLabel="Dagelijkse log ingevuld" last={false} />
      <TodoRow href="/client/checkin" done={checkinDone} label={`Wekelijkse check-in (week ${currentWeek})`} doneLabel={`Check-in week ${currentWeek} verstuurd`} last />
    </div>
  )
}
