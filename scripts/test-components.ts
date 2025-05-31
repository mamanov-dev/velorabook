#!/usr/bin/env tsx

import 'dotenv/config'

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

class ComponentTester {
  private log(color: string, message: string) {
    console.log(`${color}${message}${colors.reset}`)
  }

  // Тест переменных окружения
  async testEnvironment() {
    console.log(`${colors.cyan}🔧 Тестирование переменных окружения...${colors.reset}`)
    
    try {
      const { env, serviceAvailability } = await import('../src/lib/env')
      
      console.log('✅ Переменные загружены успешно')
      console.log(`   NODE_ENV: ${env.NODE_ENV}`)
      console.log(`   База данных: ${serviceAvailability.database ? '✅' : '❌'}`)
      console.log(`   OpenAI: ${serviceAvailability.openai ? '✅' : '❌'}`)
      console.log(`   Google Auth: ${serviceAvailability.googleAuth ? '✅' : '❌'}`)
      console.log(`   Cloudflare R2: ${serviceAvailability.cloudflareR2 ? '✅' : '❌'}`)
      console.log(`   Upstash Redis: ${serviceAvailability.upstashRedis ? '✅' : '❌'}`)
      
      return true
    } catch (error) {
      this.log(colors.red, `❌ Ошибка: ${error}`)
      return false
    }
  }

  // Тест базы данных
  async testDatabase() {
    console.log(`\n${colors.cyan}🗄️ Тестирование базы данных...${colors.reset}`)
    
    try {
      const { prisma, checkDatabaseHealth } = await import('../src/lib/prisma')
      
      // Проверка подключения
      const isHealthy = await checkDatabaseHealth()
      if (!isHealthy) {
        throw new Error('База данных недоступна')
      }
      
      console.log('✅ Подключение к базе данных: OK')
      
      // Проверка таблиц
      const userCount = await prisma.user.count()
      console.log(`✅ Пользователи в базе: ${userCount}`)
      
      // Проверка демо пользователя
      const demoUser = await prisma.user.findUnique({
        where: { email: 'demo@velorabook.com' }
      })
      
      console.log(`✅ Демо пользователь: ${demoUser ? 'найден' : 'не найден'}`)
      
      return true
    } catch (error) {
      this.log(colors.red, `❌ Ошибка базы данных: ${error}`)
      return false
    }
  }

  // Тест Redis
  async testRedis() {
    console.log(`\n${colors.cyan}📦 Тестирование Redis...${colors.reset}`)
    
    try {
      const { checkRedisHealth, CacheService } = await import('../src/lib/redis')
      
      const health = await checkRedisHealth()
      
      if (health.available) {
        console.log(`✅ Redis подключен (${health.type})`)
        console.log(`✅ Латентность: ${health.latency}ms`)
        
        // Тест кеширования
        const testKey = `test:${Date.now()}`
        const testData = { message: 'test', timestamp: Date.now() }
        
        await CacheService.set(testKey, testData, 10)
        const cached = await CacheService.get(testKey)
        await CacheService.delete(testKey)
        
        if (JSON.stringify(cached) === JSON.stringify(testData)) {
          console.log('✅ Кеширование работает корректно')
        } else {
          throw new Error('Кеширование работает некорректно')
        }
      } else {
        this.log(colors.yellow, `⚠️ Redis недоступен: ${health.error}`)
        console.log('   Это не критично для работы приложения')
      }
      
      return true
    } catch (error) {
      this.log(colors.red, `❌ Ошибка Redis: ${error}`)
      return false
    }
  }

  // Тест аутентификации
  async testAuthentication() {
    console.log(`\n${colors.cyan}🔐 Тестирование аутентификации...${colors.reset}`)
    
    try {
      const { userService } = await import('../src/auth')
      
      // Проверка демо пользователя
      const demoUser = await userService.getUserById('demo-user-id')
      
      if (demoUser && demoUser.email === 'demo@velorabook.com') {
        console.log('✅ Демо пользователь доступен')
      } else {
        throw new Error('Демо пользователь недоступен')
      }
      
      console.log('✅ Сервис пользователей работает')
      
      return true
    } catch (error) {
      this.log(colors.red, `❌ Ошибка аутентификации: ${error}`)
      return false
    }
  }

