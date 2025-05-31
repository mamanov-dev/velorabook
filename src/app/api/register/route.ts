import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Динамический импорт для условной загрузки
    const { userService } = await import('@/auth')
    const { validateWithSchema, UserRegistrationSchema } = await import('@/lib/validation')
    
    // Валидируем данные
    const validatedData = validateWithSchema(UserRegistrationSchema, body)
    
    // Создаем пользователя
    const user = await userService.createUser(validatedData)

    return NextResponse.json(
      { 
        success: true, 
        message: 'Пользователь успешно зарегистрирован',
        user
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Ошибка регистрации:', error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Внутренняя ошибка сервера' },
      { status: 400 }
    )
  }
}