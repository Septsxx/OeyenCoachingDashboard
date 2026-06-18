import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { clientId, weekNumber, ...fields } = await req.json()
  if (!clientId || weekNumber == null) return NextResponse.json({ error: 'clientId en weekNumber verplicht' }, { status: 400 })

  const allowed = ['phase', 'energy_balance', 'calories_td', 'calories_ntd', 'cardio_target', 'steps_target', 'notes']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in fields) update[key] = fields[key]
  }

  const { error } = await supabase
    .from('weekly_timeline')
    .upsert({ client_id: clientId, week_number: weekNumber, ...update, updated_at: new Date().toISOString() }, { onConflict: 'client_id,week_number' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
