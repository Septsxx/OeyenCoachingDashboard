import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'coach') return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const { clientId, email, password } = await req.json()
  if (!clientId || !email || !password) {
    return NextResponse.json({ error: 'clientId, email en wachtwoord zijn verplicht' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Wachtwoord moet minstens 8 tekens bevatten' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify clientId belongs to this request
  const { data: client, error: clientErr } = await admin
    .from('clients').select('id, email, user_id').eq('id', clientId).single()
  if (clientErr || !client) return NextResponse.json({ error: 'Klant niet gevonden' }, { status: 404 })
  if (client.user_id) return NextResponse.json({ error: 'Deze klant heeft al een account' }, { status: 409 })

  // Create auth account with chosen password (no invite email)
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'client', full_name: client.email },
  })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

  const userId = authData.user.id

  await Promise.all([
    admin.from('clients').update({ user_id: userId, email }).eq('id', clientId),
    admin.from('profiles').upsert({ id: userId, email, role: 'client' }, { onConflict: 'id' }),
  ])

  return NextResponse.json({ ok: true })
}
