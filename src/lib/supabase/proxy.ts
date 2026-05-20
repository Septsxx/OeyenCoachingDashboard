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

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const port = request.nextUrl.port
  const isCoachPort = port === '7771'
  const isClientPort = port === '7778'

  const publicRoutes = ['/', '/login', '/intake', '/auth']
  const isPublic = publicRoutes.some(r => path === r || path.startsWith('/intake') || path.startsWith('/auth'))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && path === '/login') {
    let destination: string
    if (isCoachPort) {
      destination = '/coach'
    } else if (isClientPort) {
      destination = '/client'
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      destination = profile?.role === 'coach' ? '/coach' : '/client'
    }
    return NextResponse.redirect(new URL(destination, request.url))
  }

  if (user && isCoachPort && path.startsWith('/client')) {
    return NextResponse.redirect(new URL('/coach', request.url))
  }
  if (user && isClientPort && path.startsWith('/coach')) {
    return NextResponse.redirect(new URL('/client', request.url))
  }

  return supabaseResponse
}
