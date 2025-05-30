import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { BookProvider } from '@/contexts/BookContext'
import { SessionProvider } from 'next-auth/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VeloraBook - Персональные книги с ИИ',
  description: 'Создавайте уникальные персональные книги с помощью искусственного интеллекта',
  keywords: 'книги, ИИ, персонализация, подарки, семья, романтика, дружба',
  authors: [{ name: 'VeloraBook Team' }],
  openGraph: {
    title: 'VeloraBook - Персональные книги с ИИ',
    description: 'Создавайте уникальные персональные книги с помощью искусственного интеллекта',
    type: 'website',
    locale: 'ru_RU',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <SessionProvider>
          <BookProvider>
            {children}
          </BookProvider>
        </SessionProvider>
      </body>
    </html>
  )
}