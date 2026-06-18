import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { data } = await supabase
    .from('coach_settings')
    .select('*')
    .eq('coach_id', user.id)
    .single()

  return NextResponse.json(data ?? { phase_labels: {} })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { phase_labels } = await req.json()

  const { error } = await supabase
    .from('coach_settings')
    .upsert({ coach_id: user.id, phase_labels, updated_at: new Date().toISOString() }, { onConflict: 'coach_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
