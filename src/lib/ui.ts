import type { CSSProperties } from 'react'

export const LABEL: CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  marginBottom: '8px',
}

export const SECTION_TITLE: CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 600,
  color: 'var(--text-dim)',
  textTransform: 'uppercase',
  letterSpacing: '1.2px',
  marginBottom: '16px',
}

export const CARD: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '20px',
}

export const BTN_PRIMARY: CSSProperties = {
  padding: '9px 20px',
  borderRadius: '8px',
  background: '#004aad',
  color: '#ffffff',
  border: 'none',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.82rem',
}

export const BTN_GHOST: CSSProperties = {
  padding: '9px 18px',
  borderRadius: '8px',
  border: '1px solid var(--border-2)',
  background: 'transparent',
  color: 'var(--text-dim)',
  cursor: 'pointer',
  fontSize: '0.82rem',
}

/** "2024-07-23" → "23-07-2024" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}-${m}-${y}`
}

/** "2024-07-23" → "Vandaag" / "Gisteren" / "3 dagen geleden" / "23-07-2024" */
export function formatRelativeDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso.slice(0, 10) + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000)
  if (diffDays === 0) return 'Vandaag'
  if (diffDays === 1) return 'Gisteren'
  if (diffDays > 0 && diffDays <= 6) return `${diffDays} dagen geleden`
  return formatDate(iso)
}

/** "2024-07-23" → "23-07"  (voor grafieklabels) */
export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [, m, d] = iso.slice(0, 10).split('-')
  return `${d}-${m}`
}

export const CHART_TOOLTIP = {
  contentStyle: { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.78rem' },
  labelStyle: { color: 'var(--text-dim)' },
  itemStyle: { color: 'var(--text)' },
}

export const GRID2: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }
