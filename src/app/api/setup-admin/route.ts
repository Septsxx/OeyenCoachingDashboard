import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = createAdminClient()

  const { error } = await admin.from('profiles').upsert({
    id: '6e385019-3a7d-4358-85a2-aabe04d8637a',
    role: 'coach',
    email: 'verheydenv@gmail.com',
  }, { onConflict: 'id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
