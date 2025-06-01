import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/auth'
import { validateWithSchema, UserRegistrationSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Валидируем данные
    const validatedData = validateWithSchema(UserRegistrationSchema, body);

    // Создаем пользователя
    const user = await userService.createUser(validatedData);

    return NextResponse.json(
      {
        success: true,
        message: 'Пользователь успешно зарегистрирован',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Ошибка регистрации:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Внутренняя ошибка сервера',
      },
      { status: 400 }
    );
  }
}
