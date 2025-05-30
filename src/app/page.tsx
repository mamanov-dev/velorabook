'use client'

import { useSession, signOut } from 'next-auth/react'
import { Sparkles, Star, Clock, Globe, Heart, Users, BookOpen, ArrowRight, User, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              VeloraBook
            </h1>
          </Link>
          <nav className="hidden md:flex space-x-6 items-center">
            <a href="#how-it-works" className="text-gray-600 hover:text-purple-600">Как работает</a>
            <a href="#book-types" className="text-gray-600 hover:text-purple-600">Примеры</a>
            <a href="#pricing" className="text-gray-600 hover:text-purple-600">Цены</a>
            
            {status === 'loading' ? (
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            ) : session ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'Аватар'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-600" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {session.user?.name?.split(' ')[0] || 'Пользователь'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Link href="/dashboard">
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                      Дашборд
                    </button>
                  </Link>
                  <Link href="/profile">
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                      <Settings className="w-4 h-4" />
                    </button>
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    title="Выйти"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/signin">
                  <button className="text-gray-600 hover:text-purple-600 transition-colors">
                    Войти
                  </button>
                </Link>
                <Link href="/auth/signup">
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                    Регистрация
                  </button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-800 mb-6">
            Создайте персональную книгу с помощью 
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> ИИ</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Ваши истории станут уникальным подарком, который будут хранить всю жизнь. 
            Просто ответьте на вопросы, загрузите фото — ИИ создаст книгу за 15 минут.
          </p>

          {/* Stats */}
          <div className="flex justify-center items-center space-x-8 mb-12 text-sm text-gray-500">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-500 mr-1" />
              <span>4.9/5 (2,847 отзывов)</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>Готово за 15 минут</span>
            </div>
            <div className="flex items-center">
              <Globe className="w-4 h-4 mr-1" />
              <span>Доставка в 50+ стран</span>
            </div>
          </div>

          {session ? (
            <Link href="/dashboard">
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all shadow-lg">
                Перейти в дашборд
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </button>
            </Link>
          ) : (
            <div className="space-y-4">
              <Link href="/create">
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all shadow-lg">
                  Создать мою книгу
                  <ArrowRight className="w-5 h-5 ml-2 inline" />
                </button>
              </Link>
              <p className="text-sm text-gray-500">
                Или{' '}
                <Link href="/auth/signup" className="text-purple-600 hover:text-purple-500 font-medium">
                  зарегистрируйтесь
                </Link>
                {' '}для сохранения ваших книг
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Book Types */}
      <section id="book-types" className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Выберите тип вашей книги
        </h3>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Romantic Book */}
          <Link href={session ? "/create?type=romantic" : "/auth/signin?callbackUrl=/create?type=romantic"}>
            <div className="group bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-3">Романтическая книга</h4>
              <p className="text-gray-600 mb-4">Для второй половинки</p>
              <ul className="text-sm text-gray-500 space-y-1 mb-6">
                <li>• AI-генерация романтического текста</li>
                <li>• Красивый дизайн</li>
                <li>• Фотоколлажи ваших моментов</li>
              </ul>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  15 мин
                </span>
                <span className="text-lg font-bold text-purple-600">2,990₽</span>
              </div>
            </div>
          </Link>

          {/* Family Book */}
          <Link href={session ? "/create?type=family" : "/auth/signin?callbackUrl=/create?type=family"}>
            <div className="group bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-3">Семейная история</h4>
              <p className="text-gray-600 mb-4">Для родителей или детей</p>
              <ul className="text-sm text-gray-500 space-y-1 mb-6">
                <li>• Семейное древо</li>
                <li>• Временная шкала событий</li>
                <li>• Архив семейных фото</li>
              </ul>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  20 мин
                </span>
                <span className="text-lg font-bold text-purple-600">3,990₽</span>
              </div>
            </div>
          </Link>

          {/* Friendship Book */}
          <Link href={session ? "/create?type=friendship" : "/auth/signin?callbackUrl=/create?type=friendship"}>
            <div className="group bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-3">Книга дружбы</h4>
              <p className="text-gray-600 mb-4">Для лучшего друга</p>
              <ul className="text-sm text-gray-500 space-y-1 mb-6">
                <li>• Хронология дружбы</li>
                <li>• Веселые моменты</li>
                <li>• Совместные фотографии</li>
              </ul>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  12 мин
                </span>
                <span className="text-lg font-bold text-purple-600">2,490₽</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Как это работает
          </h3>
          
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold">1</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Выберите тип</h4>
              <p className="text-sm text-gray-600">Романтика, семья или дружба</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Ответьте на вопросы</h4>
              <p className="text-sm text-gray-600">ИИ задаст персональные вопросы</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Загрузите фото</h4>
              <p className="text-sm text-gray-600">Добавьте ваши лучшие моменты</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold">4</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Получите книгу</h4>
              <p className="text-sm text-gray-600">ИИ создаст уникальную историю</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href={session ? "/dashboard" : "/auth/signup"}>
              <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                {session ? "Перейти в дашборд" : "Начать создание"}
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Auth CTA Section (only for non-authenticated users) */}
      {!session && (
        <section className="bg-gradient-to-r from-purple-600 to-blue-600 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-4">
              Готовы создать свою уникальную книгу?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Зарегистрируйтесь сейчас и получите доступ ко всем возможностям VeloraBook
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/auth/signup">
                <button className="bg-white text-purple-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
                  Создать аккаунт
                </button>
              </Link>
              <Link href="/auth/signin">
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-purple-600 transition-colors font-semibold">
                  Уже есть аккаунт
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <span className="text-xl font-bold">VeloraBook</span>
              </div>
              <p className="text-gray-400">
                Создавайте персональные книги с помощью ИИ
              </p>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Продукт</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#how-it-works" className="hover:text-white">Как работает</a></li>
                <li><a href="#book-types" className="hover:text-white">Примеры</a></li>
                <li><a href="#pricing" className="hover:text-white">Цены</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Поддержка</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Помощь</a></li>
                <li><a href="#" className="hover:text-white">Контакты</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Компания</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">О нас</a></li>
                <li><a href="#" className="hover:text-white">Блог</a></li>
                <li><a href="#" className="hover:text-white">Карьера</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 VeloraBook. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}