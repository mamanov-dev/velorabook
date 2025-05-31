'use client';

import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SessionProvider } from 'next-auth/react';
import { BookProvider } from '@/contexts/BookContext';
import { RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

function AppErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Приложение VeloraBook столкнулось с ошибкой
        </h1>

        <p className="text-gray-600 mb-6">
          Произошла критическая ошибка при загрузке приложения. 
          Пожалуйста, попробуйте перезагрузить страницу.
        </p>

        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Попробовать снова
          </button>

          <Link href="/">
            <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-all font-medium flex items-center justify-center">
              <Home className="w-4 h-4 mr-2" />
              На главную
            </button>
          </Link>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>Код ошибки: {error.name || 'UnknownError'}</p>
          <p className="mt-1">
            Если проблема повторяется, обратитесь в{' '}
            <a
              href="mailto:support@velorabook.com"
              className="text-purple-600 hover:text-purple-500 underline"
            >
              службу поддержки
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={AppErrorFallback}
      onError={(error, errorInfo) => {
        console.error('🚨 Critical app error:', error, errorInfo);

        if (process.env.NODE_ENV === 'production') {
          try {
            fetch('/api/errors', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'critical_app_error',
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
              }),
            }).catch(console.error);
          } catch (e) {
            console.error('❌ Failed to report critical error:', e);
          }
        }
      }}
    >
      <SessionProvider
        refetchInterval={5 * 60}
        refetchOnWindowFocus={true}
        refetchWhenOffline={false}
      >
        <BookProvider>{children}</BookProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
