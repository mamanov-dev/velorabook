import Redis from 'ioredis';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis as UpstashRedis } from '@upstash/redis';
import { env, serviceAvailability } from '@/lib/env';

// Локальный Redis с улучшенными настройками
const createLocalRedis = () => {
  const redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    connectTimeout: 10000,
    commandTimeout: 5000,
  });

  // Обработчики событий
  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redis.on('ready', () => {
    console.log('🚀 Redis ready for commands');
  });

  redis.on('error', (error) => {
    console.error('❌ Redis error:', error.message);
  });

  redis.on('close', () => {
    console.log('🔌 Redis connection closed');
  });

  redis.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
  });

  return redis;
};

// Upstash Redis для продакшена
const createUpstashRedis = () => {
  if (!serviceAvailability.upstashRedis) {
    console.warn('⚠️ Upstash Redis not configured');
    return null;
  }

  try {
    return new UpstashRedis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
      retry: {
        retries: 3,
        backoff: (retryCount: number) => Math.min(retryCount * 100, 3000),
      },
    });
  } catch (error) {
    console.error('❌ Failed to create Upstash Redis:', error);
    return null;
  }
};

// Выбираем подходящий Redis
let redisInstance: Redis | UpstashRedis | null = null;

try {
  if (env.NODE_ENV === 'production' && serviceAvailability.upstashRedis) {
    redisInstance = createUpstashRedis();
    console.log('🌐 Using Upstash Redis for production');
  } else {
    redisInstance = createLocalRedis();
    console.log('🏠 Using local Redis for development');
  }
} catch (error) {
  console.error('❌ Failed to initialize Redis:', error);
  redisInstance = null;
}

export const redis = redisInstance;

// Улучшенный Cache Service с error handling
export class CacheService {
  // Проверка доступности Redis
  static async isAvailable(): Promise<boolean> {
    if (!redis) return false;
    
    try {
      if (redis instanceof Redis) {
        await redis.ping();
      } else {
        await redis.ping();
      }
      return true;
    } catch (error) {
      console.warn('⚠️ Redis not available:', error);
      return false;
    }
  }

