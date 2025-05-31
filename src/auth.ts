import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'

// Условный импорт Prisma только если это не build time
const isPrismaAvailable = process.env.DATABASE_URL && process.env.DATABASE_URL !== 'placeholder'

let prisma: any = null
let PrismaAdapter: any = null

if (isPrismaAvailable) {
  try {
    const prismaModule = require('@/lib/prisma')
    const adapterModule = require('@auth/prisma-adapter')
    prisma = prismaModule.prisma
    PrismaAdapter = adapterModule.PrismaAdapter
  } catch (error) {
    console.log('Prisma not available during build:', error)
  }
}

// Условный импорт validation только если Prisma доступен
let UserLoginSchema: any = null
if (isPrismaAvailable) {
  try {
    const validationModule = require('@/lib/validation')
    UserLoginSchema = validationModule.UserLoginSchema
  } catch (error) {
    console.log('Validation not available during build:', error)
  }
}

const authConfig: any = {
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
          // Fallback для build time
          if (!isPrismaAvailable || !prisma || !UserLoginSchema) {
            if (credentials?.email === 'demo@velorabook.com' && 
                credentials?.password === 'demo123') {
              return {
                id: 'demo-user-id',
                email: 'demo@velorabook.com',
                name: 'Demo User',
                image: undefined,
              }
            }
            return null
          }

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
    async jwt({ user, token }: { user?: any; token: any }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
      }
      return token
    },
    
    async session({ session, token }: { session: any; token: any }) {
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
}

// Добавляем PrismaAdapter только если доступен
if (isPrismaAvailable && PrismaAdapter && prisma) {
  authConfig.adapter = PrismaAdapter(prisma)
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

export const userService = {
  async createUser(userData: { name: string; email: string; password: string }) {
    if (!isPrismaAvailable || !prisma) {
      throw new Error('База данных недоступна')
    }

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
  }
}