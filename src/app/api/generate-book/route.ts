import { NextRequest, NextResponse } from 'next/server';

// Временно отключаем API для успешной сборки
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'API генерации книг временно недоступен. Ведется настройка продакшн окружения.',
    code: 'MAINTENANCE'
  }, { status: 503 });
}

// После настройки окружения, замените этот файл на полную версию