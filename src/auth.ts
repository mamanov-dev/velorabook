import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'

// Проверка доступности базы данных
const isDatabaseAvailable = process.env.DATABASE_URL && 
  process.env.DATABASE_URL !== 'placeholder' && 
  !process.env.DATABASE_URL.includes('placeholder')

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt'
  },
  
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          // Демо пользователь для build time и fallback
          if (credentials?.email === 'demo@velorabook.com' && 
              credentials?.password === 'demo123') {
            return {
              id: 'demo-user-id',
              email: 'demo@velorabook.com',
              name: 'Demo User',
              image: undefined,
            }
          }

          // Если база недоступна, только демо пользователь
          if (!isDatabaseAvailable) {
            return null
          }

          // Динамический импорт для продакшена
          const { prisma } = await import('@/lib/prisma')
          const { UserLoginSchema } = await import('@/lib/validation')

          const validatedFields = UserLoginSchema.safeParse(credentials)
          if (!validatedFields.success) return null

          const { email, password } = validatedFields.data

          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          })

          if (!user || !user.password) return null

          const isValid = await bcrypt.compare(password, user.password)
          if (!isValid) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image ?? undefined,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  callbacks: {
    async jwt({ user, token }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
      }
      return token
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.image as string | undefined
      }
      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
})

export const userService = {
  async createUser(userData: { name: string; email: string; password: string }) {
    if (!isDatabaseAvailable) {
      throw new Error('Регистрация временно недоступна')
    }

    try {
      const { prisma } = await import('@/lib/prisma')
      
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email.toLowerCase() }
      })

      if (existingUser) {
        throw new Error('Пользователь с таким email уже существует')
      }

      const hashedPassword = await bcrypt.hash(userData.password, 12)

      return await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email.toLowerCase(),
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        }
      })
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Ошибка создания пользователя')
    }
  }
}