'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import type { Payment } from '@/lib/types'
import { PACKAGES } from '@/lib/types'
import { getPaymentStatus } from '@/lib/payment-utils'
import { formatDate, CHART_TOOLTIP } from '@/lib/ui'

const TABS = [
  { id: 'overzicht', label: 'Overzicht' },
  { id: 'betalingen', label: 'Betalingen' },
]

type PaymentWithClient = Payment & { clients: { full_name: string } | null }

interface MonthData { month: string; revenue: number }
interface PackageData { label: string; count: number; revenue: number }
interface ExpiringSoon extends PaymentWithClient { daysLeft: number }

interface Props {
  payments: PaymentWithClient[]
  monthlyData: MonthData[]
  packageData: PackageData[]
  thisMonthRevenue: number
  ytdRevenue: number
  expiringSoon: ExpiringSoon[]
  stats: { ok: number; soon: number; expired: number; total: number }
}

const PACKAGE_COLORS = ['#004aad', '#3b82f6', '#60a5fa']

export default function FinancienTabs({
  payments, monthlyData, packageData, thisMonthRevenue, ytdRevenue, expiringSoon, stats,
}: Props) {
  const [tab, setTab] = useState<'overzicht' | 'betalingen'>('overzicht')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const avgPayment = payments.length ? Math.round(stats.total / payments.length) : 0

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            style={{
              padding: '10px 20px',
              fontSize: '0.875rem',
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? '#004aad' : 'var(--text-dim)',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #004aad' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-1px',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overzicht' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Status summary */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'Actief (>7 dagen)', value: stats.ok, color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
              { label: 'Verloopt binnenkort', value: stats.soon, color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
              { label: 'Vervallen', value: stats.expired, color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, border: `1px solid ${color}33`, borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: isMobile ? 'center' : undefined, justifyContent: isMobile ? 'space-between' : undefined, flex: isMobile ? 1 : undefined, gap: isMobile ? '8px' : undefined }}>
                  <p style={{ fontSize: '0.72rem', color, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: isMobile ? 0 : '2px' }}>{label}</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Omzet deze maand', value: `€${thisMonthRevenue.toLocaleString('nl-BE')}`, color: '#004aad' },
              { label: 'Omzet dit jaar', value: `€${ytdRevenue.toLocaleString('nl-BE')}`, color: 'var(--text)' },
              { label: 'Gemiddeld per betaling', value: `€${avgPayment.toLocaleString('nl-BE')}`, color: 'var(--text)' },
              { label: 'Totale omzet', value: `€${stats.total.toLocaleString('nl-BE')}`, color: '#22C55E' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{label}</p>
                <p style={{ fontSize: isMobile ? '1.4rem' : '1.75rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '16px' }}>
            {/* Monthly revenue bar chart */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
                Maandelijkse omzet (12 maanden)
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: isMobile ? 9 : 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: isMobile ? 9 : 11, fill: 'var(--text-faint)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `€${v}`}
                    width={isMobile ? 48 : 60}
                  />
                  <Tooltip
                    {...CHART_TOOLTIP}
                    formatter={(v) => [`€${Number(v).toLocaleString('nl-BE')}`, 'Omzet']}
                  />
                  <Bar dataKey="revenue" fill="#004aad" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Package breakdown */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
                Per pakket
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={packageData} layout="vertical" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: isMobile ? 9 : 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `€${v}`} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: isMobile ? 9 : 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={isMobile ? 72 : 90} />
                  <Tooltip
                    {...CHART_TOOLTIP}
                    formatter={(v) => [`€${Number(v).toLocaleString('nl-BE')}`, 'Omzet']}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {packageData.map((_, i) => (
                      <Cell key={i} fill={PACKAGE_COLORS[i % PACKAGE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* legend */}
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {packageData.map((d, i) => (
                  <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: PACKAGE_COLORS[i % PACKAGE_COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-dim)' }}>{d.label}</span>
                    </div>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{d.count}×</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Expiring soon */}
          {expiringSoon.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F97316' }} />
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Verloopt binnenkort ({expiringSoon.length})
                </p>
              </div>
              {expiringSoon.map(p => (
                isMobile ? (
                  <Link key={p.id} href={`/coach/clients/${p.client_id}?tab=payments`} style={{ display: 'block', textDecoration: 'none', padding: '12px 16px', borderBottom: '1px solid var(--surface-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{p.clients?.full_name ?? '—'}</p>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem',
                        padding: '3px 10px', borderRadius: '99px',
                        background: p.daysLeft === 0 ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)',
                        color: p.daysLeft === 0 ? '#EF4444' : '#F97316',
                        flexShrink: 0, marginLeft: '8px',
                      }}>
                        {p.daysLeft === 0 ? 'Vandaag' : `${p.daysLeft}d`}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {PACKAGES[p.package].label} · verloopt {formatDate(p.expiry_date)}
                    </p>
                  </Link>
                ) : (
                  <div key={p.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 140px 100px 120px',
                    padding: '12px 20px', borderBottom: '1px solid var(--surface-2)', alignItems: 'center',
                  }}>
                    <Link href={`/coach/clients/${p.client_id}?tab=payments`} style={{ textDecoration: 'none' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>{p.clients?.full_name ?? '—'}</p>
                    </Link>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{PACKAGES[p.package].label}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{formatDate(p.expiry_date)}</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem',
                      padding: '3px 10px', borderRadius: '99px', width: 'fit-content',
                      background: p.daysLeft === 0 ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)',
                      color: p.daysLeft === 0 ? '#EF4444' : '#F97316',
                    }}>
                      {p.daysLeft === 0 ? 'Verloopt vandaag' : `${p.daysLeft}d resterend`}
                    </span>
                  </div>
                )
              ))}
            </div>
          )}

        </div>
      )}

      {tab === 'betalingen' && (
        <div>
          {isMobile ? (
            /* Mobile card list */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {payments.length === 0 ? (
                <p style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.9rem' }}>Nog geen betalingen</p>
              ) : (
                payments.map(p => {
                  const status = getPaymentStatus(p)
                  return (
                    <Link key={p.id} href={`/coach/clients/${p.client_id}?tab=payments`} style={{ textDecoration: 'none', display: 'block', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{p.clients?.full_name ?? '—'}</p>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem',
                          padding: '3px 10px', borderRadius: '99px', flexShrink: 0, marginLeft: '8px',
                          background: status.bg, color: status.color,
                        }}>
                          {status.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {PACKAGES[p.package].label} · {formatDate(p.payment_date)}
                        </p>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>€{p.amount}</p>
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '4px' }}>
                        Verloopt {formatDate(p.expiry_date)}
                      </p>
                    </Link>
                  )
                })
              )}
            </div>
          ) : (
            /* Desktop table */
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 120px 140px 140px 120px',
                padding: '12px 20px', borderBottom: '1px solid var(--surface-2)',
                fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.8px',
              }}>
                <span>Klant</span><span>Pakket</span><span>Bedrag</span><span>Betaaldatum</span><span>Vervaldatum</span><span>Status</span>
              </div>

              {payments.length === 0 ? (
                <p style={{ padding: '48px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.9rem' }}>Nog geen betalingen</p>
              ) : (
                payments.map(p => {
                  const status = getPaymentStatus(p)
                  return (
                    <div key={p.id} style={{
                      display: 'grid', gridTemplateColumns: '1fr 120px 120px 140px 140px 120px',
                      padding: '14px 20px', borderBottom: '1px solid var(--surface-2)', alignItems: 'center',
                    }}>
                      <Link href={`/coach/clients/${p.client_id}?tab=payments`} style={{ textDecoration: 'none' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>{p.clients?.full_name ?? '—'}</p>
                      </Link>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{PACKAGES[p.package].label}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text)' }}>€{p.amount}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{formatDate(p.payment_date)}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{formatDate(p.expiry_date)}</span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem',
                        padding: '3px 10px', borderRadius: '99px', width: 'fit-content',
                        background: status.bg, color: status.color,
                      }}>
                        {status.label}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
