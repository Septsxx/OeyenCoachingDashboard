import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    return NextResponse.json({ error: 'Google Calendar niet gekoppeld' }, { status: 503 })
  }

  const { eventId }: { eventId: string } = await req.json()

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all',
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Google Calendar verwijder fout:', err?.message)
    return NextResponse.json({ error: err?.message ?? 'Onbekende fout' }, { status: 500 })
  }
}
