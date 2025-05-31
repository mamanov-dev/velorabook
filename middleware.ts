import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimiter, SimpleRateLimiter } from '@/lib/redis'

const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/error', '/api/auth', '/api/register']
const protectedRoutes = ['/create', '/book', '/profile', '/dashboard']
const authRoutes = ['/auth/signin', '/auth/signup']

export default auth(async (req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Rate limiting для API
  if (nextUrl.pathname.startsWith('/api/generate-book')) {
    const identifier = req.auth?.user?.id || getClientIP(req)
    
    let rateLimited = false
    
    if (rateLimiter) {
      try {
        const result = await rateLimiter.limit(identifier)
        rateLimited = !result.success
      } catch (error) {
        console.error('Rate limiter error:', error)
      }
    } else {
      // Fallback для локальной разработки
      rateLimited = !SimpleRateLimiter.checkLimit(identifier, 3, 60 * 60 * 1000) // 3 в час
    }
    
    if (rateLimited) {
      return new NextResponse(
        JSON.stringify({ error: 'Слишком много запросов. Попробуйте позже.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // Аутентификация
  if (isLoggedIn && authRoutes.includes(nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  if (!isLoggedIn && protectedRoutes.some(route => nextUrl.pathname.startsWith(route))) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, nextUrl))
  }

  return NextResponse.next()
})

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()
  
  return 'unknown'
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}