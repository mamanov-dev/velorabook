import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/error']
const authRoutes = ['/auth/signin', '/auth/signup']

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  console.log('Middleware:', {
    path: nextUrl.pathname,
    isLoggedIn,
    hasAuth: !!req.auth
  })

  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth')
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
  const isAuthRoute = authRoutes.includes(nextUrl.pathname)

  // Разрешаем все API auth маршруты
  if (isApiAuthRoute) {
    return NextResponse.next()
  }

  // Если пользователь авторизован и на странице входа - перенаправляем в дашборд
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // Если не авторизован и пытается попасть на защищенную страницу
  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname
    if (nextUrl.search) {
      callbackUrl += nextUrl.search
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl)
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${encodedCallbackUrl}`, nextUrl))
  }

  return NextResponse.next()
})

// Обновленный matcher
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}