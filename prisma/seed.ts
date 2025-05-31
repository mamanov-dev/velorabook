import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Заполняем базу данных...')

  // Демо пользователь
  const hashedPassword = await bcrypt.hash('demo123', 12)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@velorabook.com' },
    update: {},
    create: {
      email: 'demo@velorabook.com',
      name: 'Demo User',
      password: hashedPassword,
      isVerified: true,
    },
  })

  console.log('✅ Демо пользователь создан:', demoUser.email)
  console.log('🔑 Email: demo@velorabook.com')
  console.log('🔑 Password: demo123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })