import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Публичные маршруты, которые доступны без авторизации
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/error',
  '/api/auth',
  '/api/register'
]

// Защищенные маршруты, требующие авторизации
const protectedRoutes = [
  '/create',
  '/book',
  '/profile',
  '/dashboard'
]

// Маршруты только для неавторизованных пользователей
const authRoutes = [
  '/auth/signin',
  '/auth/signup'
]

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  console.log('🔐 Middleware:', {
    path: nextUrl.pathname,
    isLoggedIn,
    user: req.auth?.user?.email
  })

  // Проверяем API маршруты
  if (nextUrl.pathname.startsWith('/api/')) {
    // API маршруты аутентификации всегда доступны
    if (nextUrl.pathname.startsWith('/api/auth') || nextUrl.pathname === '/api/register') {
      return NextResponse.next()
    }
    
    // Защищенные API маршруты
    if (nextUrl.pathname.startsWith('/api/generate-book') && !isLoggedIn) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }
    
    return NextResponse.next()
  }

  // Если пользователь авторизован и пытается попасть на страницы авторизации
  if (isLoggedIn && authRoutes.includes(nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Если пользователь не авторизован и пытается попасть на защищенные страницы
  if (!isLoggedIn && protectedRoutes.some(route => nextUrl.pathname.startsWith(route))) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}