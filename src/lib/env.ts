import { z } from 'zod'

const envSchema = z.object({
  // Базовые переменные Next.js
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional(),
  
  // База данных
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required for book generation'),
  
  // Google OAuth (опционально)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Cloudflare R2 Storage (опционально)
  R2_ENDPOINT: z.string().url().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  
  // Redis (опционально для локальной разработки)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().regex(/^\d+$/).transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  
  // Upstash Redis (для продакшена)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
})

// Функция валидации с подробными ошибками
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Ошибки в переменных окружения:')
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      
      console.error('\n📝 Создайте файл .env.local с требуемыми переменными:')
      console.error('NEXTAUTH_SECRET=your-secret-here')
      console.error('DATABASE_URL=postgresql://...')
      console.error('OPENAI_API_KEY=sk-proj-...')
      
      throw new Error('Invalid environment variables')
    }
    throw error
  }
}

// Экспортируем валидированные переменные
export const env = validateEnv()

// Проверяем доступность критических сервисов
export const serviceAvailability = {
  database: !!env.DATABASE_URL && !env.DATABASE_URL.includes('placeholder'),
  openai: !!env.OPENAI_API_KEY && env.OPENAI_API_KEY.startsWith('sk-'),
  googleAuth: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  cloudflareR2: !!(env.R2_ENDPOINT && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME),
  upstashRedis: !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
}

// Логируем статус сервисов (только в development)
if (env.NODE_ENV === 'development') {
  console.log('🔧 Статус сервисов:')
  console.log(`  Database: ${serviceAvailability.database ? '✅' : '❌'}`)
  console.log(`  OpenAI: ${serviceAvailability.openai ? '✅' : '❌'}`)
  console.log(`  Google Auth: ${serviceAvailability.googleAuth ? '✅' : '❌'}`)
  console.log(`  Cloudflare R2: ${serviceAvailability.cloudflareR2 ? '✅' : '❌'}`)
  console.log(`  Upstash Redis: ${serviceAvailability.upstashRedis ? '✅' : '❌'}`)
}