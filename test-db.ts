import { prisma } from './src/lib/prisma'

async function test() {
  try {
    console.log('Тестируем подключение к БД…')
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ База данных работает!')

    const users = await prisma.user.count()
    console.log(`👥 Пользователи в БД: ${users}`)
  } catch (e) {
    console.error('❌ Ошибка:', e)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

test()
