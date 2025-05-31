import 'dotenv/config'                       // читает .env
import { checkRedisHealth, CacheService } from './src/lib/redis'

async function testRedis() {
  console.log('🔍 Проверяем Redis…')
  const ok = await checkRedisHealth()
  console.log('Redis health:', ok ? '✅ OK' : '❌ FAIL')

  if (ok) {
    await CacheService.set('test', { message: 'Hello Redis!' })
    const cached = await CacheService.get('test')
    console.log('Cache test:', cached)
  }
  process.exit(0)
}

testRedis()
