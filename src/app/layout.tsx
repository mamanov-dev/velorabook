import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ErrorBoundaryWrapper from '@/components/layout/ErrorBoundaryWrapper';

const inter = Inter({ subsets: ['latin'] });

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
    siteName: 'VeloraBook',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VeloraBook - Персональные книги с ИИ',
    description: 'Создавайте уникальные персональные книги с помощью искусственного интеллекта',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="dns-prefetch" href="//api.openai.com" />
        <link rel="dns-prefetch" href="//accounts.google.com" />
      </head>
      <body className={inter.className}>
        <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>

        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('requestIdleCallback' in window) {
                  requestIdleCallback(() => {
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.as = 'font';
                    link.type = 'font/woff2';
                    link.crossOrigin = 'anonymous';
                    link.href = '/fonts/inter-var.woff2';
                    document.head.appendChild(link);
                  });
                }

                window.addEventListener('load', () => {
                  if ('performance' in window && 'PerformanceObserver' in window) {
                    const observer = new PerformanceObserver((list) => {
                      const entries = list.getEntries();
                      entries.forEach((entry) => {
                        if (entry.entryType === 'navigation') {
                          console.log('Page load time:', entry.loadEventEnd - entry.loadEventStart);
                        }
                      });
                    });
                    observer.observe({ entryTypes: ['navigation'] });
                  }
                });
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