  // Установка значения с fallback
  static async set(key: string, value: unknown, ttl = 3600): Promise<boolean> {
    if (!redis) {
      console.warn('⚠️ Redis not available for set operation');
      return false;
    }

    try {
      const data = JSON.stringify(value);
      
      if (redis instanceof Redis) {
        await redis.setex(key, ttl, data);
      } else {
        await redis.set(key, data, { ex: ttl });
      }
      
      console.log(`✅ Cache set: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error('❌ Cache set error:', error);
      return false;
    }
  }

  // Получение значения с fallback
  static async get<T = unknown>(key: string): Promise<T | null> {
    if (!redis) {
      console.warn('⚠️ Redis not available for get operation');
      return null;
    }

    try {
      const cached = await redis.get(key);
      
      if (!cached) {
        console.log(`🔍 Cache miss: ${key}`);
        return null;
      }

      const parsed = JSON.parse(cached as string) as T;
      console.log(`✅ Cache hit: ${key}`);
      return parsed;
    } catch (error) {
      console.error('❌ Cache get error:', error);
      return null;
    }
  }

  // Удаление ключа
  static async delete(key: string): Promise<boolean> {
    if (!redis) {
      console.warn('⚠️ Redis not available for delete operation');
      return false;
    }

    try {
      await redis.del(key);
      console.log(`🗑️ Cache deleted: ${key}`);
      return true;
    } catch (error) {
      console.error('❌ Cache delete error:', error);
      return false;
    }
  }

  // Массовое удаление по паттерну (только для локального Redis)
  static async deletePattern(pattern: string): Promise<number> {
    if (!redis || !(redis instanceof Redis)) {
      console.warn('⚠️ Pattern deletion only available for local Redis');
      return 0;
    }

    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;

      const result = await redis.del(...keys);
      console.log(`🗑️ Cache deleted ${result} keys with pattern: ${pattern}`);
      return result;
    } catch (error) {
      console.error('❌ Cache pattern delete error:', error);
      return 0;
    }
  }

  // Получение TTL ключа
  static async getTTL(key: string): Promise<number | null> {
    if (!redis) return null;

    try {
      const ttl = await redis.ttl(key);
      return ttl === -1 ? null : ttl; // -1 означает без TTL
    } catch (error) {
      console.error('❌ Cache TTL error:', error);
      return null;
    }
  }

  // Проверка существования ключа
  static async exists(key: string): Promise<boolean> {
    if (!redis) return false;

    try {
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('❌ Cache exists error:', error);
      return false;
    }
  }

  // Атомарное увеличение счетчика
  static async increment(key: string, delta = 1, ttl?: number): Promise<number | null> {
    if (!redis) return null;

    try {
      let result: number;
      
      if (redis instanceof Redis) {
        result = await redis.incrby(key, delta);
        if (ttl && result === delta) {
          // Устанавливаем TTL только при первом создании ключа
          await redis.expire(key, ttl);
        }
      } else {
        // Для Upstash Redis
        result = await redis.incrby(key, delta);
        if (ttl && result === delta) {
          await redis.expire(key, ttl);
        }
      }

      return result;
    } catch (error) {
      console.error('❌ Cache increment error:', error);
      return null;
    }
  }
}

// Rate Limiting с улучшенной конфигурацией
export const createRateLimiter = (
  requests: number, 
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`, 
  identifier = 'default'
) => {
  if (!serviceAvailability.upstashRedis || env.NODE_ENV !== 'production') {
    console.warn(`⚠️ Using in-memory rate limiter for ${identifier}`);
    return new SimpleRateLimiter(requests, window);
  }

  const upstashRedis = redis as UpstashRedis;
  
  return new Ratelimit({
    redis: upstashRedis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: `ratelimit:${identifier}`,
  });
};

// Предконфигурированные rate limiters
export const rateLimiters = {
  // API генерации книг - 3 книги в час
  bookGeneration: createRateLimiter(3, '1 h', 'book-generation'),
  
  // Регистрация пользователей - 5 регистраций в час с одного IP
  userRegistration: createRateLimiter(5, '1 h', 'user-registration'),
  
  // Загрузка изображений - 20 загрузок в 10 минут
  imageUpload: createRateLimiter(20, '10 m', 'image-upload'),
  
  // API запросы общие - 100 запросов в минуту
  generalApi: createRateLimiter(100, '1 m', 'general-api'),
  
  // Отчеты об ошибках - 10 отчетов в минуту
  errorReports: createRateLimiter(10, '1 m', 'error-reports'),
};

// Улучшенный простой rate limiter для fallback
export class SimpleRateLimiter {
  private requests = new Map<string, number[]>();
  private windowMs: number;
  private maxRequests: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxRequests: number, window: string) {
    this.maxRequests = maxRequests;
    this.windowMs = this.parseWindow(window);
    
    // Автоматическая очистка старых записей каждые 5 минут
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private parseWindow(window: string): number {
    const match = window.match(/^(\d+)\s*(s|m|h)$/);
    if (!match) throw new Error(`Invalid window format: ${window}`);
    
    const [, amount, unit] = match;
    const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000 };
    
    return parseInt(amount) * multipliers[unit as keyof typeof multipliers];
  }

  async limit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    const validRequests = userRequests.filter((time: number) => time > windowStart);
    
    const success = validRequests.length < this.maxRequests;
    const remaining = Math.max(0, this.maxRequests - validRequests.length);
    const reset = new Date(now + this.windowMs);
    
    if (success) {
      validRequests.push(now);
      this.requests.set(identifier, validRequests);
    }
    
    return {
      success,
      limit: this.maxRequests,
      remaining: success ? remaining - 1 : remaining,
      reset,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    
    Array.from(this.requests.entries()).forEach(([identifier, requests]) => {
      const validRequests = requests.filter((time: number) => time > cutoff);
      
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    });
    
    console.log(`🧹 Rate limiter cleanup: ${this.requests.size} active identifiers`);
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

// Проверка здоровья Redis
export async function checkRedisHealth(): Promise<{
  available: boolean;
  type: 'local' | 'upstash' | 'none';
  latency?: number;
  error?: string;
}> {
  if (!redis) {
    return { available: false, type: 'none', error: 'Redis not initialized' };
  }

  try {
    const start = Date.now();
    
    if (redis instanceof Redis) {
      await redis.ping();
      const latency = Date.now() - start;
      return { available: true, type: 'local', latency };
    } else {
      await redis.ping();
      const latency = Date.now() - start;
      return { available: true, type: 'upstash', latency };
    }
  } catch (error) {
    return { 
      available: false, 
      type: redis instanceof Redis ? 'local' : 'upstash',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Утилиты для кеширования
export const CacheKeys = {
  // Пользователи
  user: (id: string) => `user:${id}`,
  userSession: (sessionToken: string) => `session:${sessionToken}`,
  
  // Книги
  book: (id: string) => `book:${id}`,
  userBooks: (userId: string) => `user_books:${userId}`,
  
  // Rate limiting
  rateLimit: (type: string, identifier: string) => `rl:${type}:${identifier}`,
  
  // Системные
  healthCheck: () => 'health:redis',
  apiStats: () => 'stats:api',
  
  // Временные данные
  tempData: (id: string) => `temp:${id}`,
  uploadToken: (token: string) => `upload:${token}`,
} as const;

// Graceful shutdown
if (redis instanceof Redis) {
  process.on('SIGINT', async () => {
    console.log('🔌 Closing Redis connection...');
    await redis.quit();
    console.log('✅ Redis connection closed');
  });
}