'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface UseAuthGuardOptions {
  redirectTo?: string
  requireAuth?: boolean
  redirectIfAuthenticated?: boolean
}

export function useAuthGuard({
  redirectTo = '/auth/signin',
  requireAuth = true,
  redirectIfAuthenticated = false
}: UseAuthGuardOptions = {}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Ждем загрузки сессии

    const isAuthenticated = !!session
    const shouldRedirect = requireAuth ? !isAuthenticated : redirectIfAuthenticated && isAuthenticated

    if (shouldRedirect) {
      const targetUrl = requireAuth 
        ? `${redirectTo}?callbackUrl=${encodeURIComponent(window.location.pathname)}`
        : redirectTo

      console.log('🔐 Auth guard redirect:', {
        isAuthenticated,
        requireAuth,
        redirectIfAuthenticated,
        targetUrl
      })

      router.push(targetUrl)
    }
  }, [session, status, router, redirectTo, requireAuth, redirectIfAuthenticated])

  return {
    session,
    status,
    isAuthenticated: !!session,
    isLoading: status === 'loading'
  }
}

// Специализированные хуки для часто используемых случаев
export function useRequireAuth(redirectTo?: string) {
  return useAuthGuard({ requireAuth: true, redirectTo })
}

export function useRedirectIfAuthenticated(redirectTo: string = '/dashboard') {
  return useAuthGuard({ 
    requireAuth: false, 
    redirectIfAuthenticated: true, 
    redirectTo 
  })
}