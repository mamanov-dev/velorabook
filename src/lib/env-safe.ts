// Безопасная загрузка переменных окружения для сборки на Vercel

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  
  if (!value && !defaultValue) {
    // Во время сборки не выбрасываем ошибку, только логируем
    if (process.env.NODE_ENV === 'production') {
      console.warn(`⚠️ Missing environment variable: ${key}`);
    }
    return '';
  }
  
  return value || defaultValue || '';
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  NEXTAUTH_SECRET: getEnvVar('NEXTAUTH_SECRET', 'development-secret'),
  NEXTAUTH_URL: getEnvVar('NEXTAUTH_URL'),
  DATABASE_URL: getEnvVar('DATABASE_URL', ''),
  OPENAI_API_KEY: getEnvVar('OPENAI_API_KEY', ''),
  
  // Google OAuth (optional)
  GOOGLE_CLIENT_ID: getEnvVar('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: getEnvVar('GOOGLE_CLIENT_SECRET'),
  
  // Redis (optional)
  REDIS_HOST: getEnvVar('REDIS_HOST', 'localhost'),
  REDIS_PORT: parseInt(getEnvVar('REDIS_PORT', '6379')),
  REDIS_PASSWORD: getEnvVar('REDIS_PASSWORD'),
  
  // Upstash Redis (optional)
  UPSTASH_REDIS_REST_URL: getEnvVar('UPSTASH_REDIS_REST_URL'),
  UPSTASH_REDIS_REST_TOKEN: getEnvVar('UPSTASH_REDIS_REST_TOKEN'),
  
  // R2 Storage (optional)
  R2_ENDPOINT: getEnvVar('R2_ENDPOINT'),
  R2_ACCESS_KEY_ID: getEnvVar('R2_ACCESS_KEY_ID'),
  R2_SECRET_ACCESS_KEY: getEnvVar('R2_SECRET_ACCESS_KEY'),
  R2_BUCKET_NAME: getEnvVar('R2_BUCKET_NAME'),
};

export const serviceAvailability = {
  database: !!env.DATABASE_URL && env.DATABASE_URL !== '',
  openai: !!env.OPENAI_API_KEY && env.OPENAI_API_KEY.startsWith('sk-'),
  googleAuth: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  cloudflareR2: !!(env.R2_ENDPOINT && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME),
  upstashRedis: !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
};

// Не выводим статус сервисов во время сборки
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  console.log('🔧 Service availability:', serviceAvailability);
}