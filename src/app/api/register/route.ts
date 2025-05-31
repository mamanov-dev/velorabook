import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Временная заглушка для регистрации
    return NextResponse.json({
      success: false,
      error: 'Регистрация временно недоступна. Ведется настройка продакшн окружения.',
      message: 'Используйте демо-аккаунт: demo@velorabook.com / demo123'
    }, { status: 503 })
    
  } catch {
    return NextResponse.json({
      error: 'Ошибка обработки запроса'
    }, { status: 400 })
  }
}