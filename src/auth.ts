import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'

// Типы для пользователя
export interface User {
  id: string
  name: string
  email: string
  image?: string
  createdAt?: string
  isVerified?: boolean
}

// Простая база данных пользователей в памяти (в продакшене используйте настоящую БД)
const users: Array<User & { password?: string }> = [
  {
    id: '1',
    name: 'Demo User',
    email: 'demo@velorabook.com',
    password: '$2a$12$LqqmYqJrqVkOlr32vBb4CuFqxqbVb9Oe3ZyXf5AKyFV.ZiXrB3CDy', // password: demo123
    createdAt: new Date().toISOString(),
    isVerified: true
  }
]

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = users.find(u => u.email === credentials.email)
        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  callbacks: {
    async jwt({ user, token }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Автоматически создаем пользователя при входе через Google
        const existingUser = users.find(u => u.email === user.email)
        if (!existingUser && user.email && user.name) {
          const newUser: User & { password?: string } = {
            id: Date.now().toString(),
            name: user.name,
            email: user.email,
            image: user.image || undefined,
            createdAt: new Date().toISOString(),
            isVerified: true
          }
          users.push(newUser)
        }
      }
      return true
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
})

// Утилиты для работы с пользователями
export const userService = {
  async createUser(userData: { name: string; email: string; password: string }): Promise<User | null> {
    // Проверяем, не существует ли уже пользователь с таким email
    if (users.find(u => u.email === userData.email)) {
      throw new Error('Пользователь с таким email уже существует')
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(userData.password, 12)

    // Создаем нового пользователя
    const newUser: User & { password: string } = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      isVerified: false
    }

    users.push(newUser)

    // Возвращаем пользователя без пароля
    const { password, ...userWithoutPassword } = newUser
    return userWithoutPassword
  },

  async findByEmail(email: string): Promise<User | null> {
    const user = users.find(u => u.email === email)
    if (!user) return null
    
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  },

  async getAllUsers(): Promise<User[]> {
    return users.map(({ password, ...user }) => user)
  }
}