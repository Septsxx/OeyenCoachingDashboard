import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import webpush from 'web-push'
import { getISOWeek } from 'date-fns'

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

function getBrusselsTime(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const y = parts.find(p => p.type === 'year')!.value
  const m = parts.find(p => p.type === 'month')!.value
  const d = parts.find(p => p.type === 'day')!.value
  const todayStr = `${y}-${m}-${d}`

  const hourStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Brussels', hour: 'numeric', hour12: false,
  }).format(now)
  const hour = parseInt(hourStr) % 24

  const dowStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Brussels', weekday: 'short',
  }).format(now)
  const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dowStr)

  const weekNumber = getISOWeek(new Date(`${todayStr}T12:00:00`))

  return { todayStr, hour, dayOfWeek, weekNumber }
}

async function sendPush(subscription: webpush.PushSubscription, payload: object) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { todayStr, hour, dayOfWeek, weekNumber } = getBrusselsTime(new Date())

  const { data: subs } = await admin.from('push_subscriptions').select('*')
  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 })

  let sent = 0
  const staleIds: string[] = []

  const clientIdCache = new Map<string, string>()
  async function getClientId(userId: string): Promise<string> {
    if (clientIdCache.has(userId)) return clientIdCache.get(userId)!
    const { data } = await admin.from('clients').select('id').eq('user_id', userId).maybeSingle()
    const id = data?.id ?? ''
    if (id) clientIdCache.set(userId, id)
    return id
  }

  for (const sub of subs) {
    const pushSub = sub.subscription as webpush.PushSubscription

    if (sub.daily_enabled && sub.daily_hour === hour) {
      const clientId = await getClientId(sub.user_id)
      if (clientId) {
        const { data: log } = await admin
          .from('daily_logs')
          .select('id')
          .eq('client_id', clientId)
          .eq('log_date', todayStr)
          .maybeSingle()

        if (!log) {
          const ok = await sendPush(pushSub, {
            title: 'Dagelijks log 📋',
            body: 'Je hebt je dagelijkse log nog niet ingevuld. Klik hier om het te doen.',
            url: '/client/log',
            tag: 'daily-log',
          })
          if (ok) sent++
          else staleIds.push(sub.id)
        }
      }
    }

    if (sub.weekly_enabled && sub.weekly_day === dayOfWeek && sub.weekly_hour === hour) {
      const clientId = await getClientId(sub.user_id)
      if (clientId) {
        const { data: checkin } = await admin
          .from('weekly_checkins')
          .select('id')
          .eq('client_id', clientId)
          .eq('week_number', weekNumber)
          .maybeSingle()

        if (!checkin) {
          const ok = await sendPush(pushSub, {
            title: 'Wekelijkse check-in 📊',
            body: 'Je hebt je wekelijkse check-in nog niet ingevuld. Klik hier om het te doen.',
            url: '/client/checkin',
            tag: 'weekly-checkin',
          })
          if (ok) sent++
          else staleIds.push(sub.id)
        }
      }
    }
  }

  if (staleIds.length > 0) {
    await admin.from('push_subscriptions').delete().in('id', staleIds)
  }

  return NextResponse.json({ sent, stale: staleIds.length })
}
