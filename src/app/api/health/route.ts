import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Упрощенный health check без подключения к базе данных
    const status = 'healthy'
    
    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      services: {
        application: 'healthy',
        database: 'skipped', // Пропускаем проверку БД во время сборки
        redis: 'skipped',
      },
      message: 'Application is running'
    }, { 
      status: 200 
    })
  } catch {
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed'
    }, { status: 503 })
  }
}