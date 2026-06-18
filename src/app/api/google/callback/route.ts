import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'Geen code ontvangen' }, { status: 400 })

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )

  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.refresh_token) {
    return NextResponse.json({
      error: 'Geen refresh token ontvangen. Verwijder de app-toegang in je Google account en probeer opnieuw.',
      hint: 'https://myaccount.google.com/permissions',
    }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    message: 'Kopieer deze waarde naar .env.local als GOOGLE_REFRESH_TOKEN en herstart de server.',
    GOOGLE_REFRESH_TOKEN: tokens.refresh_token,
  })
}
