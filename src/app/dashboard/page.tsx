'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { 
  Sparkles, 
  BookOpen, 
  Heart, 
  Users, 
  Camera, 
  Plus,
  Settings,
  LogOut,
  Star,
  Clock,
  ArrowRight,
  User
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900">Загружаем ваш профиль...</h2>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                VeloraBook
              </h1>
            </Link>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {session.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || 'Аватар'}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {session.user?.name || 'Пользователь'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session.user?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                  <Settings className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSignOut}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                  title="Выйти"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Добро пожаловать, {session.user?.name?.split(' ')[0] || 'друг'}! 👋
          </h2>
          <p className="text-xl text-gray-600">
            Готовы создать персональную книгу? Ваши истории ждут своего часа.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link href="/create?type=romantic">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Романтическая книга
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Создайте историю любви
              </p>
              <div className="flex items-center text-purple-600 text-sm font-medium">
                Создать
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/create?type=family">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Семейная хроника
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Сохраните семейную историю
              </p>
              <div className="flex items-center text-purple-600 text-sm font-medium">
                Создать
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/create?type=friendship">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Книга дружбы
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Отпразднуйте дружбу
              </p>
              <div className="flex items-center text-purple-600 text-sm font-medium">
                Создать
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/create">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group border-2 border-dashed border-purple-200">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Другие типы
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Выберите из всех вариантов
              </p>
              <div className="flex items-center text-purple-600 text-sm font-medium">
                Выбрать
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Books Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Ваши книги</h3>
            <Link href="/create">
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all">
                Создать новую
              </button>
            </Link>
          </div>

          {/* Empty State */}
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              У вас пока нет созданных книг
            </h4>
            <p className="text-gray-600 mb-6">
              Создайте свою первую персональную книгу прямо сейчас!
            </p>
            <Link href="/create">
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all">
                Создать первую книгу
              </button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              ИИ высшего класса
            </h4>
            <p className="text-gray-600 text-sm">
              Используем GPT-4 для создания качественных, эмоциональных историй
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Camera className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Анализ фотографий
            </h4>
            <p className="text-gray-600 text-sm">
              ИИ анализирует ваши фото и включает их описания в повествование
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Быстрое создание
            </h4>
            <p className="text-gray-600 text-sm">
              Полноценная книга готова за 2-3 минуты. Никакого долгого ожидания
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">2,847</div>
              <div className="text-purple-100">Создано книг</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">4.9</div>
              <div className="text-purple-100 flex items-center justify-center">
                <Star className="w-4 h-4 mr-1 fill-current" />
                Средняя оценка
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">15k+</div>
              <div className="text-purple-100">Довольных пользователей</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-purple-100">Стран доставки</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}