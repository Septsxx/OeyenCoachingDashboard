import { differenceInDays, parseISO } from 'date-fns'
import type { Payment, PackageType } from './types'
import { PACKAGES } from './types'

export type PaymentStatusInfo = {
  label: string
  color: string
  bg: string
  days: number | null
}

export function getPaymentStatus(payment: Payment | null): PaymentStatusInfo {
  if (!payment) return { label: 'Geen betaling', color: '#666', bg: 'rgba(100,100,100,0.1)', days: null }
  const days = differenceInDays(parseISO(payment.expiry_date), new Date())
  if (days < 0) return { label: 'Vervallen', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', days }
  if (days <= 14) return { label: `${days}d resterend`, color: '#F97316', bg: 'rgba(249,115,22,0.1)', days }
  return { label: `${days}d resterend`, color: '#22C55E', bg: 'rgba(34,197,94,0.1)', days }
}

export function packageShortLabel(pkg: PackageType | undefined): string {
  if (!pkg) return '—'
  return PACKAGES[pkg].label
}
