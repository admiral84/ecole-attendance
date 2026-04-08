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

  // تجربة getSession أولاً
  
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
 
  const user = userData.user || sessionData.session?.user || null
  


  const { pathname } = request.nextUrl

  // ✅ Define routes
  const protectedRoutes = [
    '/dashboard',
    '/users',
    '/attendance',
    '/students',
    '/classes',
    '/sanctions',
    '/reports',
    '/upload'
  ]

  const authRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ]

  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  const isAuthRoute = authRoutes.some(route =>
    pathname.startsWith(route)
  )

 

  // 🔴 NOT LOGGED IN → block protected routes
  if (!user && isProtectedRoute) {
    
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 🟢 LOGGED IN → block auth pages
  if (user && isAuthRoute) {
    
    return NextResponse.redirect(new URL('/', request.url))
  }

  
  return response
}