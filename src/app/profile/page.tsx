'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  ArrowLeft,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react'

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || ''
      })
    }
  }, [session])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900">Загружаем профиль...</h2>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      // В реальном приложении здесь был бы API вызов для обновления профиля
      await new Promise(resolve => setTimeout(resolve, 1000)) // Имитация API запроса
      
      // Обновляем сессию
      await update({
        ...session,
        user: {
          ...session.user,
          name: formData.name
        }
      })

      setMessage({ type: 'success', text: 'Профиль успешно обновлен!' })
      setIsEditing(false)
    } catch {
      setMessage({ type: 'error', text: 'Ошибка при обновлении профиля' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: session.user?.name || '',
      email: session.user?.email || ''
    })
    setIsEditing(false)
    setMessage(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <button className="flex items-center text-gray-600 hover:text-gray-800 transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Назад в дашборд
                </button>
              </Link>
            </div>

            <Link href="/" className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                VeloraBook
              </h1>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Профиль пользователя</h2>
            <p className="text-gray-600">Управляйте информацией вашего аккаунта</p>
          </div>

          {/* Message */}
          {message && (
            <div className={`flex items-center space-x-2 p-4 rounded-lg mb-6 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Avatar Section */}
            <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-gray-200">
              <div className="relative">
                {session.user?.image ? (
                  <Image 
                    src={session.user.image} 
                    alt={session.user.name || 'Аватар'}
                    width={80}
                    height={80}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-purple-600" />
                  </div>
                )}
                <button className="absolute -bottom-1 -right-1 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors">
                  <Edit className="w-3 h-3" />
                </button>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {session.user?.name || 'Пользователь'}
                </h3>
                <p className="text-gray-600">{session.user?.email}</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4 mr-1" />
                  <span>Аккаунт подтвержден</span>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Полное имя
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                    }`}
                    placeholder="Введите ваше имя"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email адрес
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={true} // Email обычно нельзя изменить
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    placeholder="your@email.com"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Email нельзя изменить. Обратитесь в поддержку для изменения.
                </p>
              </div>

              {/* Account Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата регистрации
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formatDate('2024-01-15')} // В реальном приложении это будет из базы данных
                    disabled
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8 pt-8 border-t border-gray-200">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Редактировать
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Отменить
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Сохранить
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Additional Settings */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Дополнительные настройки</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Уведомления по email</h4>
                  <p className="text-sm text-gray-600">Получать уведомления о новых функциях</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Двухфакторная аутентификация</h4>
                  <p className="text-sm text-gray-600">Дополнительная защита вашего аккаунта</p>
                </div>
                <button className="text-purple-600 hover:text-purple-700 font-medium">
                  Настроить
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-900">Удалить аккаунт</h4>
                  <p className="text-sm text-red-600">Безвозвратно удалить ваш аккаунт и все данные</p>
                </div>
                <button className="text-red-600 hover:text-red-700 font-medium">
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}