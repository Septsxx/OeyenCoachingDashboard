import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Food } from '@/lib/types'
import FoodManager from './FoodManager'

export const dynamic = 'force-dynamic'

export default async function VoedingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: foods } = await supabase
    .from('foods')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true }) as { data: Food[] | null }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Voedingsdatabase</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          {foods?.length ?? 0} ingrediënten · Beheer je voedingsmiddelenbibliotheek
        </p>
      </div>
      <FoodManager initialFoods={foods ?? []} />
    </div>
  )
}
