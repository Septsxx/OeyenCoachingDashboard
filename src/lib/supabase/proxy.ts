import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — verplicht voor SSR auth
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isCoachRoute = pathname.startsWith('/coach')
  const isClientRoute = pathname.startsWith('/client')
  const isProtectedRoute = isCoachRoute || isClientRoute

  // Niet ingelogd → doorsturen naar login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Rolgebaseerde toegangscontrole
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    if (isCoachRoute && role !== 'coach') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'client' ? '/client' : '/login'
      return NextResponse.redirect(url)
    }

    if (isClientRoute && role !== 'client') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'coach' ? '/coach' : '/login'
      return NextResponse.redirect(url)
    }
  }

  // Ingelogd op /login → doorsturen naar dashboard
  if (user && pathname === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const url = request.nextUrl.clone()
    url.pathname = profile?.role === 'coach' ? '/coach' : '/client'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
