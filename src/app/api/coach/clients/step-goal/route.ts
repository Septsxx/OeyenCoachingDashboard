import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { clientId, stepGoal, prevStepGoal } = await req.json()
  if (!clientId) return NextResponse.json({ error: 'clientId verplicht' }, { status: 400 })

  const { error } = await supabase
    .from('clients')
    .update({ step_goal: stepGoal, prev_step_goal: prevStepGoal })
    .eq('id', clientId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
