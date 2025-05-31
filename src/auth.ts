import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserLoginSchema } from '@/lib/validation'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
          console.log('🔍 Auth attempt for:', credentials?.email)
          
          const validatedFields = UserLoginSchema.safeParse(credentials)
          if (!validatedFields.success) {
            console.log('❌ Validation failed')
            return null
          }

          const { email, password } = validatedFields.data

          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          })

          console.log('👤 User found:', !!user)

          if (!user || !user.password) {
            console.log('❌ No user or password')
            return null
          }

          const isValid = await bcrypt.compare(password, user.password)
          console.log('🔐 Password valid:', isValid)
          
          if (!isValid) {
            console.log('❌ Invalid password')
            return null
          }

          console.log('✅ Auth successful for:', user.email)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image ?? undefined, // Конвертируем null в undefined
          }
        } catch (error) {
          console.error('❌ Auth error:', error)
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
    async jwt({ user, token, trigger }) {
      console.log('JWT callback:', { user: !!user, token: !!token, trigger })
      
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
      }
      
      return token
    },
    
    async session({ session, token }) {
      console.log('Session callback:', { session: !!session, token: !!token })
      
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.image as string | undefined
      }
      
      console.log('Final session:', session)
      return session
    },
  },

  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
})

// Сервис для работы с пользователями
export const userService = {
  async createUser(userData: { name: string; email: string; password: string }) {
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