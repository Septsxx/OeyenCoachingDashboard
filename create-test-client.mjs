import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tyzqdqjdycvwcqrkqdhp.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enFkcWpkeWN2d2NxcmtxZGhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2NDQ2NywiZXhwIjoyMDkzNzQwNDY3fQ.dVsWudAOL7g0yKOBwG2wbkR-T_F9paF23BKx1Fm-CPQ'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const TEST_EMAIL = 'testclient@test.be'
const TEST_PASSWORD = 'TestClient123!'

async function main() {
  // 1. Create auth user
  const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('User already exists, looking up existing user...')
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existing = users.find(u => u.email === TEST_EMAIL)
      if (existing) {
        console.log('Found existing user:', existing.id)
        await linkClientRecord(existing.id)
      }
      return
    }
    throw authError
  }

  console.log('Auth user created:', user.id)
  await linkClientRecord(user.id)
}

async function linkClientRecord(userId) {
  // 2. Check if client record exists
  const { data: existing } = await supabase.from('clients').select('id').eq('email', TEST_EMAIL).single()

  if (existing) {
    // Link existing client
    await supabase.from('clients').update({ user_id: userId }).eq('id', existing.id)
    console.log('Linked existing client record')
  } else {
    // Create new client record
    const { error } = await supabase.from('clients').insert({
      user_id: userId,
      full_name: 'Test Client',
      email: TEST_EMAIL,
      intake_completed: true,
    })
    if (error) throw error
    console.log('Client record created')
  }

  console.log('\n✓ Test client ready!')
  console.log('  Email:    ', TEST_EMAIL)
  console.log('  Password: ', TEST_PASSWORD)
}

main().catch(console.error)
