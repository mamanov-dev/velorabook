// src/services/user.ts
import bcrypt from 'bcryptjs'
import { serviceAvailability } from '@/lib/env-safe'

export const userService = {
  async createUser(userData: { name: string; email: string; password: string }) {
    if (!serviceAvailability.database) {
      throw new Error('Database not available. Registration temporarily disabled.')
    }

    try {
      const { prisma } = await import('@/lib/prisma')

      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email.toLowerCase() },
      })

      if (existingUser) {
        throw new Error('User with this email already exists')
      }

      const hashedPassword = await bcrypt.hash(userData.password, 14)

      const user = await prisma.user.create({
        data: {
          name: userData.name.trim(),
          email: userData.email.toLowerCase().trim(),
          password: hashedPassword,
          isVerified: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          isVerified: true,
        },
      })

      console.log('✅ New user created:', user.email)
      return user
    } catch (error) {
      console.error('❌ User creation error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to create user')
    }
  },

  async getUserById(id: string) {
    if (!serviceAvailability.database) {
      if (id === 'demo-user-id') {
        return {
          id: 'demo-user-id',
          email: 'demo@velorabook.com',
          name: 'Demo User',
          image: null,
          isVerified: true,
        }
      }
      return null
    }

    try {
      const { prisma } = await import('@/lib/prisma')
      return await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          isVerified: true,
          createdAt: true,
        },
      })
    } catch (error) {
      console.error('❌ Error fetching user:', error)
      return null
    }
  },
}
