import type { NextConfig } from "next";
// import { env } from './src/lib/env-safe'; // УБРАНО - вызывало ошибки сборки
const path = require('path');

// Опциональный bundle analyzer - только если доступен
let withBundleAnalyzer: any;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (error) {
  // Bundle analyzer не установлен - используем identity function
  withBundleAnalyzer = (config: NextConfig) => config;
  console.log('⚠️ @next/bundle-analyzer not available, skipping bundle analysis');
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src', 'prisma', 'scripts'],
  },

  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },

  serverExternalPackages: [
    '@prisma/client',
    'bcryptjs',
    'sharp',
  ],

  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    emotion: false,
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  async headers() {
    const securityHeaders = [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
    ];

    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self'",
          "connect-src 'self' https:",
          "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "manifest-src 'self'",
        ].join('; ')
      });
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    return [
      { source: '/login', destination: '/auth/signin', permanent: true },
      { source: '/register', destination: '/auth/signup', permanent: true },
      { source: '/books', destination: '/dashboard', permanent: false },
    ];
  },

  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: '/api/:path*' },
    ];
  },

  compress: true,
  productionBrowserSourceMaps: false,

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/auth': path.resolve(__dirname, './src/auth'),
      '@/services': path.resolve(__dirname, './src/services'),
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    if (!dev && !isServer) {
      config.optimization.providedExports = true;
      config.optimization.usedExports = true;
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

    config.plugins.push(
      new webpack.DefinePlugin({
        '__BUILD_ID__': JSON.stringify(buildId),
        '__BUILD_DATE__': JSON.stringify(new Date().toISOString()),
        '__IS_DEV__': JSON.stringify(dev),
        '__IS_SERVER__': JSON.stringify(isServer),
      })
    );

    return config;
  },

  serverRuntimeConfig: {
    mySecret: 'secret',
  },

  publicRuntimeConfig: {
    version: '0.2.0',
    buildDate: new Date().toISOString(),
  },

  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  trailingSlash: false,

  env: {
    CUSTOM_KEY: 'value',
    BUILD_TIME: new Date().toISOString(),
  },

  excludeDefaultMomentLocales: true,

  ...(process.env.VERCEL && {
    generateBuildId: async () => {
      return process.env.VERCEL_GIT_COMMIT_SHA || 'local-build';
    },
  }),

  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = withBundleAnalyzer(nextConfig);
export default nextConfig;