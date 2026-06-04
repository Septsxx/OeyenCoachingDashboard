import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, parseISO, isBefore, startOfDay } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { Appointment, Client } from '@/lib/types'
import NewAppointmentForm from './NewAppointmentForm'
import AppointmentCard from './AppointmentCard'
import CalendarView from './CalendarView'

export const dynamic = 'force-dynamic'

type AppointmentWithClient = Appointment & { clients: { full_name: string } | null }


function groupByDate(appointments: AppointmentWithClient[]) {
  const map = new Map<string, AppointmentWithClient[]>()
  for (const a of appointments) {
    const list = map.get(a.appointment_date) ?? []
    list.push(a)
    map.set(a.appointment_date, list)
  }
  return map
}

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: appointmentsRaw }, { data: clients }] = await Promise.all([
    supabase
      .from('appointments')
      .select('*, clients(full_name)')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true }) as unknown as Promise<{ data: AppointmentWithClient[] | null }>,
    supabase
      .from('clients')
      .select('id, full_name, email')
      .order('full_name') as unknown as Promise<{ data: Pick<Client, 'id' | 'full_name' | 'email'>[] | null }>,
  ])

  const all = appointmentsRaw ?? []
  const today = startOfDay(new Date())

  const upcoming = all.filter(a => !isBefore(parseISO(a.appointment_date), today))
  const past = all.filter(a => isBefore(parseISO(a.appointment_date), today))

  const upcomingByDate = groupByDate(upcoming)
  const pastByDate = groupByDate([...past].reverse())

  return (
    <div className="page-pad" style={{ maxWidth: '860px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Agenda</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            {upcoming.length} aankomende · {past.length} voorbije afspraken
          </p>
        </div>
      </div>

      <CalendarView appointments={all} />

      <NewAppointmentForm clients={(clients ?? []) as Pick<Client, 'id' | 'full_name' | 'email'>[]} />

      {upcoming.length === 0 && past.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-faint)' }}>
          <p style={{ fontSize: '0.9rem' }}>Nog geen afspraken gepland.</p>
          <p style={{ fontSize: '0.82rem', marginTop: '8px' }}>Klik op "+ Nieuwe afspraak" om te starten.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>
            Aankomende afspraken ({upcoming.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {Array.from(upcomingByDate.entries()).map(([date, items]) => (
              <DateGroup key={date} date={date} items={items} clients={clients ?? []} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>
            Voorbije afspraken ({past.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {Array.from(pastByDate.entries()).map(([date, items]) => (
              <DateGroup key={date} date={date} items={items} clients={clients ?? []} dim />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DateGroup({ date, items, clients, dim = false }: { date: string; items: AppointmentWithClient[]; clients: Pick<Client, 'id' | 'full_name' | 'email'>[]; dim?: boolean }) {
  const parsed = parseISO(date)
  const isToday = format(parsed, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <span style={{
          fontSize: '0.82rem', fontWeight: 700,
          color: isToday ? '#3B82F6' : (dim ? 'var(--text-faint)' : 'var(--text)'),
        }}>
          {isToday ? 'Vandaag — ' : ''}{format(parsed, 'EEEE d MMMM yyyy', { locale: nl })}
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map(a => <AppointmentCard key={a.id} appointment={a} clients={clients} dim={dim} />)}
      </div>
    </div>
  )
}
