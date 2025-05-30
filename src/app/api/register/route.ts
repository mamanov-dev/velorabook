import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Валидация данных
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      )
    }

    // Проверка email формата
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Некорректный формат email' },
        { status: 400 }
      )
    }

    // Проверка пароля (минимум 6 символов)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      )
    }

    // Создаем пользователя
    const user = await userService.createUser({ name, email, password })

    return NextResponse.json(
      { 
        success: true, 
        message: 'Пользователь успешно зарегистрирован',
        user: {
          id: user!.id,
          name: user!.name,
          email: user!.email
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Ошибка регистрации:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}