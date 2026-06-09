import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { email, clientId } = await req.json()
  if (!email || !clientId) {
    return NextResponse.json({ error: 'email en clientId zijn verplicht' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify the clientId actually exists and matches the email (prevents abuse)
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('id, email')
    .eq('id', clientId)
    .eq('email', email)
    .single()

  if (clientError || !client) {
    return NextResponse.json({ error: 'Ongeldig verzoek' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:7778'
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/update-password`,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const userId = data.user.id

  await Promise.all([
    admin.from('clients').update({ user_id: userId }).eq('id', clientId),
    admin.from('profiles').upsert({ id: userId, email, role: 'client' }, { onConflict: 'id' }),
  ])

  return NextResponse.json({ ok: true })
}
