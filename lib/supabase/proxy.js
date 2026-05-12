// lib/supabase/proxy.js
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export async function updateSession(request) {
  let response = NextResponse.next()

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // ✅ SAFE: use getSession instead of getUser
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user ?? null
  const { pathname } = request.nextUrl

  const protectedRoutes = [
    '/',
    '/dashboard',
    '/users',
    '/attendance',
    '/students',
    '/classes',
    '/sanctions',
    '/reports',
    '/upload',
    '/profile',
  ]

  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  // 🔴 Not logged in → block protected
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 🟢 Logged in → block auth صفحات
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}