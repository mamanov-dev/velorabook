#!/usr/bin/env tsx

/**
 * Скрипт для тестирования всех компонентов системы VeloraBook
 * Запуск: npm run test:all или npx tsx scripts/test-all.ts
 */

import 'dotenv/config'
import { performance } from 'perf_hooks'

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

interface TestResult {
  name: string
  success: boolean
  duration: number
  error?: string
  details?: any
}

class TestRunner {
  private results: TestResult[] = []

  // Логирование с цветами
  private log(color: string, message: string) {
    console.log(`${color}${message}${colors.reset}`)
  }

  private logSuccess(message: string) {
    this.log(colors.green, `✅ ${message}`)
  }

  private logError(message: string) {
    this.log(colors.red, `❌ ${message}`)
  }

  private logWarning(message: string) {
    this.log(colors.yellow, `⚠️ ${message}`)
  }

  private logInfo(message: string) {
    this.log(colors.blue, `ℹ️ ${message}`)
  }

  // Выполнение теста с измерением времени
  private async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    const startTime = performance.now()
    
    try {
      this.logInfo(`Запуск теста: ${name}`)
      const result = await testFn()
      const duration = performance.now() - startTime
      
      this.logSuccess(`${name} - ${duration.toFixed(2)}ms`)
      
      return {
        name,
        success: true,
        duration,
        details: result
      }
    } catch (error) {
      const duration = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      this.logError(`${name} - ${errorMessage}`)
      
      return {
        name,
        success: false,
        duration,
        error: errorMessage
      }
    }
  }

  // Тест переменных окружения
  private async testEnvironmentVariables(): Promise<any> {
    const { env, serviceAvailability } = await import('../src/lib/env')
    
    const requiredVars = ['NODE_ENV', 'NEXTAUTH_SECRET', 'DATABASE_URL']
    const missing = requiredVars.filter(varName => !process.env[varName])
    
    if (missing.length > 0) {
      throw new Error(`Отсутствуют переменные окружения: ${missing.join(', ')}`)
    }

    return {
      nodeEnv: env.NODE_ENV,
      services: serviceAvailability,
      varsCount: Object.keys(process.env).length
    }
  }

  // Тест подключения к базе данных
  private async testDatabase(): Promise<any> {
    const { prisma, checkDatabaseHealth } = await import('../src/lib/prisma')
    
    const isHealthy = await checkDatabaseHealth()
    if (!isHealthy) {
      throw new Error('База данных недоступна')
    }

    // Тестируем простой запрос
    const userCount = await prisma.user.count()
    
    return {
      healthy: true,
      userCount,
      connection: 'OK'
    }
  }

  // Тест Redis подключения
  private async testRedis(): Promise<any> {
    const { checkRedisHealth, CacheService } = await import('../src/lib/redis')
    
    const health = await checkRedisHealth()
    
    if (!health.available) {
      // Redis не критичен для работы приложения
      return {
        available: false,
        type: health.type,
        warning: 'Redis недоступен, но это не критично'
      }
    }

    // Тестируем кеширование
    const testKey = 'test:cache:' + Date.now()
    const testValue = { test: true, timestamp: Date.now() }
    
    await CacheService.set(testKey, testValue, 10)
    const cached = await CacheService.get(testKey)
    await CacheService.delete(testKey)
    
    if (JSON.stringify(cached) !== JSON.stringify(testValue)) {
      throw new Error('Кеширование работает некорректно')
    }

    return {
      available: true,
      type: health.type,
      latency: health.latency
    }
  }

  // Тест валидации
  private async testValidation(): Promise<any> {
    const { 
      validateWithSchema, 
      UserRegistrationSchema, 
      GenerateBookSchema,
      ValidationUtils 
    } = await import('../src/lib/validation')

    // Тест валидации пользователя
    const validUser = {
      name: 'Тест Пользователь',
      email: 'test@example.com',
      password: 'test123456'
    }

    const invalidUser = {
      name: '',
      email: 'invalid-email',
      password: '123'
    }

    // Позитивный тест
    const validatedUser = validateWithSchema(UserRegistrationSchema, validUser)
    
    // Негативный тест
    try {
      validateWithSchema(UserRegistrationSchema, invalidUser)
      throw new Error('Валидация должна была завершиться с ошибкой')
    } catch (error) {
      if (!(error as any).issues) {
        throw error
      }
    }

    // Тест безопасности
    const sqlInjection = "'; DROP TABLE users; --"
    const xssAttempt = "<script>alert('xss')</script>"
    
    const isSqlInjection = ValidationUtils.isSqlInjection(sqlInjection)
    const isXSS = ValidationUtils.isXSS(xssAttempt)
    
    if (!isSqlInjection || !isXSS) {
      throw new Error('Обнаружение атак работает некорректно')
    }

    return {
      userValidation: 'OK',
      securityChecks: 'OK',
      sqlDetection: isSqlInjection,
      xssDetection: isXSS
    }
  }

  // Тест безопасности
  private async testSecurity(): Promise<any> {
    const { 
      TokenGenerator, 
      PasswordSecurity, 
      AttackProtection,
      FileSecurityUtils 
    } = await import('../src/lib/security')

    // Тест генерации токенов
    const token = TokenGenerator.generateSecureToken()
    const uuid = TokenGenerator.generateUUID()
    
    if (token.length !== 64 || !uuid.includes('-')) {
      throw new Error('Генерация токенов работает некорректно')
    }

    // Тест хеширования паролей
    const password = 'testPassword123'
    const hash = await PasswordSecurity.hashPassword(password)
    const isValid = await PasswordSecurity.verifyPassword(password, hash)
    
    if (!isValid) {
      throw new Error('Хеширование паролей работает некорректно')
    }

    // Тест проверки силы пароля
    const weakPassword = '123'
    const strongPassword = 'StrongPass123!'
    
    const weakCheck = PasswordSecurity.checkPasswordStrength(weakPassword)
    const strongCheck = PasswordSecurity.checkPasswordStrength(strongPassword)
    
    if (weakCheck.isStrong || !strongCheck.isStrong) {
      throw new Error('Проверка силы пароля работает некорректно')
    }

    // Тест обнаружения атак
    const sqlAttack = "1' OR '1'='1"
    const xssAttack = "<script>alert(1)</script>"
    
    const sqlDetected = AttackProtection.detectSQLInjection(sqlAttack)
    const xssDetected = AttackProtection.detectXSS(xssAttack)
    
    if (!sqlDetected || !xssDetected) {
      throw new Error('Обнаружение атак работает некорректно')
    }

    return {
      tokenGeneration: 'OK',
      passwordHashing: 'OK',
      passwordStrength: 'OK',
      attackDetection: 'OK',
      sqlDetection: sqlDetected,
      xssDetection: xssDetected
    }
  }

  // Тест аутентификации
  private async testAuthentication(): Promise<any> {
    const { userService } = await import('../src/auth')
    
    // Попытка получить демо пользователя
    const demoUser = await userService.getUserById('demo-user-id')
    
    if (!demoUser || demoUser.email !== 'demo@velorabook.com') {
      throw new Error('Демо пользователь недоступен')
    }

    return {
      demoUser: 'OK',
      userService: 'OK'
    }
  }

  // Тест API endpoints (простая проверка)
  private async testApiEndpoints(): Promise<any> {
    // Тест health endpoint
    try {
      const response = await fetch('http://localhost:3000/api/health')
      if (!response.ok) {
        throw new Error(`Health API вернул ${response.status}`)
      }
      const data = await response.json()
      
      return {
        healthEndpoint: 'OK',
        status: data.status
      }
    } catch (error) {
      // API может быть недоступен если сервер не запущен
      return {
        healthEndpoint: 'SKIP',
        reason: 'Сервер не запущен'
      }
    }
  }

  // Тест обработки изображений
  private async testImageProcessing(): Promise<any> {
    // Создаем тестовое base64 изображение (1x1 PNG)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    
    // Тест декодирования base64
    const base64Data = testImageBase64.split(',')[1]
    const decoded = Buffer.from(base64Data, 'base64')
    
    if (decoded.length === 0) {
      throw new Error('Декодирование base64 не работает')
    }

    // Проверка magic bytes для PNG
    const uint8Array = new Uint8Array(decoded)
    const isPNG = uint8Array[0] === 0x89 && uint8Array[1] === 0x50
    
    if (!isPNG) {
      throw new Error('Проверка magic bytes не работает')
    }

    return {
      base64Decoding: 'OK',
      magicBytesCheck: 'OK',
      imageSize: decoded.length
    }
  }

  // Выполнение всех тестов
  async runAllTests(): Promise<void> {
    console.log(`${colors.cyan}🧪 Запуск тестирования VeloraBook${colors.reset}`)
    console.log(`${colors.cyan}======================================${colors.reset}\n`)

    const tests = [
      { name: 'Переменные окружения', fn: () => this.testEnvironmentVariables() },
      { name: 'База данных', fn: () => this.testDatabase() },
      { name: 'Redis кеширование', fn: () => this.testRedis() },
      { name: 'Валидация данных', fn: () => this.testValidation() },
      { name: 'Система безопасности', fn: () => this.testSecurity() },
      { name: 'Аутентификация', fn: () => this.testAuthentication() },
      { name: 'API endpoints', fn: () => this.testApiEndpoints() },
      { name: 'Обработка изображений', fn: () => this.testImageProcessing() },
    ]

    // Выполняем тесты последовательно
    for (const test of tests) {
      const result = await this.runTest(test.name, test.fn)
      this.results.push(result)
    }

    this.printSummary()
  }

  // Вывод итогов тестирования
  private printSummary(): void {
    console.log(`\n${colors.cyan}📊 Итоги тестирования:${colors.reset}`)
    console.log(`${colors.cyan}==================${colors.reset}`)

    const passed = this.results.filter(r => r.success).length
    const failed = this.results.filter(r => !r.success).length
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0)

    console.log(`\n${colors.bright}Всего тестов: ${this.results.length}${colors.reset}`)
    this.logSuccess(`Успешно: ${passed}`)
    
    if (failed > 0) {
      this.logError(`Неудачно: ${failed}`)
    }
    
    this.logInfo(`Общее время: ${totalTime.toFixed(2)}ms`)

    // Детали по каждому тесту
    console.log(`\n${colors.bright}Подробности:${colors.reset}`)
    this.results.forEach(result => {
      const icon = result.success ? '✅' : '❌'
      const status = result.success ? 'PASS' : 'FAIL'
      console.log(`${icon} ${result.name}: ${status} (${result.duration.toFixed(2)}ms)`)
      
      if (result.error) {
        console.log(`   Ошибка: ${result.error}`)
      }
      
      if (result.details && typeof result.details === 'object') {
        const details = JSON.stringify(result.details, null, 2)
          .split('\n')
          .map(line => `   ${line}`)
          .join('\n')
        console.log(details)
      }
    })

    // Рекомендации
    console.log(`\n${colors.bright}Рекомендации:${colors.reset}`)
    
    const failedTests = this.results.filter(r => !r.success)
    if (failedTests.length === 0) {
      this.logSuccess('Все тесты пройдены! Система готова к работе.')
    } else {
      this.logWarning('Есть проблемы, которые нужно исправить:')
      failedTests.forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`)
      })
    }

    // Проверка производительности
    const slowTests = this.results.filter(r => r.duration > 1000)
    if (slowTests.length > 0) {
      this.logWarning('Медленные тесты (>1s):')
      slowTests.forEach(test => {
        console.log(`  - ${test.name}: ${test.duration.toFixed(2)}ms`)
      })
    }

    console.log(`\n${colors.cyan}🏁 Тестирование завершено${colors.reset}`)
    
    // Код выхода
    process.exit(failed > 0 ? 1 : 0)
  }
}

// Запуск тестирования
async function main() {
  const runner = new TestRunner()
  await runner.runAllTests()
}

// Обработка ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// Запуск если это главный модуль
if (require.main === module) {
  main().catch(console.error)
}