import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Публичные маршруты (доступны без авторизации)
const publicRoutes = [
  '/', 
  '/auth/signin', 
  '/auth/signup', 
  '/auth/error',
  '/api/health',
  '/api/register',
]

// Маршруты аутентификации (перенаправляем авторизованных пользователей)
const authRoutes = ['/auth/signin', '/auth/signup']

// API маршруты, которые не требуют авторизации
const publicApiRoutes = [
  '/api/auth',
  '/api/health', 
  '/api/register',
]

export default auth((req) => {
  try {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth

    // Логирование только в development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Middleware:', {
        path: nextUrl.pathname,
        isLoggedIn,
        userEmail: req.auth?.user?.email,
      })
    }

    const isApiRoute = nextUrl.pathname.startsWith('/api')
    const isPublicApiRoute = publicApiRoutes.some(route => 
      nextUrl.pathname.startsWith(route)
    )
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
    const isAuthRoute = authRoutes.includes(nextUrl.pathname)

    // Разрешаем все публичные API маршруты без проверки
    if (isApiRoute && isPublicApiRoute) {
      return NextResponse.next()
    }

    // Если пользователь авторизован и находится на странице входа/регистрации
    if (isAuthRoute && isLoggedIn) {
      const callbackUrl = nextUrl.searchParams.get('callbackUrl')
      const redirectUrl = callbackUrl && callbackUrl.startsWith('/') 
        ? callbackUrl 
        : '/dashboard'
      
      if (process.env.NODE_ENV === 'development') {
        console.log('↩️ Redirecting authenticated user from auth page to:', redirectUrl)
      }
      
      return NextResponse.redirect(new URL(redirectUrl, nextUrl))
    }

    // Если пользователь не авторизован
    if (!isLoggedIn) {
      // Разрешаем доступ к публичным маршрутам
      if (isPublicRoute) {
        return NextResponse.next()
      }

      // API маршруты требующие авторизации
      if (isApiRoute) {
        return NextResponse.json(
          { 
            error: 'Authentication required',
            code: 'UNAUTHORIZED' 
          }, 
          { status: 401 }
        )
      }

      // Перенаправляем на страницу входа для защищенных маршрутов
      let callbackUrl = nextUrl.pathname
      if (nextUrl.search) {
        callbackUrl += nextUrl.search
      }

      const encodedCallbackUrl = encodeURIComponent(callbackUrl)
      const signInUrl = new URL(`/auth/signin?callbackUrl=${encodedCallbackUrl}`, nextUrl)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Redirecting to sign in:', signInUrl.href)
      }
      
      return NextResponse.redirect(signInUrl)
    }

    // API маршруты требующие авторизации - проверяем наличие сессии
    if (isApiRoute && !isPublicApiRoute) {
      if (!req.auth?.user?.id) {
        return NextResponse.json(
          { 
            error: 'Valid session required',
            code: 'INVALID_SESSION' 
          }, 
          { status: 401 }
        )
      }
    }

    // Добавляем заголовки безопасности
    const response = NextResponse.next()
    
    // Content Security Policy (базовая версия)
    if (!isApiRoute) {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self'; " +
        "connect-src 'self' https:; " +
        "frame-src 'none';"
      )
    }

    // Дополнительные заголовки безопасности
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')

    return response
  } catch (error) {
    // Обработка ошибок middleware
    console.error('❌ Middleware error:', error)
    
    // В случае ошибки разрешаем доступ, но логируем проблему
    const response = NextResponse.next()
    
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('X-Middleware-Error', 'true')
    }
    
    return response
  }
})

// Обновленный matcher - исключаем статические файлы и изображения
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml (SEO files)
     * - images, icons (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|icons).*)',
  ],
}