  // Тест валидации
  async testValidation() {
    console.log(`\n${colors.cyan}✅ Тестирование валидации...${colors.reset}`)
    
    try {
      const { 
        validateWithSchema, 
        UserRegistrationSchema, 
        ValidationUtils 
      } = await import('../src/lib/validation')
      
      // Позитивный тест
      const validUser = {
        name: 'Тест Пользователь',
        email: 'test@example.com',
        password: 'test123456'
      }
      
      const validated = validateWithSchema(UserRegistrationSchema, validUser)
      console.log('✅ Валидация корректных данных: OK')
      
      // Негативный тест
      try {
        const invalidUser = {
          name: '',
          email: 'invalid-email',
          password: '123'
        }
        validateWithSchema(UserRegistrationSchema, invalidUser)
        throw new Error('Валидация должна была завершиться с ошибкой')
      } catch (validationError: any) {
        if (validationError.issues) {
          console.log('✅ Валидация некорректных данных: OK')
        } else {
          throw validationError
        }
      }
      
      // Тест безопасности
      const sqlTest = ValidationUtils.isSqlInjection("'; DROP TABLE users; --")
      const xssTest = ValidationUtils.isXSS("<script>alert('xss')</script>")
      
      if (sqlTest && xssTest) {
        console.log('✅ Обнаружение атак: OK')
      } else {
        throw new Error('Обнаружение атак работает некорректно')
      }
      
      return true
    } catch (error) {
      this.log(colors.red, `❌ Ошибка валидации: ${error}`)
      return false
    }
  }

  // Тест безопасности
  async testSecurity() {
    console.log(`\n${colors.cyan}🛡️ Тестирование безопасности...${colors.reset}`)
    
    try {
      const { 
        TokenGenerator, 
        PasswordSecurity, 
        AttackProtection 
      } = await import('../src/lib/security')
      
      // Тест токенов
      const token = TokenGenerator.generateSecureToken()
      const uuid = TokenGenerator.generateUUID()
      
      if (token.length === 64 && uuid.includes('-')) {
        console.log('✅ Генерация токенов: OK')
      } else {
        throw new Error('Генерация токенов работает некорректно')
      }
      
      // Тест паролей
      const password = 'TestPassword123!'
      const hash = await PasswordSecurity.hashPassword(password)
      const isValid = await PasswordSecurity.verifyPassword(password, hash)
      
      if (isValid) {
        console.log('✅ Хеширование паролей: OK')
      } else {
        throw new Error('Хеширование паролей работает некорректно')
      }
      
      // Тест обнаружения атак
      const sqlDetected = AttackProtection.detectSQLInjection("1' OR '1'='1")
      const xssDetected = AttackProtection.detectXSS("<script>alert(1)</script>")
      
      if (sqlDetected && xssDetected) {
        console.log('✅ Обнаружение атак: OK')
      } else {
        throw new Error('Обнаружение атак работает некорректно')
      }
      
      return true
    } catch (error) {
      this.log(colors.red, `❌ Ошибка безопасности: ${error}`)
      return false
    }
  }

  // Тест API (если сервер запущен)
  async testAPI() {
    console.log(`\n${colors.cyan}🌐 Тестирование API...${colors.reset}`)
    
    try {
      // Проверяем health endpoint
      const response = await fetch('http://localhost:3000/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Health API: ${data.status}`)
        return true
      } else {
        throw new Error(`API вернул статус ${response.status}`)
      }
    } catch (error) {
      this.log(colors.yellow, `⚠️ API недоступен: ${error}`)
      console.log('   Убедитесь что сервер запущен: npm run dev')
      return false
    }
  }

  // Запуск всех тестов
  async runAll() {
    console.log(`${colors.cyan}🧪 Тестирование компонентов VeloraBook${colors.reset}`)
    console.log(`${colors.cyan}=====================================${colors.reset}\n`)
    
    const tests = [
      { name: 'Переменные окружения', fn: () => this.testEnvironment() },
      { name: 'База данных', fn: () => this.testDatabase() },
      { name: 'Redis кеширование', fn: () => this.testRedis() },
      { name: 'Аутентификация', fn: () => this.testAuthentication() },
      { name: 'Валидация', fn: () => this.testValidation() },
      { name: 'Безопасность', fn: () => this.testSecurity() },
      { name: 'API', fn: () => this.testAPI() },
    ]
    
    let passed = 0
    let failed = 0
    
    for (const test of tests) {
      try {
        const result = await test.fn()
        if (result) {
          passed++
        } else {
          failed++
        }
      } catch (error) {
        this.log(colors.red, `❌ ${test.name}: ${error}`)
        failed++
      }
    }
    
    // Итоги
    console.log(`\n${colors.cyan}📊 Итоги тестирования:${colors.reset}`)
    this.log(colors.green, `✅ Успешно: ${passed}`)
    
    if (failed > 0) {
      this.log(colors.red, `❌ Неудачно: ${failed}`)
    }
    
    if (failed === 0) {
      this.log(colors.green, '\n🎉 Все компоненты работают корректно!')
    } else {
      this.log(colors.yellow, '\n⚠️ Некоторые компоненты требуют внимания')
    }
    
    return failed === 0
  }
}

// Запуск при прямом вызове
if (require.main === module) {
  const tester = new ComponentTester()
  tester.runAll()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Критическая ошибка:', error)
      process.exit(1)
    })
}

export { ComponentTester }