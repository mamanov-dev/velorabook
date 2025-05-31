import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { env } from '@/lib/env'

interface ErrorReport {
  type?: string
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
  userAgent: string
  url: string
  additionalInfo?: any
}

// Rate limiting для отчетов об ошибках (избегаем спам)
const errorReports = new Map<string, number[]>()

function shouldAllowErrorReport(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 минута
  const maxReports = 10 // максимум 10 отчетов в минуту с одного IP

  if (!errorReports.has(ip)) {
    errorReports.set(ip, [])
  }

  const ipReports = errorReports.get(ip)!
  const recentReports = ipReports.filter((time: number) => time > now - windowMs)

  if (recentReports.length >= maxReports) {
    return false
  }

  recentReports.push(now)
  errorReports.set(ip, recentReports)
  return true
}

// Функция для получения IP адреса из запроса
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('x-vercel-forwarded-for')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP.trim()
  }
  
  if (remoteAddr) {
    return remoteAddr.split(',')[0].trim()
  }
  
  return '127.0.0.1'
}

// Очистка старых записей rate limiting
setInterval(() => {
  const now = Date.now()
  const windowMs = 60 * 1000

  Array.from(errorReports.entries()).forEach(([ip, reports]) => {
    const recentReports = reports.filter((time: number) => time > now - windowMs)
    if (recentReports.length === 0) {
      errorReports.delete(ip)
    } else {
      errorReports.set(ip, recentReports)
    }
  })
}, 5 * 60 * 1000) // Очищаем каждые 5 минут

export async function POST(request: NextRequest) {
  try {
    // Получаем IP для rate limiting
    const ip = getClientIP(request)
    
    // Проверяем rate limiting
    if (!shouldAllowErrorReport(ip)) {
      return NextResponse.json(
        { error: 'Too many error reports' },
        { status: 429 }
      )
    }

    // Парсим данные об ошибке
    const errorReport: ErrorReport = await request.json()

    // Базовая валидация
    if (!errorReport.message || !errorReport.timestamp) {
      return NextResponse.json(
        { error: 'Invalid error report format' },
        { status: 400 }
      )
    }

    // Получаем информацию о пользователе (если авторизован)
    const session = await auth()
    const userId = session?.user?.id
    const userEmail = session?.user?.email

    // Создаем структурированный отчет об ошибке
    const structuredError = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: errorReport.timestamp,
      type: errorReport.type || 'client_error',
      message: errorReport.message,
      stack: errorReport.stack,
      componentStack: errorReport.componentStack,
      url: errorReport.url,
      userAgent: errorReport.userAgent,
      userId: userId || null,
      userEmail: userEmail || null,
      ip: ip,
      additionalInfo: errorReport.additionalInfo,
      environment: env.NODE_ENV,
      severity: determineErrorSeverity(errorReport),
      fingerprint: generateErrorFingerprint(errorReport),
    }

    // Логируем ошибку
    console.error('🚨 Client Error Report:', {
      id: structuredError.id,
      type: structuredError.type,
      message: structuredError.message,
      severity: structuredError.severity,
      userId: structuredError.userId,
      url: structuredError.url,
      fingerprint: structuredError.fingerprint,
    })

    // В production можно отправлять в внешние сервисы
    if (env.NODE_ENV === 'production') {
      // Пример отправки в Sentry
      // await sendToSentry(structuredError)
      
      // Пример отправки в собственную систему мониторинга
      // await sendToMonitoringService(structuredError)
      
      // Пример сохранения в базу данных (если есть доступ)
      try {
        await saveErrorToDatabase(structuredError)
      } catch (dbError) {
        console.error('Failed to save error to database:', dbError)
      }
    }

    // Определяем нужно ли уведомить администраторов
    if (structuredError.severity === 'critical' || structuredError.severity === 'high') {
      await notifyAdministrators(structuredError)
    }

    return NextResponse.json(
      { 
        success: true,
        errorId: structuredError.id,
        message: 'Error report received'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ Failed to process error report:', error)
    
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    )
  }
}

