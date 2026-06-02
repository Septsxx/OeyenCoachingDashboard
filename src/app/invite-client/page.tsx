import { redirect } from 'next/navigation'

export default function InviteClientRedirect() {
  redirect('/coach/clients/new')
}
