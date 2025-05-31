const { prisma } = require('./src/lib/prisma.ts');

async function test() {
  try {
    console.log('Тестируем подключение к БД...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ База данных работает!');
    
    const userCount = await prisma.user.count();
    console.log(`📊 Пользователей в БД: ${userCount}`);
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();