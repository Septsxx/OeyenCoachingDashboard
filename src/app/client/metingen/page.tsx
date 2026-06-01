import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MetingenClient from './MetingenClient'

export default async function MetingenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let clientId: string | null = null

  const { data: byUserId } = await supabase
    .from('clients').select('id').eq('user_id', user.id).maybeSingle()
  if (byUserId) {
    clientId = byUserId.id
  } else if (user.email) {
    const { data: byEmail } = await supabase
      .from('clients').select('id').eq('email', user.email).maybeSingle()
    if (byEmail) clientId = byEmail.id
  }

  if (!clientId) { await supabase.auth.signOut(); redirect('/login?error=no_profile') }

  return (
    <div>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px' }}>Metingen</h1>
      <MetingenClient clientId={clientId} />
    </div>
  )
}
