import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(null)

  const { data } = await supabase
    .from('push_subscriptions')
    .select('daily_enabled,daily_hour,weekly_enabled,weekly_day,weekly_hour')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { subscription, daily_enabled, daily_hour, weekly_enabled, weekly_day, weekly_hour } = await req.json()
  if (!subscription) return NextResponse.json({ error: 'Geen subscription' }, { status: 400 })

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      subscription,
      daily_enabled: daily_enabled ?? false,
      daily_hour: daily_hour ?? 20,
      weekly_enabled: weekly_enabled ?? false,
      weekly_day: weekly_day ?? 0,
      weekly_hour: weekly_hour ?? 10,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  await supabase.from('push_subscriptions').delete().eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
