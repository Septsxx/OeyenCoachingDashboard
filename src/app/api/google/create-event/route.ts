import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'

const TIMEZONE = 'Europe/Brussels'

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    return NextResponse.json({ error: 'Google Calendar niet gekoppeld' }, { status: 503 })
  }

  const {
    title,
    date,
    time,
    durationMinutes,
    location,
    notes,
    clientEmail,
    clientName,
  }: {
    title: string
    date: string
    time?: string
    durationMinutes?: number
    location?: string
    notes?: string
    clientEmail?: string
    clientName?: string
  } = await req.json()

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  let startObj: { date: string } | { dateTime: string; timeZone: string }
  let endObj: { date: string } | { dateTime: string; timeZone: string }

  if (time) {
    const startDT = `${date}T${time}:00`
    const [h, m] = time.split(':').map(Number)
    const totalMins = h * 60 + m + (durationMinutes ?? 60)
    const endH = Math.floor(totalMins / 60) % 24
    const endM = totalMins % 60
    const endDT = `${date}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`
    startObj = { dateTime: startDT, timeZone: TIMEZONE }
    endObj = { dateTime: endDT, timeZone: TIMEZONE }
  } else {
    // Dagafspraak zonder tijdstip
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)
    startObj = { date }
    endObj = { date: nextDay.toISOString().slice(0, 10) }
  }

  const attendees = clientEmail
    ? [{ email: clientEmail, displayName: clientName ?? clientEmail }]
    : []

  try {
    const { data } = await calendar.events.insert({
      calendarId: 'primary',
      sendUpdates: 'all',
      requestBody: {
        summary: title,
        location: location ?? undefined,
        description: notes ?? undefined,
        start: startObj,
        end: endObj,
        attendees,
      },
    })
    return NextResponse.json({ ok: true, eventId: data.id, htmlLink: data.htmlLink })
  } catch (err: any) {
    console.error('Google Calendar fout:', err?.message)
    return NextResponse.json({ error: err?.message ?? 'Onbekende fout' }, { status: 500 })
  }
}
