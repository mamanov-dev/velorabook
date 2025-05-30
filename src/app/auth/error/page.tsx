'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorDetails = (errorCode: string | null) => {
    switch (errorCode) {
      case 'Configuration':
        return {
          title: 'Ошибка конфигурации',
          description: 'Произошла ошибка в настройках аутентификации. Обратитесь к администратору.',
          technical: 'Server configuration error'
        }
      case 'AccessDenied':
        return {
          title: 'Доступ запрещен',
          description: 'У вас нет прав доступа к этому ресурсу.',
          technical: 'Access denied by the provider'
        }
      case 'Verification':
        return {
          title: 'Ошибка верификации',
          description: 'Не удалось подтвердить ваш email или учетные данные.',
          technical: 'Email verification failed'
        }
      case 'OAuthSignin':
        return {
          title: 'Ошибка OAuth входа',
          description: 'Произошла ошибка при входе через внешний сервис (Google).',
          technical: 'OAuth signin error'
        }
      case 'OAuthCallback':
        return {
          title: 'Ошибка обратного вызова OAuth',
          description: 'Не удалось завершить аутентификацию через внешний сервис.',
          technical: 'OAuth callback error'
        }
      case 'OAuthCreateAccount':
        return {
          title: 'Ошибка создания OAuth аккаунта',
          description: 'Не удалось создать аккаунт через внешний сервис.',
          technical: 'OAuth account creation failed'
        }
      case 'EmailCreateAccount':
        return {
          title: 'Ошибка создания аккаунта',
          description: 'Не удалось создать аккаунт с указанным email.',
          technical: 'Email account creation failed'
        }
      case 'Callback':
        return {
          title: 'Ошибка обратного вызова',
          description: 'Произошла ошибка при обработке ответа от сервера аутентификации.',
          technical: 'Callback processing error'
        }
      case 'OAuthAccountNotLinked':
        return {
          title: 'Аккаунт не связан',
          description: 'Этот email уже используется с другим способом входа. Попробуйте войти другим способом.',
          technical: 'OAuth account not linked to existing account'
        }
      case 'EmailSignin':
        return {
          title: 'Ошибка email входа',
          description: 'Не удалось отправить письмо для входа.',
          technical: 'Email signin failed'
        }
      case 'CredentialsSignin':
        return {
          title: 'Неверные учетные данные',
          description: 'Неправильный email или пароль.',
          technical: 'Invalid credentials provided'
        }
      case 'SessionRequired':
        return {
          title: 'Требуется авторизация',
          description: 'Для доступа к этой странице необходимо войти в систему.',
          technical: 'Session required but not found'
        }
      default:
        return {
          title: 'Неизвестная ошибка',
          description: 'Произошла неожиданная ошибка при аутентификации.',
          technical: `Unknown error: ${errorCode || 'no error code'}`
        }
    }
  }

  const errorDetails = getErrorDetails(error)

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {errorDetails.title}
          </h1>

          {/* Error Description */}
          <p className="text-gray-600 mb-6">
            {errorDetails.description}
          </p>

          {/* Error Code (for debugging) */}
          {error && (
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-xs text-gray-500 font-mono">
                Код ошибки: {error}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {errorDetails.technical}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {/* Try Again Button */}
            <Link href="/auth/signin">
              <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium flex items-center justify-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                Попробовать снова
              </button>
            </Link>

            {/* Home Button */}
            <Link href="/">
              <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-all font-medium flex items-center justify-center">
                <Home className="w-4 h-4 mr-2" />
                На главную
              </button>
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-sm text-gray-500">
            <p>
              Если проблема повторяется, обратитесь в{' '}
              <a href="mailto:support@velorabook.com" className="text-purple-600 hover:text-purple-500">
                службу поддержки
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}