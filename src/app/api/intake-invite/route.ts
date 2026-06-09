import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { buildInviteEmail } from '@/lib/emails/invite-client'

export async function POST(req: NextRequest) {
  const { email, clientId } = await req.json()
  if (!email || !clientId) {
    return NextResponse.json({ error: 'email en clientId zijn verplicht' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify clientId + email match (prevents abuse)
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

  // Generate invite link without Supabase sending its own email
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo: `${siteUrl}/auth/callback?next=/update-password` },
  })

  if (linkError) {
    console.error('[intake-invite] generateLink fout:', linkError)
    return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  const userId = linkData.user.id
  const inviteUrl = linkData.properties.action_link

  // Update client + profile records
  await Promise.all([
    admin.from('clients').update({ user_id: userId }).eq('id', clientId),
    admin.from('profiles').upsert({ id: userId, email, role: 'client' }, { onConflict: 'id' }),
  ])

  // Send via Resend
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.error('[intake-invite] RESEND_API_KEY niet ingesteld')
    return NextResponse.json({ error: 'E-mailservice niet geconfigureerd.' }, { status: 500 })
  }

  const resend = new Resend(resendKey)
  const { subject, html } = buildInviteEmail(inviteUrl)
  const from = process.env.RESEND_FROM ?? 'Oeyen Coaching <onboarding@resend.dev>'

  const { error: emailError } = await resend.emails.send({ from, to: email, subject, html })
  if (emailError) {
    console.error('[intake-invite] Resend fout:', emailError)
    return NextResponse.json({ error: 'E-mail kon niet verzonden worden.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
