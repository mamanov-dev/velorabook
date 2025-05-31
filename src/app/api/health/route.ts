import { NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/prisma'
import { checkRedisHealth } from '@/lib/redis'

export async function GET() {
  try {
    const dbHealth = await checkDatabaseHealth()
    const redisHealth = await checkRedisHealth()
    
    const status = dbHealth && redisHealth ? 'healthy' : 'unhealthy'
    
    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth ? 'healthy' : 'unhealthy',
        redis: redisHealth ? 'healthy' : 'unhealthy',
      }
    }, { 
      status: status === 'healthy' ? 200 : 503 
    })
  } catch {
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed'
    }, { status: 503 })
  }
}