// Определение серьезности ошибки
function determineErrorSeverity(errorReport: ErrorReport): 'low' | 'medium' | 'high' | 'critical' {
  const { message, stack, type } = errorReport

  // Критические ошибки
  if (type === 'critical_app_error' || 
      message.includes('ChunkLoadError') ||
      message.includes('Script error') ||
      message.includes('Network Error')) {
    return 'critical'
  }

  // Высокий приоритет
  if (message.includes('TypeError') ||
      message.includes('ReferenceError') ||
      message.includes('RangeError') ||
      stack?.includes('at Auth') ||
      stack?.includes('at API')) {
    return 'high'
  }

  // Средний приоритет
  if (message.includes('Warning') ||
      message.includes('Deprecated') ||
      type === 'validation_error') {
    return 'medium'
  }

  // Низкий приоритет
  return 'low'
}

// Генерация отпечатка ошибки для группировки похожих ошибок
function generateErrorFingerprint(errorReport: ErrorReport): string {
  const { message, stack } = errorReport
  
  // Создаем отпечаток на основе сообщения и стека
  const cleanMessage = message.replace(/\d+/g, 'X') // Заменяем числа
  const stackLine = stack?.split('\n')[1] || '' // Первая строка стека
  const cleanStackLine = stackLine.replace(/:\d+:\d+/g, ':X:X') // Заменяем номера строк
  
  const fingerprint = `${cleanMessage}|${cleanStackLine}`
  
  // Создаем простой хеш
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Конвертируем в 32-битное целое
  }
  
  return Math.abs(hash).toString(36)
}

// Сохранение ошибки в базу данных (если доступна)
async function saveErrorToDatabase(errorReport: any) {
  try {
    // Проверяем доступность базы данных
    const { serviceAvailability } = await import('@/lib/env')
    
    if (!serviceAvailability.database) {
      console.log('Database not available for error logging')
      return
    }

    const { prisma } = await import('@/lib/prisma')
    
    // Сохраняем в таблицу api_usage как error log
    await prisma.apiUsage.create({
      data: {
        userId: errorReport.userId,
        endpoint: '/api/errors',
        method: 'POST',
        statusCode: 500, // Помечаем как ошибку
        duration: 0,
        errorMessage: JSON.stringify({
          id: errorReport.id,
          type: errorReport.type,
          message: errorReport.message,
          severity: errorReport.severity,
          fingerprint: errorReport.fingerprint,
          url: errorReport.url,
        }),
      }
    })

    console.log('✅ Error saved to database:', errorReport.id)
  } catch (error) {
    console.error('❌ Failed to save error to database:', error)
  }
}

// Уведомление администраторов о критических ошибках
async function notifyAdministrators(errorReport: any) {
  try {
    // В реальном приложении здесь может быть:
    // - Отправка email
    // - Уведомление в Slack
    // - Push-уведомление
    // - SMS

    console.log('🚨 CRITICAL ERROR ALERT:', {
      id: errorReport.id,
      message: errorReport.message,
      severity: errorReport.severity,
      userEmail: errorReport.userEmail,
      url: errorReport.url,
      timestamp: errorReport.timestamp,
    })

    // Пример отправки в webhook (если настроен)
    if (process.env.ALERT_WEBHOOK_URL) {
      await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Critical Error in VeloraBook\n` +
                `Message: ${errorReport.message}\n` +
                `Severity: ${errorReport.severity}\n` +
                `User: ${errorReport.userEmail || 'Anonymous'}\n` +
                `URL: ${errorReport.url}\n` +
                `Error ID: ${errorReport.id}`,
        }),
      })
    }
  } catch (error) {
    console.error('Failed to notify administrators:', error)
  }
}

// GET метод для получения статистики ошибок (только для разработки)
export async function GET(request: NextRequest) {
  if (env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Возвращаем базовую статистику для разработки
    return NextResponse.json({
      activeIps: errorReports.size,
      totalReportsInMemory: Array.from(errorReports.values())
        .reduce((sum, reports) => sum + reports.length, 0),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get error stats' }, { status: 500 })
  }
}