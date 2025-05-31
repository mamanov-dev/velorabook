'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: React.ComponentType<{error: Error; resetError: () => void}>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

// Дефолтный компонент для отображения ошибок
function DefaultErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error
  resetError: () => void 
}) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Error Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Что-то пошло не так
        </h1>

        {/* Error Description */}
        <p className="text-gray-600 mb-6">
          Произошла неожиданная ошибка. Мы автоматически получили уведомление об этой проблеме.
        </p>

        {/* Error Details (только в development) */}
        {isDevelopment && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <Bug className="w-4 h-4 mr-2" />
              Детали ошибки (dev mode):
            </h3>
            <div className="text-xs font-mono text-gray-600 break-all">
              <div className="mb-2">
                <strong>Сообщение:</strong> {error.message}
              </div>
              {error.stack && (
                <div>
                  <strong>Stack trace:</strong>
                  <pre className="mt-1 text-xs text-gray-500 whitespace-pre-wrap">
                    {error.stack.split('\n').slice(0, 5).join('\n')}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {/* Try Again Button */}
          <button
            onClick={resetError}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-medium flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Попробовать снова
          </button>

          {/* Home Button */}
          <Link href="/">
            <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-all font-medium flex items-center justify-center">
              <Home className="w-4 h-4 mr-2" />
              На главную
            </button>
          </Link>
        </div>

        {/* Support Text */}
        <div className="mt-6 text-sm text-gray-500">
          <p>
            Если проблема повторяется, обратитесь в{' '}
            <a 
              href="mailto:support@velorabook.com" 
              className="text-red-600 hover:text-red-500 underline"
            >
              службу поддержки
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Обновляем состояние, чтобы следующий рендер показал запасной UI
    return { 
      hasError: true, 
      error 
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Логируем ошибку
    console.error('ErrorBoundary поймал ошибку:', error, errorInfo)
    
    // Обновляем состояние с информацией об ошибке
    this.setState({
      error,
      errorInfo
    })

    // Вызываем пользовательский обработчик если он есть
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // В продакшене можно отправить ошибку в сервис мониторинга
    if (process.env.NODE_ENV === 'production') {
      // Например, отправка в Sentry:
      // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
      
      // Или в собственный API:
      this.reportErrorToService(error, errorInfo)
    }
  }

  // Метод для сброса состояния ошибки
  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined 
    })
  }

  // Отправка ошибки в сервис (пример)
  private reportErrorToService = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      })
    } catch (reportingError) {
      console.error('Не удалось отправить отчет об ошибке:', reportingError)
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Используем пользовательский fallback компонент или дефолтный
      const Fallback = this.props.fallback || DefaultErrorFallback
      
      return (
        <Fallback 
          error={this.state.error} 
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// Хук для использования в функциональных компонентах
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    console.error('Ошибка компонента:', error, errorInfo)
    
    // В продакшене можно отправить в сервис мониторинга
    if (process.env.NODE_ENV === 'production') {
      // Отправка ошибки в API
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          additionalInfo: errorInfo,
        }),
      }).catch(reportingError => {
        console.error('Не удалось отправить отчет об ошибке:', reportingError)
      })
    }
  }
}

// Компонент-обертка для удобного использования
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{error: Error; resetError: () => void}>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}