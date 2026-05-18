import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { email, clientId } = await req.json()
  if (!email || !clientId) {
    return NextResponse.json({ error: 'email en clientId zijn verplicht' }, { status: 400 })
  }

  const admin = createAdminClient()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:7778'
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/client`,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const userId = data.user.id

  // Link the user to the client row and create their profile
  await Promise.all([
    admin.from('clients').update({ user_id: userId }).eq('id', clientId),
    admin.from('profiles').upsert({ id: userId, email, role: 'client' }, { onConflict: 'id' }),
  ])

  return NextResponse.json({ ok: true })
}
